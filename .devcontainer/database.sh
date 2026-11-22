#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

container=codespaces-agentflow-postgres18-4
image=postgres:18.4-alpine@sha256:9a8afca54e7861fd90fab5fdf4c42477a6b1cb7d293595148e674e0a3181de15
if [[ ! -e .env.local ]]; then
  (umask 077; set -o noclobber
   node -e 'const {randomBytes}=require("node:crypto"); console.log("DATABASE_URL=postgresql://agentflow_app:"+randomBytes(24).toString("hex")+"@127.0.0.1:5432/agentflow_dev\nBETTER_AUTH_SECRET="+randomBytes(32).toString("hex")+"\nBETTER_AUTH_URL=http://localhost:3000")' > .env.local)
fi

if ! docker container inspect "$container" >/dev/null 2>&1; then
  admin_password="$(openssl rand -hex 32)"
  POSTGRES_PASSWORD="$admin_password" docker run -d --name "$container" \
    --label dev.agentflow.codex=postgres18-4 \
    -e POSTGRES_PASSWORD -p 127.0.0.1:5432:5432 "$image" >/dev/null
fi
[[ "$(docker inspect -f '{{index .Config.Labels "dev.agentflow.codex"}}' "$container")" == postgres18-4 ]]
if [[ "$(docker inspect -f '{{.State.Running}}' "$container")" != true ]]; then
  docker start "$container" >/dev/null
fi
for attempt in {1..60}; do
  if docker exec "$container" pg_isready -h 127.0.0.1 -U postgres -d postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
docker exec "$container" pg_isready -h 127.0.0.1 -U postgres -d postgres
psql_admin() {
  docker exec -i --user postgres "$container" psql -X -q -v ON_ERROR_STOP=1 -U postgres "$@"
}
if [[ "$(psql_admin -d postgres -Atc "SELECT 1 FROM pg_roles WHERE rolname = 'agentflow_app'")" != 1 ]]; then
  node -e '
    const url = new URL(require("node:util").parseEnv(require("node:fs").readFileSync(".env.local","utf8")).DATABASE_URL);
    if (!["postgresql:", "postgres:"].includes(url.protocol) || url.hostname !== "127.0.0.1" || url.port !== "5432" || url.pathname !== "/agentflow_dev" || url.username !== "agentflow_app" || !/^[a-f0-9]{48}$/.test(url.password)) {
      console.error("Expected the generated local AgentFlow database configuration");
      process.exit(1);
    }
    console.log("CREATE ROLE agentflow_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD " + String.fromCharCode(39) + url.password + String.fromCharCode(39) + ";");
  ' | psql_admin -d postgres
fi
if [[ "$(psql_admin -d postgres -Atc "SELECT 1 FROM pg_database WHERE datname = 'agentflow_dev'")" != 1 ]]; then
  psql_admin -d postgres -c 'CREATE DATABASE agentflow_dev OWNER agentflow_app'
fi
node --env-file=.env.local --input-type=module <<'NODE'
import { createConnection } from './src/db/connection.ts';
const sql = createConnection();
try {
  const [role] = await sql`SELECT current_database() = 'agentflow_dev' AND current_user = 'agentflow_app'
    AND session_user = current_user AND current_setting('server_version') = '18.4'
    AND NOT (rolsuper OR rolcreatedb OR rolcreaterole OR rolbypassrls) AS verified
    FROM pg_roles WHERE rolname = current_user`;
  if (!role?.verified) throw new Error('Unexpected AgentFlow database configuration');
} finally {
  await sql.end();
}
NODE
