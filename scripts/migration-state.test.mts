import assert from "node:assert/strict";
import { test } from "node:test";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import { createConnection } from "../src/db/connection.ts";
import * as tenantSchema from "../src/db/schema.ts";
import * as authSchema from "../src/db/auth-schema.ts";
import { permissions } from "../src/db/permissions.ts";

test("local migration journal, RLS and permission catalog match application schema", async () => {
  process.loadEnvFile(".env.local");
  const client = createConnection();
  try {
    const [target] = await client`
      SELECT current_database() AS database, current_user AS role,
        current_setting('server_version') AS version, rolsuper, rolbypassrls
      FROM pg_roles WHERE rolname=current_user
    `;
    assert.equal(target.database, "agentflow_dev");
    assert.equal(target.role, "agentflow_app");
    assert.equal(target.version, "18.4");
    assert.equal(target.rolsuper, false);
    assert.equal(target.rolbypassrls, false);
    const migrations = readMigrationFiles({ migrationsFolder: "./drizzle" });
    const history = await client`SELECT created_at, hash FROM public.__drizzle_migrations ORDER BY created_at`;
    assert.equal(history.length, migrations.length);
    history.forEach((row, index) => {
      assert.equal(Number(row.created_at), migrations[index].folderMillis);
      assert.equal(row.hash, migrations[index].hash);
    });

    for (const table of Object.values({ ...tenantSchema, ...authSchema }).filter(value => value instanceof PgTable)) {
      const expected = getTableConfig(table);
      const [actual] = await client`
        SELECT c.relrowsecurity, c.relforcerowsecurity
        FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND c.relname=${expected.name}
      `;
      assert.ok(actual, expected.name);
      assert.equal(actual.relrowsecurity, expected.enableRLS, expected.name);
      assert.equal(actual.relforcerowsecurity, expected.enableRLS, expected.name);
      const policies = await client`
        SELECT policyname, permissive, roles, cmd, qual, with_check FROM pg_policies
        WHERE schemaname='public' AND tablename=${expected.name}
      `;
      assert.equal(policies.length, Number(expected.enableRLS), expected.name);
      if (expected.enableRLS) {
        const policy = policies[0];
        assert.equal(policy.policyname, "agentflow_scope");
        assert.equal(policy.permissive, "PERMISSIVE");
        assert.equal(policy.cmd, "ALL");
        assert.equal(policy.with_check, null);
        if (expected.name === "users") {
          assert.ok(policy.qual.includes("identity_issuer") && policy.qual.includes("identity_subject"));
          assert.ok(policy.qual.includes("agentflow.identity_issuer") && policy.qual.includes("agentflow.identity_subject"));
        } else {
          assert.ok(policy.qual.includes("agentflow.business_id") && policy.qual.includes("::uuid"));
        }
      }
    }
    const [homeKey] = await client`
      SELECT pg_get_constraintdef(oid) AS definition FROM pg_constraint
      WHERE conname='users_home_business_id_businesses_id_fk' AND conrelid='public.users'::regclass
    `;
    assert.equal(homeKey.definition, "FOREIGN KEY (home_business_id) REFERENCES businesses(id)");
    const seeded = await client`SELECT key FROM permissions WHERE key = ANY(${Object.values(permissions)})`;
    assert.deepEqual(seeded.map(row => row.key).sort(), Object.values(permissions).sort());
  } finally {
    await client.end();
  }
});
