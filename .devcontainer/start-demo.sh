#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${CODESPACE_NAME:?Run in GitHub Codespaces}"
: "${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:?Missing private forwarding domain}"
export BETTER_AUTH_URL="https://${CODESPACE_NAME}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
export NEXT_TELEMETRY_DISABLED=1
bash .devcontainer/database.sh
sha256sum --check .devcontainer/reviewed-migrations.sha256
npm run db:migrate
npm run build
nohup npm run start -- --hostname 127.0.0.1 >/tmp/agentflow-demo.log 2>&1 </dev/null &
for attempt in {1..40}; do
  if curl -fsS http://127.0.0.1:3000/register -o /dev/null; then exit 0; fi
  sleep 1
done
echo "AgentFlow startup failed. See /tmp/agentflow-demo.log." >&2
exit 1
