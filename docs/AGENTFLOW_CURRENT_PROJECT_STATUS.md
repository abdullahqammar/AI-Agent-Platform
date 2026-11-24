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

Install Ollama on the same host as the AgentFlow Node server. On Windows, use `ollama list` to identify an installed tag. Choose **Local Ollama · Qwen3.5 4B** for `qwen3.5:4b` or **Local Ollama · Qwen2.5 7B** for `qwen2.5:7b`. Select the desired template, save the draft and start a new test. Existing conversations retain their version and model. The fixed destination is the Ollama chat API on 127.0.0.1 port 11434. If a system HTTP proxy is configured, include 127.0.0.1 and localhost in NO_PROXY. A cloud-hosted AgentFlow instance requires its own co-located Ollama runtime. No paid-provider fallback occurs. Local inference speed, GPU acceleration and model quality require verification on the target machine. Review the model's license before a commercial rollout.

## Staff handoff queue

Open **Staff handoffs** from the dashboard to see in-app conversations awaiting human follow-up across the selected workspace's assistants. Each entry identifies the customer, assistant, test or published status and current assignee. Open the customer link to read the conversation history. Owners and Assistant managers can claim an unassigned conversation or release their own assignment. Owners can also release another member's assignment. Releasing returns the conversation to the queue with AI replies still paused.

The queue reuses the existing assignment history, tenant constraints and audit events. This milestone requires no migration or external account. The staff reply milestone below extends the queue. Notifications and external channel delivery remain open.

Chromium verified claim, release, assignment persistence after reload, competing claims from stale pages, owner release of a manager's assignment, and refusal of a stale release after reassignment at 1440×900 and 390×844. A viewer and an unrelated account received the access-denied page. The assistant browser demo used simulated model output. The assignment and authorization checks ran against local PostgreSQL.

## Assistant testing experience

The studio displays the model and version used by the selected conversation. Opening a thread brings its chat above configuration, version history and publish controls. Loading a template preserves the selected model. Saving a changed configuration creates a new version; start a new test to use it. The composer shows when a reply is pending. Ollama connection failures, timeouts and missing-model responses have separate recovery messages. Live inference on the owner’s PC still requires a local conversation test.

## Workspace dashboard and product benchmark, 23 November 2026

Owners and Assistant managers see their workspace's assistant roster on Overview. The first-use action creates an assistant; returning users open an existing assistant and see its published state. Viewers retain their workspace overview and team access. Five unavailable “Soon” navigation entries were removed. This uses the existing agent tables, roles and tenant transaction. No schema migration, new provider or paid service is involved.

Local checks passed: database 8, migrations 4, authentication 8, workspace/authorization 13 and provider contracts 7. Chromium exercised the assistant and team journeys at 1440×900 and 390×844, including empty and populated dashboards, opening an existing assistant, and hiding the directory after demotion to Viewer. Provider replies and the missing-model condition used the documented fixture. TypeScript, ESLint and the production build passed. Competitor evidence boundaries and next milestones are in the [research](AGENTFLOW_COMPETITOR_RESEARCH.md) and [roadmap](AGENTFLOW_MASTER_ROADMAP.md). First live assistant acceptance remains open.

## Staff replies and resolution, 24 November 2026

Claim a conversation in Staff handoffs and open its transcript. The current assignee can save an attributed in-app reply while the assistant stays paused. **Resolve and close conversation** ends the assignment and removes the thread from the queue. The transcript remains available in history. This closes the in-app conversation; it sends no external message and confirms no appointment.

Migration 0006 adds a nullable staff membership to messages and enforces same-business attribution. Existing messages retain their original speakers. Before updating a local server, review drizzle/0006_staff_replies.sql and apply it using `npm run db:migrate`. This is an additive upgrade to the existing database.

Verified locally with database (8), migrations (4), auth (8), workspace (13) and provider (8) tests. Chromium exercised both manager and owner sessions at 1440×900 and 390×844, including persisted attributed replies, denied stale submissions, closure and the local 4B selection. Provider responses in automated tests were simulated. A live Qwen3.5 4B turn remains a separate acceptance check.

## Inspect knowledge sent during a test

Open a successful new playground reply and expand **Knowledge sent with this reply** to read the exact source titles and text supplied to the provider. Source positions are captured by the server from the outgoing request and resolved against the thread’s saved assistant version. This shows what the model received; individual claims in the response still require review. The disclosure stays out of published chats, staff replies and old records without retrieval data. No second model call is needed.

Migration 0007 adds one nullable integer-array column on messages. Existing workspaces and transcripts require no backfill. The existing tenant and assistant-manager checks protect the disclosure. Hostinger and n8n workflow evidence is recorded in the competitor research.

Verified with 42 automated tests (database 8, migration 4, authentication 8, workspace 13, provider contracts 9), TypeScript, ESLint and the production build. At 1440×900 and 390×844 Chromium verified that test evidence survives reload and later source edits, is absent in published chats, and remains inside the existing protected studio. Both assistant and team journeys passed. The browser fixture simulated model responses.
