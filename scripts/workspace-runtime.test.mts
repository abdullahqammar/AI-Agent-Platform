import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { test } from "node:test";
import { drizzle } from "drizzle-orm/postgres-js";
import { createConnection } from "../src/db/connection.ts";
import { createFirstWorkspace, workspaceDatabase, identityIssuer } from "../src/db/workspace.ts";
import { permissions } from "../src/db/permissions.ts";

test("authenticated workspace onboarding and tenant isolation", async (t) => {
  process.loadEnvFile(".env.local");
  assert.equal(process.env.BETTER_AUTH_URL, "http://localhost:3000");
  const client = createConnection();
  const db = drizzle(client);
  const origin = "http://localhost:3000";
  const users = [0, 1].map(() => ({
    email: `workspace-test-${randomUUID()}@example.com`,
    password: randomBytes(32).toString("base64url"), subject: "", cookie: "", business: "",
  }));
  const extraBusinesses = new Set<string>();
  const rollbackSubject = "rollback-" + randomUUID();
  let rollbackBusiness = "";
  const input = { businessName: "Disposable workspace " + randomUUID(), timezone: "Asia/Karachi", locationName: "Main office", address: "Test address" };

  async function request(path: string, user?: typeof users[number], body?: unknown, originHeader = origin) {
    return fetch(origin + path, {
      method: body === undefined ? "GET" : "POST", redirect: "manual",
      headers: { "Content-Type": "application/json", Origin: originHeader, ...(user?.cookie ? { Cookie: user.cookie } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(60000),
    });
  }
  async function pointsTo(path: string, destination: string, user?: typeof users[number]) {
    const response = await request(path, user);
    if (response.status >= 300 && response.status < 400) {
      assert.equal(response.headers.get("location"), destination);
    } else {
      // Suspense may stream the redirect instruction with an HTTP 200.
      assert.equal(response.status, 200);
      assert.ok((await response.text()).includes('url=' + destination), "Expected streamed redirect to " + destination);
    }
  }
  try {
    await t.test("anonymous pages and APIs deny workspace access", async () => {
      for (const path of ["/", "/dashboard", "/onboarding"]) await pointsTo(path, "/login");
      assert.equal((await request("/api/workspace?businessId=" + randomUUID())).status, 401);
      assert.equal((await request("/api/workspace", undefined, input)).status, 401);
      assert.equal((await request("/register")).status, 200);
      assert.equal((await request("/login")).status, 200);
    });
    await t.test("two users register and are directed to onboarding", async () => {
      for (const user of users) {
        const response = await request("/api/auth/sign-up/email", undefined, { email: user.email, password: user.password, name: "Workspace test user" });
        assert.equal(response.status, 200);
        user.subject = (await response.json()).user.id;
        user.cookie = response.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
        assert.ok(Boolean(user.cookie));
        await pointsTo("/dashboard", "/onboarding", user);
        assert.equal((await request("/onboarding", user)).status, 200);
        await pointsTo("/login", "/dashboard", user);
        await pointsTo("/register", "/dashboard", user);
      }
    });
    await t.test("identity mapping is idempotent under concurrent requests", async () => {
      const results = await Promise.all(Array.from({ length: 5 }, () => workspaceDatabase(client).identity(users[0].subject)));
      assert.equal(new Set(results.map(value => value.id)).size, 1);
      assert.ok(results.every(value => value.identityIssuer === identityIssuer && value.identitySubject === users[0].subject));
    });
    await t.test("invalid fields, identity substitution and cross-origin onboarding are rejected", async () => {
      for (const body of [
        { ...input, timezone: "PST" }, { ...input, businessName: "" }, { ...input, locationName: "" },
        { ...input, subject: users[1].subject }, { ...input, issuer: "attacker" },
        { ...input, businessId: randomUUID() }, { ...input, role: "Owner" },
      ]) assert.equal((await request("/api/workspace", users[0], body)).status, 400);
      assert.equal((await request("/api/workspace", users[0], input, "https://other.example")).status, 403);
    });
    await t.test("concurrent onboarding and retries return exactly one business per user", async () => {
      for (const user of users) {
        const responses = await Promise.all([request("/api/workspace", user, input), request("/api/workspace", user, input)]);
        assert.ok(responses.every(response => response.status === 200));
        const ids = await Promise.all(responses.map(async response => (await response.json()).businessId));
        assert.equal(ids[0], ids[1]);
        user.business = ids[0];
        const retry = await request("/api/workspace", user, input);
        assert.equal((await retry.json()).businessId, user.business);
      }
      assert.notEqual(users[0].business, users[1].business);
    });
    await t.test("dashboard links enforce membership in the requested workspace", async () => {
      const path = "/dashboard?businessId=" + users[0].business;
      const own = await (await request(path, users[0])).text();
      assert.ok(own.includes(input.businessName));
      const denied = await (await request(path, users[1])).text();
      assert.ok(denied.includes("Workspace access unavailable"));
      assert.ok(!denied.includes(input.businessName));
    });
    await t.test("additional workspace retries are idempotent and discovery is identity scoped", async () => {
      const key = randomUUID();
      const store = workspaceDatabase(client);
      const ids = await Promise.all([0, 1].map(async () => {
        const id = await store.create(users[0].subject, input, key);
        extraBusinesses.add(id);
        return id;
      }));
      assert.equal(ids[0], ids[1]);
      assert.notEqual(ids[0], users[0].business);
      assert.equal((await store.identity(users[0].subject)).homeBusinessId, users[0].business);
      assert.deepEqual(new Set((await store.listMemberships(users[0].subject)).map(m => m.businessId)),
        new Set([users[0].business, ids[0]]));
      assert.deepEqual(await store.listMemberships(users[1].subject), [{ businessId: users[1].business }]);
      assert.equal((await request("/api/workspace?businessId=" + ids[0], users[1])).status, 403);
    });
    await t.test("owner permissions, location, membership and audit are persisted once", async () => {
      for (const user of users) {
        const response = await request("/api/workspace?businessId=" + user.business, user);
        assert.equal(response.status, 200);
        const data = await response.json();
        assert.equal(data.business.name, input.businessName);
        assert.equal(data.role, "Owner");
        assert.equal(data.locations.length, 1);
        assert.equal(data.locations[0].timezone, input.timezone);
        await client.begin(async tx => {
          await tx`SELECT set_config('agentflow.business_id', ${user.business}, true)`;
          assert.equal((await tx`SELECT id FROM business_memberships WHERE business_id=${user.business} AND active`).length, 1);
          assert.equal((await tx`SELECT id FROM audit_events WHERE business_id=${user.business} AND action='workspace.created'`).length, 1);
          const granted = await tx`SELECT permission_key FROM role_permissions WHERE business_id=${user.business}`;
          assert.deepEqual(granted.map(row => row.permission_key).sort(), Object.values(permissions).sort());
        });
        const dashboard = await request("/dashboard", user);
        assert.ok((await dashboard.text()).includes(input.businessName));
        await pointsTo("/onboarding", "/dashboard", user);
      }
    });
    await t.test("cross-business IDs, missing membership and revoked permissions deny access", async () => {
      assert.equal((await request("/api/workspace?businessId=" + users[1].business, users[0])).status, 403);
      assert.equal((await request("/api/workspace?businessId=" + users[0].business, users[1])).status, 403);
      assert.equal((await request("/api/workspace?businessId=" + randomUUID(), users[0])).status, 403);
      const user = users[0];
      try {
        await client.begin(async tx => {
          await tx`SELECT set_config('agentflow.business_id', ${user.business}, true)`;
          await tx`UPDATE business_memberships SET active=false WHERE business_id=${user.business}`;
        });
        assert.equal((await request("/api/workspace?businessId=" + user.business, user)).status, 403);
      } finally {
        await client.begin(async tx => {
          await tx`SELECT set_config('agentflow.business_id', ${user.business}, true)`;
          await tx`UPDATE business_memberships SET active=true WHERE business_id=${user.business}`;
        });
      }
      try {
        await client.begin(async tx => {
          await tx`SELECT set_config('agentflow.business_id', ${user.business}, true)`;
          await tx`DELETE FROM role_permissions WHERE business_id=${user.business}`;
        });
        assert.equal((await request("/api/workspace?businessId=" + user.business, user)).status, 403);
      } finally {
        await client.begin(async tx => {
          await tx`SELECT set_config('agentflow.business_id', ${user.business}, true)`;
          await tx`INSERT INTO role_permissions (business_id,role_id,permission_key)
            SELECT business_id,id,${permissions.workspaceRead} FROM roles WHERE business_id=${user.business}`;
        });
      }
    });
    await t.test("failure after workspace creation rolls back all records and identity", async () => {
      const expected = new Error("Intentional transaction failure");
      await assert.rejects(db.transaction(async tx => {
        rollbackBusiness = await createFirstWorkspace(tx, rollbackSubject, input);
        throw expected;
      }), error => error === expected);
      await client.begin(async tx => {
        await tx`SELECT set_config('agentflow.business_id', ${rollbackBusiness}, true),
          set_config('agentflow.identity_issuer', ${identityIssuer}, true),
          set_config('agentflow.identity_subject', ${rollbackSubject}, true)`;
        for (const table of ["businesses", "roles", "role_permissions", "business_locations", "business_memberships", "audit_events"]) {
          const rows = await tx.unsafe('SELECT id FROM "' + table + '" WHERE ' + (table === "businesses" ? "id" : "business_id") + '=$1', [rollbackBusiness]);
          assert.equal(rows.length, 0);
        }
        assert.equal((await tx`SELECT id FROM users WHERE identity_subject=${rollbackSubject} AND identity_issuer=${identityIssuer}`).length, 0);
      });
    });
    await t.test("logout and later login retain workspace membership", async () => {
      const user = users[0];
      assert.equal((await request("/api/auth/sign-out", user, {})).status, 200);
      assert.equal((await request("/api/workspace?businessId=" + user.business, user)).status, 401);
      const response = await request("/api/auth/sign-in/email", undefined, { email: user.email, password: user.password });
      assert.equal(response.status, 200);
      user.cookie = response.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
      assert.equal((await request("/api/workspace?businessId=" + user.business, user)).status, 200);
    });
  } finally {
    try {
      for (const user of users) {
        if (user.subject) await client.begin(async tx => {
          await tx`SELECT set_config('agentflow.identity_issuer', ${identityIssuer}, true), set_config('agentflow.identity_subject', ${user.subject}, true)`;
          const [identity] = await tx`SELECT home_business_id FROM users WHERE identity_subject=${user.subject} AND identity_issuer=${identityIssuer}`;
          const owned = [identity?.home_business_id, ...(user === users[0] ? extraBusinesses : [])].filter(Boolean);
          for (const business of owned) {
            await tx`SELECT set_config('agentflow.business_id', ${business}, true)`;
            await tx`UPDATE users SET home_business_id=null WHERE identity_subject=${user.subject} AND identity_issuer=${identityIssuer}`;
            for (const table of ["audit_events", "business_memberships", "role_permissions", "business_locations", "roles"]) {
              await tx.unsafe('DELETE FROM "' + table + '" WHERE business_id=$1', [business]);
            }
            await tx`DELETE FROM businesses WHERE id=${business}`;
          }
          await tx`DELETE FROM users WHERE identity_subject=${user.subject} AND identity_issuer=${identityIssuer}`;
        });
        await client`DELETE FROM "user" WHERE email=${user.email}`;
      }
    } finally { await client.end(); }
  }
});
