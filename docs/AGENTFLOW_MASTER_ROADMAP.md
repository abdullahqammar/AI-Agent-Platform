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

## Benchmark-informed sequence

The live dashboard directory closes the gap between creating an assistant and finding it again. First verify a grounded reply, persisted history and a model-requested handoff with an authorized live provider. Extend shared business knowledge and add safe retrieval inspection before file ingestion or channel rollout. Platform admin authority precedes Site Identity and centrally enforced availability. Workspace entitlements, credential ownership and idempotent usage records precede commercial activation and bounded orchestration. See [gap analysis](AGENTFLOW_PRODUCT_GAP_ANALYSIS.md) for decisions and [UX benchmark](AGENTFLOW_UX_UI_BENCHMARK.md) for acceptance.
