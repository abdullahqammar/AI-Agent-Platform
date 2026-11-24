# Implementation sequence

The full capability inventory and release requirements are in section 6 of the master product blueprint.

| Milestone | Dependency | Acceptance |
| --- | --- | --- |
| Core account and workspace isolation | Local auth and PostgreSQL | Registration, multi-business creation, switching and denial of foreign IDs in the browser and API |
| First assistant and team controls | Workspace permissions | Live provider Q&A grounded in assigned sources, persisted handoff, invitations, revocation and role-specific UI/API tests |
| Platform administration and Site Identity | Separate platform-admin authority | Audited asset replacement, safe fallback, metadata propagation and cache invalidation |
| Central feature controls | Platform authority and workspace roles | Deny unavailable, unentitled or disabled capabilities at every execution entry point |
| Channels, tools and workforce workflows | Agent versions, tenant-scoped context, event processing | Signed WhatsApp ingress, deduplication, retries, assignments and staff takeover with authorized provider setup |
| Commercial services and model routing | Entitlements, metering and provider approval | Per-business subscriptions, idempotent provider events, spend accounting and disabled-by-default model eligibility |
| Enterprise orchestration and operations | Released controls, reliable jobs and audit | Bounded handoffs and budgets, recovery, reporting, additional channels and workspace isolation under load |

Build all stages within the agreed project. Activate commercial and advanced capabilities only after operational acceptance and owner release.

In-app handoff triage now supports workspace-wide discovery, claiming and releasing assignments. Assigned staff can now reply in-app and explicitly close the conversation.

## Delivery checkpoints

| Stage | Status | Next evidence |
| --- | --- | --- |
| Core workspaces and teams | Implemented and locally exercised | Maintain isolation and revocation checks as new surfaces are added. |
| First AI employee | In-app drafts, publishing, shared FAQs, test history, staff handoff and a local model installation check are implemented | On the AgentFlow host with Ollama, get an answer from assigned knowledge, reload the conversation, then trigger and verify a handoff. |
| Platform administration | Next independent engineering milestone | Establish platform-admin authority separate from workspace ownership. Verify denied direct reads and writes before releasing Site Identity editing. |
| Stage 1 channels and business workflows | In-app channel available. External channel acceptance open | Verify WhatsApp webhook signatures, duplicate delivery handling and staff takeover using an authorized test number. |
| Stage 2 commercial controls | Planned, unreleased | Enforce platform availability, plan entitlements and workspace preferences server-side. Verify workspace billing events and usage attribution before commercial activation. |
| Stage 3 workforce operations | Planned, unreleased | Verify bounded multi-agent handoffs, retries, budgets, additional channels and reporting under the same permissions and feature controls. |

The Windows provider test and the platform-admin work can proceed independently. A model installation check verifies the selected tag. A successful model reply and a persisted handoff are separate acceptance steps.

## Benchmark-informed sequence

The live dashboard directory closes the gap between creating an assistant and finding it again. First verify a grounded reply, persisted history and a model-requested handoff with an authorized live provider. Extend shared business knowledge and add safe retrieval inspection before file ingestion or channel rollout. Platform admin authority precedes Site Identity and centrally enforced availability. Workspace entitlements, credential ownership and idempotent usage records precede commercial activation and bounded orchestration. See [gap analysis](AGENTFLOW_PRODUCT_GAP_ANALYSIS.md) for decisions and [UX benchmark](AGENTFLOW_UX_UI_BENCHMARK.md) for acceptance.

The playground now records the knowledge supplied to successful test replies. Owners can now manage shared text facts, choose revisions per assistant and test updated drafts without changing published versions. Owners can retire and restore facts and identify active assistants using them. Shared FAQ authoring now supports approved question-and-answer pairs and revision selection per assistant. Next prove grounded answers and handoff with a live local model. Document and website ingestion require validation, isolated storage and processing before release.
