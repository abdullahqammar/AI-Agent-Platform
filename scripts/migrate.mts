import { readMigrationFiles } from "drizzle-orm/migrator";
import { createConnection } from "../src/db/connection.ts";

try {
  delete process.env.DATABASE_URL;
  process.loadEnvFile(".env.local");
  const migrations = readMigrationFiles({ migrationsFolder: "./drizzle" });
  const client = createConnection();
  try {
    const applied = await client.begin(async (tx) => {
      const [target] = await tx`
        SELECT current_database() = 'agentflow_dev'
           AND current_user = 'agentflow_app'
           AND session_user = 'agentflow_app'
           AND current_setting('server_version_num')::int BETWEEN 180000 AND 189999
           AND NOT (rolsuper OR rolcreatedb OR rolcreaterole OR rolbypassrls) AS verified
        FROM pg_roles WHERE rolname = current_user
      `;
      if (!target?.verified) throw new Error("Database target verification failed");

      await tx`SELECT pg_advisory_xact_lock(743064001)`;
      await tx`
        CREATE TABLE IF NOT EXISTS public.__drizzle_migrations (
          created_at bigint PRIMARY KEY,
          hash text NOT NULL
        )
      `;
      const history = await tx`SELECT created_at, hash FROM public.__drizzle_migrations ORDER BY created_at`;
      if (history.some((row, index) =>
        Number(row.created_at) !== migrations[index]?.folderMillis ||
        row.hash !== migrations[index]?.hash
      )) {
        throw new Error("Applied migration history differs from local files");
      }

      for (const migration of migrations.slice(history.length)) {
        for (const statement of migration.sql) {
          if (statement.trim()) await tx.unsafe(statement);
        }
        await tx`
          INSERT INTO public.__drizzle_migrations (created_at, hash)
          VALUES (${migration.folderMillis}, ${migration.hash})
        `;
      }
      return migrations.length - history.length;
    });
    console.log(`Applied ${applied} migration(s) to agentflow_dev as agentflow_app.`);
  } finally {
    await client.end();
  }
} catch (error) {
  const code = (error as { code?: string }).code;
  console.error("AgentFlow migration failed.", code ?? (error instanceof Error && [
    "Database target verification failed",
    "Applied migration history differs from local files",
  ].includes(error.message) ? error.message : "Check local configuration and migration files."));
  process.exitCode = 1;
}
