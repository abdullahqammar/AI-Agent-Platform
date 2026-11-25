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

## Shared workspace facts

From Overview, owners and Assistant managers can open **Shared knowledge**, add text facts, and revise them. In an assistant draft, **Add workspace knowledge** attaches a specific revision. If a fact changes, **Use revision …** in the editor adopts it for the next saved draft. That draft must be tested before publishing. Other agents, previously published versions and conversations keep their original information. Assistant-specific sources can coexist with library facts within the existing 12-source limit. Workspace viewers cannot open the library.

Migration 0008 extends knowledge_documents with nullable fact text, stable library identity, revision number and a uniqueness constraint per workspace/fact/revision. A concurrent editor who submits an older revision sees a conflict. Draft saves read each selected source from the tenant database, snapshot its authoritative content and synchronize the latest draft’s library links in agent_knowledge. Only title and text enter the provider’s untrusted knowledge block. No file ingestion or external provider connection was added.

Chromium checked the shared-fact workflow with a synthetic Reception and Sales assistant at 1440×900 and 390×844. Both began with the same revision. After a library edit, the published Reception conversation still answered with its saved text; Sales adopted the update only after an explicit draft save. Stale edits, viewer access and outside-account access were checked. Model generation used the local test fixture. The database, API and browser persistence were real.

## Retiring outdated business information

**Shared knowledge** lists enabled assistants that use each fact and links to their published versions. Retiring a fact prevents its use in new drafts and publications. An already published assistant continues to use its saved version. To stop it answering with outdated information immediately, open the linked assistant and disable it. To update it, remove or replace the fact, save a draft, test and publish. **Review and restore** creates a new revision that an owner or Assistant manager can explicitly adopt.

Migration 0009 adds a retirement cutoff with a default of zero for existing facts. Re-running the local migration command applied zero changes. All 42 automated checks passed (database 8, migrations 4, authentication 8, workspace 13, provider contracts 9), with zero skipped. TypeScript, ESLint and the production build passed. Chromium completed the assistant, team and shared-knowledge journeys at 1440×900 and 390×844. Separate stale editor and publishing tabs were blocked after retirement. A restored revision supplied the revised answer only after explicit adoption. The assistant editor now waits for its controls to initialize before accepting input. Browser replies used the local simulated provider. Acceptance against the owner’s Ollama installation remains open.

## Shared FAQ authoring

In **Shared knowledge → Add an FAQ**, an Owner or Assistant manager can save a customer question and its approved answer. In the assistant editor, choose the question under **Add workspace knowledge**, save a draft, then start a version test. A library edit creates a new revision. Each assistant keeps its assigned answer until a manager adopts the new revision and publishes a tested draft.

Questions and answers use the existing title and body columns. The source reference identifies an FAQ throughout edits, retirement and restoration. The assistant receives only the assigned question and answer as untrusted business knowledge. Existing workspace access checks, audit events and publishing controls apply. This milestone requires no database migration or new service.

Local verification passed with 42 automated checks (8 database, 4 migration, 8 authentication, 13 workspace and 9 provider contracts), zero failures and zero skips. TypeScript, ESLint and the production build passed. At 1440×900 and 390×844, Chromium exercised registration, shared knowledge, assistant and team journeys. Two assistants answered from the same assigned FAQ in a simulated provider conversation. Revising the answer in the library preserved the previously tested version. A separate account could not open the workspace library. Live inference on the owner's Ollama installation remains open.

## Checking local models from the assistant editor

Select **Local Ollama · Qwen3.5 4B** in the assistant editor and click **Check local model**. The check runs on the computer hosting AgentFlow. It distinguishes an installed model, a missing tag and an unreadable Ollama listing. It sends no business data and requires no model download, API key or database migration. Switching models clears the previous result.

For live acceptance, save the selected model in a draft, add an FAQ with a distinctive answer, and use **Start version test** to ask the FAQ question. Reload the conversation to confirm the answer persists. Then ask for a staff member and check **Staff handoffs**. A published release still requires a successful test reply. The delivery checkpoints and next independent engineering task are in the master roadmap.

Local verification passed with 44 checks (database 8, migrations 4, authentication 8, workspace 13, provider contracts 11), zero failures and zero skips. TypeScript, ESLint and the production build passed. Chromium completed assistant and team workflows at 1440×900 and 390×844 using simulated provider responses. Tests exercised available and missing model tags, clearing a previous result and restricted direct requests. Anonymous, outside-workspace and Viewer requests were denied. The cloud host had no reachable Ollama service, so live inference on Windows remains open.

## Business Connect and shared execution assessment

The dashboard now opens Business Connect at the existing shared-knowledge route. Each source shows its enabled assistant releases, the latest assigned versions outside those releases, and the referenced source revision. Owners and Assistant managers can use those links to open the corresponding version. Manual facts and FAQs are the only supported sources here. Sign-in, database, role checks and the version links are real. The blueprint, handbook, gap analysis, UX, architecture and roadmap describe the future private Business Copilot, runtime grants, source health and external adapters.

Local verification: db:test 8, test:migrations 4, test:auth 8, test:workspace 13 and assistant-provider contracts 12 passed (45 total, zero failed or skipped). TypeScript, ESLint and the production build passed. Chromium verified the shared-source, assistant and team journeys at 1440×900 and 390×844, including a newer draft and older enabled release, outside-account denial and Viewer access restrictions. The provider fixture simulated generation. One provider-contract test verifies malicious source text stays in user data and an unsupported refund operation is rejected. No new external services, migrations or production trials were involved. Runtime connector revocation, customer channel verification, private Copilot permissions and commercial metering still require implementation and their own tests.

## Imported product catalogues

In **Business Connect → Import a catalogue**, the workspace Owner pastes spreadsheet rows (SKU, name and description), names the import and grants read access to selected assistants. Every import starts with zero grants. Catalogue answers use matching structured products and their import timestamp. Imported descriptions cannot verify live inventory, price or delivery. Owners can revoke one assistant or disconnect the source for all assistants. Existing transcripts remain visible to authorized staff; the model starts fresh context for an assistant when its access changes.

Migration 0010 adds nullable catalogue and disconnect fields to knowledge documents and default-zero access generations to agents and messages. The existing tenant-scoped assignment and audit tables are reused. Review the new SQL before running the local migration. Existing fact revisions and assistant configurations retain their prior behavior.

Verified locally with 48 passing checks (database 9, migration 4, authentication 8, workspace 13, provider/catalogue contracts 14), zero failures or skips, TypeScript, ESLint and a production build. Migration rerun applied zero changes. Desktop and mobile-width Chromium exercised the published and draft assistants, catalogue access removal in an existing conversation, full disconnect, and the team workflow. PostgreSQL and authorization were real; model replies used the synthetic fixture.

## Reviewed catalogue updates

The first import now previews its parsed products and identifies incomplete rows and duplicate SKUs before submission. **Business Connect → Review catalogue** lets the workspace Owner inspect the current products and paste a complete replacement. The review shows added, edited and removed SKUs, including the prior and replacement descriptions. Applying a change requires confirmation. A stale review is rejected and identical products leave the source untouched.

Migration 0011 adds the tenant-scoped refresh history table. The Owner can inspect prior products from the 25 most recent refreshes. Refresh keeps the connection and grants, clears affected assistants' previous model context and preserves staff-visible conversation history. The next turn reads the updated snapshot. There is no external vendor connection or automated sync.

Local validation passed with 51 checks (database 10, migration 4, authentication 8, workspace 13, provider/catalogue contracts 16), zero failures or skips. TypeScript, ESLint and the production build passed. Chromium at 1440×900 and 390×844 exercised catalogue correction, refresh confirmation, rejection of stale submissions, previous snapshot inspection, updated replies in published and draft conversations, per-assistant revocation and full disconnect. Team and assistant browser journeys passed at both widths. Model responses were simulated; database, tenant checks and server actions used the real local stack. Re-running migration 0011 applied zero additional changes.

## Platform settings and Site Identity

Authorized platform administrators can open **Your workspaces → Platform settings** and change the platform name, tagline, page title and description. Sign-in branding, browser titles and default sharing metadata read the saved platform-wide values. The editor shows the ten most recent revisions. Every save retains the acting account and prior versions. Workspace ownership alone grants no access. No real account was promoted.

Migration 0012 adds the platform administrator grants and identity revisions. It applied once locally and a rerun applied zero changes. Local checks passed (database 10, migrations 4, authentication 8, workspace 13, provider/catalogue contracts 16; zero failures or skips), alongside TypeScript, ESLint and the production build. Against a disposable PostgreSQL database and production server, Chromium verified anonymous and workspace-owner denial, editing, stale-form rejection, public metadata refresh, audit attribution and denial after privilege revocation at 1440×900 and 390×844. Reproduce after building with `python3 scripts/browser/platform_identity_demo.py`. Asset management, separate sharing fields and production acceptance remain open.
