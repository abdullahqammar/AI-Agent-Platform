import postgres from "postgres";
import { z } from "zod";

export function createConnection() {
  const result = z.url().safeParse(process.env.DATABASE_URL);
  if (!result.success) throw new Error("A valid DATABASE_URL is required");

  const url = new URL(result.data);
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    url.pathname !== "/agentflow_dev" ||
    url.username !== "agentflow_app" ||
    url.search || url.hash
  ) {
    throw new Error("DATABASE_URL must target the local AgentFlow development database");
  }

  return postgres(url.href, { connect_timeout: 5, connection: { search_path: "public" } });
}

let sharedConnection: ReturnType<typeof createConnection> | undefined;

export function getConnection() {
  sharedConnection ??= createConnection();
  return sharedConnection;
}
