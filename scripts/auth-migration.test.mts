import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { readMigrationFiles } from "drizzle-orm/migrator";

const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const previous = readJson("drizzle/meta/0000_snapshot.json");
const current = readJson("drizzle/meta/0001_snapshot.json");
const authTables = ["account", "session", "user", "verification"];
const migration = readFileSync("drizzle/0001_better_auth.sql", "utf8");
const statements = migration.split("--> statement-breakpoint").map((sql) => sql.trim());

test("auth snapshot preserves all existing schema objects", () => {
  assert.equal(current.prevId, previous.id);
  for (const [name, table] of Object.entries(previous.tables)) {
    assert.deepEqual(current.tables[name], table, name);
  }
  assert.deepEqual(
    Object.keys(current.tables).filter((name) => !(name in previous.tables)).sort(),
    authTables.map((name) => `public.${name}`),
  );
  for (const key of ["enums", "schemas", "sequences", "roles", "policies", "views"]) {
    assert.deepEqual(current[key], previous[key], key);
  }
  for (const name of authTables) {
    assert.equal(current.tables[`public.${name}`].isRLSEnabled, false);
    assert.deepEqual(current.tables[`public.${name}`].policies, {});
  }
});

test("SQL contains only auth table creation, cascading foreign keys and indexes", () => {
  assert.equal(statements.length, 9);
  assert.deepEqual(statements.slice(0, 4).map((sql) => {
    const match = /^CREATE TABLE "(account|session|user|verification)" \([\s\S]+\);$/.exec(sql);
    assert.ok(match, "Expected auth CREATE TABLE");
    return match[1];
  }), authTables);
  assert.equal(statements[4], 'ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;');
  assert.equal(statements[5], 'ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;');
  assert.deepEqual(statements.slice(6), [
    'CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");',
    'CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");',
    'CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");',
  ]);
  assert.doesNotMatch(migration, /\b(DROP|TRUNCATE|DISABLE|ENABLE|FORCE|POLICY|GRANT|REVOKE)\b/i);
});

test("migration reader accepts the journal and statement boundaries", () => {
  const journal = readJson("drizzle/meta/_journal.json");
  const migrations = readMigrationFiles({ migrationsFolder: "./drizzle" });
  assert.ok(migrations.length >= 2);
  assert.deepEqual(journal.entries.slice(0, 2).map((entry: { idx: number; tag: string }) => [entry.idx, entry.tag]), [
    [0, "0000_foundation"], [1, "0001_better_auth"],
  ]);
  assert.ok(migrations[1].folderMillis > migrations[0].folderMillis);
  assert.equal(migrations[1].hash, createHash("sha256").update(migration).digest("hex"));
  assert.deepEqual(migrations[1].sql.map((sql) => sql.trim()), statements);
});
