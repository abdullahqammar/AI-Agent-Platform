import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { test } from "node:test";
import { createConnection } from "../src/db/connection.ts";

test("Better Auth endpoints persist and invalidate local PostgreSQL sessions", async (t) => {
  process.loadEnvFile(".env.local");
  assert.equal(process.env.BETTER_AUTH_URL, "http://localhost:3000");
  const client = createConnection();
  const email = `agentflow-test-${randomUUID()}@example.com`;
  const password = randomBytes(32).toString("base64url");
  const origin = "http://localhost:3000";
  let cookie = "";
  let userId = "";
  let sessionId = "";

  async function request(path: string, body?: Record<string, string>, cookies = cookie) {
    return fetch(`${origin}/api/auth/${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
        ...(cookies ? { Cookie: cookies } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(60000),
    });
  }

  function rememberCookies(response: Response) {
    const cookies = response.headers.getSetCookie();
    assert.ok(cookies.some(value => /HttpOnly/i.test(value) && /SameSite=Lax/i.test(value)), "Session cookie has HttpOnly and SameSite protection");
    cookie = cookies.map((value) => value.split(";")[0]).join("; ");
    assert.ok(Boolean(cookie), "Authentication cookie issued");
  }

  try {
    await t.test("register and persist a password account", async () => {
      const response = await request("sign-up/email", { email, password, name: "Disposable AgentFlow test" });
      assert.equal(response.status, 200);
      const data = await response.json();
      userId = data.user.id;
      rememberCookies(response);
      const rows = await client`
        SELECT u.id, a.provider_id, a.password IS NOT NULL AND a.password <> ${password} AS hashed
        FROM "user" u JOIN account a ON a.user_id=u.id WHERE u.email=${email}
      `;
      assert.equal(rows.length, 1);
      assert.equal(rows[0].id, userId);
      assert.equal(rows[0].provider_id, "credential");
      assert.equal(rows[0].hashed, true);
    });
    assert.ok(userId, "Registration required for subsequent tests");

    await t.test("log in with correct credentials", async () => {
      const response = await request("sign-in/email", { email, password }, "");
      assert.equal(response.status, 200);
      assert.equal((await response.json()).user.id, userId);
      rememberCookies(response);
    });

    await t.test("reject incorrect credentials", async () => {
      const response = await request("sign-in/email", { email, password: randomBytes(32).toString("base64url") }, "");
      assert.equal(response.status, 401);
    });

    await t.test("retrieve a persisted session across independent requests", async () => {
      for (let index = 0; index < 2; index++) {
        const response = await request("get-session");
        assert.equal(response.status, 200);
        const data = await response.json();
        assert.equal(data?.user?.id, userId);
        assert.ok(Boolean(data?.session?.id), "Session returned");
        if (sessionId) assert.equal(data.session.id, sessionId);
        sessionId = data.session.id;
        const rows = await client`SELECT id FROM session WHERE id=${sessionId} AND user_id=${userId}`;
        assert.equal(rows.length, 1);
      }
    });

    await t.test("logout invalidates the session even when its old cookie is replayed", async () => {
      const response = await request("sign-out", {});
      assert.equal(response.status, 200);
      const session = await request("get-session");
      assert.equal(session.status, 200);
      assert.equal(await session.json(), null);
      assert.equal((await client`SELECT id FROM session WHERE id=${sessionId}`).length, 0);
    });

    await t.test("duplicate registration safely rejects the existing email", async () => {
      const response = await request("sign-up/email", { email, password, name: "Duplicate disposable test" }, "");
      assert.ok(response.status >= 400 && response.status < 500, "Duplicate registration rejected");
      const data = await response.json();
      assert.ok(!data.token && !data.user, "No authenticated user or token returned");
      assert.equal((await client`SELECT id FROM "user" WHERE email=${email}`).length, 1);
      assert.equal((await client`SELECT id FROM account WHERE user_id=${userId}`).length, 1);
    });

    await t.test("deleting the disposable user cascades to accounts and sessions", async () => {
      const response = await request("sign-in/email", { email, password }, "");
      assert.equal(response.status, 200);
      rememberCookies(response);
      assert.ok((await client`SELECT id FROM session WHERE user_id=${userId}`).length > 0);
      assert.equal((await client`DELETE FROM "user" WHERE id=${userId} AND email=${email} RETURNING id`).length, 1);
      assert.equal((await client`SELECT id FROM account WHERE user_id=${userId}`).length, 0);
      assert.equal((await client`SELECT id FROM session WHERE user_id=${userId}`).length, 0);
      const session = await request("get-session");
      assert.equal(session.status, 200);
      assert.equal(await session.json(), null);
    });
  } finally {
    try {
      await client`DELETE FROM "user" WHERE email=${email}`;
      assert.equal((await client`SELECT id FROM "user" WHERE email=${email}`).length, 0);
    } finally {
      await client.end();
    }
  }
});
