import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { eq } from "drizzle-orm";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import { createConnection } from "../src/db/connection.ts";
import * as schema from "../src/db/schema.ts";
import { createTenantAccess, TenantAccessDenied } from "../src/db/tenant.ts";

function postgresError(code: string, constraint?: string) {
  return (error: unknown) => {
    const cause = (error as Error).cause as { code?: string; constraint_name?: string } | undefined;
    return cause?.code === code && (!constraint || cause.constraint_name === constraint);
  };
}

test("AgentFlow schema and tenant boundaries", async (t) => {
  delete process.env.DATABASE_URL;
  process.loadEnvFile(".env.local");
  const client = createConnection();
  const issuer = "agentflow-db-test";
  const subject = randomUUID();
  const user = randomUUID();
  const permission = `test:${subject}`;
  const businesses = [randomUUID(), randomUUID()];
  const roles = [randomUUID(), randomUUID()];
  const customers = [randomUUID(), randomUUID()];
  const [a, b] = businesses;
  const [ownCustomer, otherCustomer] = customers;
  const request = { identity: { issuer, subject }, businessId: a };
  const otherCatalogue = randomUUID();
  const ownAgent = randomUUID();
  let seeded = false;

  try {
    await t.test("catalog matches the Drizzle schema", async () => {
      const [target] = await client`
        SELECT current_database() = 'agentflow_dev' AND current_user = 'agentflow_app'
          AND session_user = 'agentflow_app' AND NOT (rolsuper OR rolbypassrls) AS verified
        FROM pg_roles WHERE rolname = current_user
      `;
      assert.equal(target.verified, true);
      const tables = await client`
        SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity,
          (SELECT count(*) FROM pg_constraint WHERE conrelid = c.oid AND contype = 'f') AS fks,
          (SELECT count(*) FROM pg_constraint WHERE conrelid = c.oid AND contype = 'u') AS uniques,
          (SELECT count(*) FROM pg_constraint WHERE conrelid = c.oid AND contype = 'c') AS checks,
          (SELECT count(*) FROM pg_index WHERE indrelid = c.oid AND indisvalid) AS indexes,
          (SELECT count(*) FROM pg_policy WHERE polrelid = c.oid) AS policies
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r'
      `;
      for (const table of Object.values(schema).filter((value) => value instanceof PgTable)) {
        const config = getTableConfig(table);
        const row = tables.find((entry) => entry.relname === config.name);
        assert.ok(row, config.name);
        assert.equal(row.relrowsecurity, config.enableRLS, config.name);
        assert.equal(row.relforcerowsecurity, config.enableRLS, config.name);
        assert.equal(Number(row.policies), Number(config.enableRLS) + Number(config.name === "business_memberships"), config.name);
        assert.equal(Number(row.fks), config.foreignKeys.length, config.name);
        assert.equal(Number(row.uniques), config.uniqueConstraints.length, config.name);
        assert.equal(Number(row.checks), config.checks.length, config.name);
        assert.equal(Number(row.indexes), config.indexes.length + config.uniqueConstraints.length + 1, config.name);
      }
    });

    await client.begin(async (tx) => {
      await tx`SELECT set_config('agentflow.identity_issuer', ${issuer}, true),
        set_config('agentflow.identity_subject', ${subject}, true)`;
      await tx`INSERT INTO users (id, identity_issuer, identity_subject) VALUES (${user}, ${issuer}, ${subject})`;
      await tx`INSERT INTO permissions (key) VALUES (${permission})`;
      for (const [index, business] of businesses.entries()) {
        await tx`SELECT set_config('agentflow.business_id', ${business}, true)`;
        await tx`INSERT INTO businesses (id, name, timezone) VALUES (${business}, 'Test business', 'Asia/Karachi')`;
        await tx`INSERT INTO roles (id, business_id, name) VALUES (${roles[index]}, ${business}, 'Test role')`;
        await tx`INSERT INTO customers (id, business_id) VALUES (${customers[index]}, ${business})`;
      }
      await tx`SELECT set_config('agentflow.business_id', ${b}, true)`;
      await tx`INSERT INTO knowledge_documents(id,business_id,title,source_ref,catalogue_items)
        VALUES(${otherCatalogue},${b},'Foreign catalogue','catalogue-import','[]'::jsonb)`;
      await tx`SELECT set_config('agentflow.business_id', ${a}, true)`;
      await tx`INSERT INTO agents(id,business_id,name) VALUES (${ownAgent},${a},'Test assistant')`;
      await tx`INSERT INTO business_memberships (business_id, user_id, role_id) VALUES (${a}, ${user}, ${roles[0]})`;
      await tx`INSERT INTO role_permissions (business_id, role_id, permission_key) VALUES (${a}, ${roles[0]}, ${permission})`;
    });
    seeded = true;

    const withTenant = createTenantAccess(client);
    await t.test("authorized reads and cross-tenant ID substitution", async () => {
      await withTenant(request, permission, async ({ tx }) => {
        const rows = await tx.select().from(schema.customers);
        assert.deepEqual(rows.map(({ id }) => id), [ownCustomer]);
        assert.deepEqual(await tx.select().from(schema.customers).where(eq(schema.customers.id, otherCustomer)), []);
        assert.deepEqual(await tx.update(schema.customers).set({ name: "Denied" })
          .where(eq(schema.customers.id, otherCustomer)).returning(), []);
      });
      assert.equal((await client`SELECT id FROM customers WHERE id IN (${ownCustomer}, ${otherCustomer})`).length, 0);
    });

    await t.test("tenant, identity and permission substitution are denied", async () => {
      const fail = async () => assert.fail("Unauthorized operation ran");
      await assert.rejects(withTenant({ ...request, businessId: b }, permission, fail), TenantAccessDenied);
      await assert.rejects(withTenant({
        ...request, identity: { issuer: "another-issuer", subject },
      }, permission, fail), TenantAccessDenied);
      await assert.rejects(withTenant(request, "test:missing", fail), TenantAccessDenied);
    });

    await t.test("RLS rejects cross-tenant inserts", async () => {
      await assert.rejects(withTenant(request, permission, async ({ tx }) => {
        await tx.insert(schema.customers).values({ businessId: b });
      }), postgresError("42501"));
    });

    await t.test("foreign keys reject cross-tenant links", async () => {
      await assert.rejects(withTenant(request, permission, async ({ tx }) => {
        await tx.update(schema.memberships).set({ roleId: roles[1] })
          .where(eq(schema.memberships.userId, user));
      }), postgresError("23503", "business_memberships_role_tenant_fk"));
    });

    await t.test("a workspace cannot discover or grant another workspace's catalogue", async () => {
      await withTenant(request, permission, async ({ tx }) => {
        assert.deepEqual(await tx.select().from(schema.knowledgeDocuments).where(eq(schema.knowledgeDocuments.id, otherCatalogue)), []);
      });
      await assert.rejects(withTenant(request, permission, async ({ tx }) => {
        await tx.insert(schema.agentKnowledge).values({ businessId: a, agentId: ownAgent, documentId: otherCatalogue });
      }), postgresError("23503", "agent_knowledge_document_tenant_fk"));
    });

    await t.test("catalogue history cannot attach another workspace's snapshot source", async () => {
      await assert.rejects(withTenant(request, permission, async ({ tx, membershipId }) => {
        await tx.insert(schema.catalogueRefreshes).values({
          businessId: a, documentId: otherCatalogue, membershipId, sourceRevision: 1,
          previousItems: [], previousImport: new Date(), added: 0, changed: 1, removed: 0,
        });
      }), postgresError("23503", "catalogue_refresh_source_fk"));
    });

    await t.test("timezone validation rejects abbreviations", async () => {
      await assert.rejects(withTenant(request, permission, async ({ tx }) => {
        await tx.insert(schema.locations).values({ businessId: a, name: "Test location", timezone: "PST" });
      }), postgresError("23514"));
    });
  } finally {
    try {
      if (seeded) await client.begin(async (tx) => {
        for (const business of businesses) {
          await tx`SELECT set_config('agentflow.business_id', ${business}, true)`;
          await tx`DELETE FROM knowledge_documents WHERE id = ${otherCatalogue} AND business_id = ${business}`;
          await tx`DELETE FROM agents WHERE id = ${ownAgent} AND business_id = ${business}`;
          await tx`DELETE FROM role_permissions WHERE business_id = ${business}`;
          await tx`DELETE FROM business_memberships WHERE business_id = ${business}`;
          await tx`DELETE FROM customers WHERE business_id = ${business}`;
          await tx`DELETE FROM roles WHERE business_id = ${business}`;
          await tx`DELETE FROM businesses WHERE id = ${business}`;
        }
        await tx`SELECT set_config('agentflow.identity_issuer', ${issuer}, true),
          set_config('agentflow.identity_subject', ${subject}, true)`;
        await tx`DELETE FROM users WHERE id = ${user}`;
        await tx`DELETE FROM permissions WHERE key = ${permission}`;
      });
    } finally {
      await client.end();
    }
  }
});
