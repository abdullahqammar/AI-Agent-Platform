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
