# AgentFlow development status

The local app supports authentication, first-workspace onboarding, multiple owned workspaces, switching and permission-checked tenant reads. The assistant studio adds owner-managed versioned instructions, inline knowledge, a test conversation and publish controls. Migration 0004 extends existing tenant tables. A successful model turn records the version eligible for publication. Restoring an older configuration creates a new draft that must pass a new test.

## Run the assistant

From a workspace dashboard choose **AI assistants**. Create a general assistant or load the fictional dental example. Edit the profile, instructions, assigned knowledge and handoff rules, then save. Start a version test and send a question. A successful response unlocks publishing. Starting a published conversation requires an enabled agent. Staff requests appear in the conversation list for owner follow-up.

The approved OpenAI adapter uses gpt-4.1-mini and api.openai.com. Set AGENTFLOW_OPENAI_KEY as an HTTPS secret for that host. Only send business data approved for this provider. Provider failures preserve the inbound message, add an audit event and allow manual retry. Usage reflects provider-reported input/output tokens for a successful turn. No billing or automatic booking takes place.

## Local evidence

Chromium exercised template selection, draft save, hours Q&A, persisted history, handoff, publish, disable and denial to a separately authenticated user at 1440×900 and 390×844. The model response and token counts were simulated. Authentication, server actions, database storage and isolation used the real local stack. Browser tests create synthetic accounts and workspaces.

Run the provider contract tests with `node --test scripts/assistant-provider.test.mts`. For the simulated demo, run the following in separate terminals from the repository root after local setup and migrations:

```sh
AGENTFLOW_OPENAI_KEY=simulation-only NODE_OPTIONS="--require=$PWD/scripts/browser/assistant-provider-fixture.cjs" NEXT_TELEMETRY_DISABLED=1 npm run dev -- --hostname localhost
python scripts/browser/assistant_demo.py
```

Use a normal dev server and a securely provisioned credential for live acceptance. Ask for the opening hours, reload to inspect history, then ask to confirm an appointment. Verify the staff queue and model usage. A provider-backed answer remains outstanding. WhatsApp delivery, staff notifications, platform administrator controls and invited-user delegation remain outstanding. The studio currently ranks bounded inline sources assigned to the version by word overlap and sends up to four. Indexed document search, shared document ingestion and a general workflow engine remain open.

## Team milestone

Workspace owners can issue and privately share email-bound links, rotate or revoke invitations, review membership, change delegated roles and revoke access. A recipient can decline, accept after signing in or registering, and later leave the workspace. The Team page and assistant studio check the current membership server-side. Viewer and Assistant manager are the two delegated roles. Migration 0005 adds invitation storage with forced RLS and a membership display name. Automated browser acceptance is available in scripts/browser/team_demo.py. Owner-assisted delivery is available now; automated email delivery requires provider setup.

Team milestone checks passed locally: database 8, migration 4, authentication 8 and workspace 13, with zero skipped. Chromium verified invitation rotation, acceptance, replay denial, role demotion and revocation at 1440×900 and 390×844. TypeScript, ESLint and the production build passed. The production server served /register locally. The owner's Codespaces preview remains unverified.

## OpenAI live acceptance attempt

The configured OpenAI credential could read gpt-4.1-mini metadata through the cloud HTTPS proxy. A synthetic browser conversation reached the provider-error flow. An adapter diagnostic received HTTP 429 with credit_balance_exhausted. No live assistant answer, usage receipt, or model-triggered handoff was verified. Check the API project's billing before repeating the test. Node startup uses the environment proxy for configured HTTPS destinations (Node 24.22.3 verified).

## Local inference for a private demo

Install Ollama on the same host as the AgentFlow Node server. On Windows, start Ollama and run `ollama pull qwen2.5:7b` in PowerShell. With an existing local AgentFlow installation, choose the template first and then **Model → Local Ollama · Qwen2.5 7B**, save the draft and start a test. The fixed destination is the Ollama chat API on 127.0.0.1 port 11434. If a system HTTP proxy is configured, include 127.0.0.1 and localhost in NO_PROXY. A cloud-hosted AgentFlow instance requires its own co-located Ollama runtime. No paid-provider fallback occurs. Local inference speed, GPU acceleration and model quality require verification on the target machine. Review the model's license before a commercial rollout.

## Staff handoff queue

Open **Staff handoffs** from the dashboard to see in-app conversations awaiting human follow-up across the selected workspace's assistants. Each entry identifies the customer, assistant, test or published status and current assignee. Open the customer link to read the conversation history. Owners and Assistant managers can claim an unassigned conversation or release their own assignment. Owners can also release another member's assignment. Releasing returns the conversation to the queue with AI replies still paused.

The queue reuses the existing assignment history, tenant constraints and audit events. This milestone requires no migration or external account. Staff replies, handoff resolution, notifications and external channel delivery remain open.

Chromium verified claim, release, assignment persistence after reload, competing claims from stale pages, owner release of a manager's assignment, and refusal of a stale release after reassignment at 1440×900 and 390×844. A viewer and an unrelated account received the access-denied page. The assistant browser demo used simulated model output. The assignment and authorization checks ran against local PostgreSQL.
