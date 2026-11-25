# Product gap analysis

Audit of branch agentflow/multi-workspace at 7a1d99e, plus the dashboard changes described in current status. See [competitor evidence](AGENTFLOW_COMPETITOR_RESEARCH.md) for source limits and [the owner journey](AGENTFLOW_UX_UI_BENCHMARK.md) for workflow acceptance.

| Capability | Reference | Current implementation | Gap classification and decision |
|---|---|---|---|
| Multi-business identity | Lindy teams, Copilot environments | Better Auth, workspace directory, scoped memberships, forced RLS and membership checks. | Implemented and satisfactory for current local scope. Preserve direct-URL and revoked-member tests. |
| Workspace onboarding | Copilot environment selection | Owner, first location and timezone created atomically. Invitations can be accepted separately. | Incomplete. Add shared operational profile without lengthening required registration. |
| Workforce directory | Lindy activity home, Relevance agent identity | Agents persist per business; studio lists them. Dashboard now links to actual assistants by state. | Implemented with UX improvement in this slice. Later distinguish pending edits from active published versions on roster. |
| Role templates and creation | Relevance configured assistant | General and dental configurations share one engine, role, tone, instructions and handoff policy. | Improve setup around jobs, editable templates and custom responsibilities. Preserve model choice and data ownership. |
| Knowledge management | Dify test-and-tune | knowledge_documents and agent_knowledge tables exist. Current execution ranks bounded inline knowledge and selects up to four sources. New test replies expose those passages from the saved version. | Incomplete. Shared text facts now support tenant-bound assignment and immutable revisions. Owners can retire and restore facts and inspect active publications that depend on them. FAQ authoring uses the existing shared-source revision lifecycle. File and website intake still require ingestion controls. |
| Model configuration | Copilot model selector, Dify providers | Server allowlist, two endpoints, per-version model, local diagnostics and provider usage. | Incomplete. Establish a real registry with adapter capabilities; verify the first live conversation. |
| Provider credentials and BYOK | Dify workspace providers, Lindy credential scope | A server-managed OpenAI secret and local loopback inference. No tenant-owned credential lifecycle. | Missing roadmap capability. Design outlined below; no new provider activated. |
| Tools and workflows | Agentforce action recipes | tool_definitions, agent_tools and appointment tables. Current assistant can request handoff. | Incomplete. Add server-side action contracts, permission checks, input validation, idempotency and audit. Prevent side effects in tests. |
| Multi-agent delegation | Relevance subagents, ServiceNow lab | Multiple independent assistant configurations. | Missing roadmap capability. Require bounded delegation, tenant context, budgets and termination tests under central release controls. |
| Test, publish and restore | Agentforce lifecycle, Copilot test pane | In-app draft chat, version history, test-gated publication, disable and restore as draft. | Improve. Add change comparison and scenario regression tests. A successful model turn alone does not prove a correct business answer. |
| Channels and integrations | Dify publish surfaces | In-app channel persists conversations. Channel relations exist. | Incomplete. Verify signatures and workspace routing, deduplicate and retry before declaring WhatsApp live. |
| Inbox and staff collaboration | Copilot handoff, ServiceNow incident | Conversations, messages, assignment history, role-gated handoff queue, attributed in-app staff replies and resolution. | Incomplete. Add distinct internal notes and verified external delivery state when channel support is ready. |
| Analytics and operations | Dify logs, Agentforce traces | Audit events, provider-error paths, handoff events and per-message token counts. | Missing user-facing reporting. Provide scoped summaries; preserve provider failure context without leaking prompts or secrets. |
| Team management | Lindy team setup | Email-bound invitations with revocation, role changes, acceptance and leave. | Implemented locally; owner shares invitation link. Provider-backed email and production identity verification remain open. |
| Platform administration and identity | OnPlas source review | Brand components and local assets. Workspace roles exist. | Missing roadmap capability. Separate platform admin authorization, asset validation, safe replacement and public metadata projection. |
| Feature controls | Workspace app controls | Individual server-side role checks. | Missing roadmap capability. Registry must distinguish implementation/readiness, platform release, plan entitlement and workspace preference across jobs, APIs and UI. |
| Commercial management | Dify subscriptions, Lindy seats | Usage fields; no commercial ledger or verified payment lifecycle. | Missing roadmap capability. Separate model consumption from subscription ledger; require trusted idempotent payment events. |
| Design system and responsiveness | Copilot context, Relevance focused editor | Existing Geist fonts, account shell and workspace styles. Browser coverage exists for core journeys. | Improve consistent navigation, focus, action hierarchy and layout at 390px/desktop. Accessibility audit still needed. |
| Provider configuration checks | Dify credentials | Error messages distinguish several local failures. | Missing and required. Add bounded credential/endpoint verification and distinguish “configured” from “successfully answered”. |
| Tenant-specific branding | Platform identity requirement | One AgentFlow brand. | Reject customer white-label controls under current direction. |
| Screen-recorded task teaching | Lindy | No recording ingestion. | Possible enhancement requiring owner approval of capture, consent and retention policy. Use written examples now. |

## Provider and commercial architecture recommendation

A platform-managed connection belongs to the platform; a BYOK connection belongs to one workspace. Store encrypted credentials or vault references behind a server-only adapter. Record the connection owner, provider, approved model identifiers, verification state and last rotation time. Return masked metadata only. Limit creation, replacement, revocation and verification to authorized administrators. Separate key read access from permission to invoke a model. Never put a credential in an agent prompt or send it to a host chosen by a workspace user.

For each turn resolve workspace, feature release, entitlement, selected version, model eligibility, permitted connection and budget before the provider call. On success persist model, connection attribution, units and request identity. On a timeout keep the delivery outcome uncertain until reconciled. Retries must not double charge. Never silently switch from BYOK to platform-funded inference. Verify OpenAI first; add Anthropic or Gemini through explicit adapters and contract tests when provider access is authorized. Set prices, overage policy, billing provider and actual external charges only with owner approval.

Stages 2 and 3 remain approved development scope. Sequence implementation after authority, entitlements, usage integrity and event processing; require explicit release before customer activation.

## Whole-business integration audit

Baseline for this addition: agentflow/multi-workspace at 058e6b6, plus the Business Connect assignment view. Classification as of 24 November 2026. “Newly approved” identifies requirements missing from the previous roadmap, now recorded in the blueprint. It does not indicate a live capability.

| Requirement | Classification | Repository evidence and remaining work |
|---|---|---|
| Workspace identities, team roles and tenant isolation | Implemented for current surfaces | Better Auth, withTenant, FORCE RLS and composite keys. Add per-operation and record authorization for connected systems. |
| Shared knowledge, testing, versions, publishing, handoff | Implemented for manual text and FAQs | Studio and Business Connect use one library. Customer-facing external channel acceptance remains open. |
| Reusable providers, tools, usage, audit | Partial | OpenAI/Ollama adapters, tool definitions and agent tool tables, in-app handoff, message usage and audit events. No general tool dispatcher, encrypted BYOK manager, usage ledger or central entitlement evaluator. |
| Reviewed website intake and freshness | Newly approved details; partial roadmap coverage | No crawler, sitemap selector, provenance/expiry policy or sync history. Start with review and bounded public reads. |
| Structured imports and live business data | Newly approved | Existing customer, location and appointment tables serve AgentFlow workflows. Read-only SKU/name/description imports and revocable assistant grants are now implemented. Source refresh, field mapping, live stock/order adapters and sync cursors remain open. |
| Vendor connections and custom APIs | Partial roadmap, missing implementation | Existing channel connections are messaging identities. Add business connections, typed adapters, OAuth/webhook verification and least-privilege grants. |
| Customer workforce and private Copilot | Customer studio partial; private Copilot newly approved | Server verifies manager identity and in-app thread/version. No external verified customer entry, internal audience column or private staff session engine. |
| Revocation, source provenance and approval | Partial | Manual source revisions are preserved in published configurations. Add connection and assignment revocation for every runtime path, including history, sensitive tools and background jobs. |
| Subscriptions, source budgets, orchestration | Approved roadmap; missing enforcement | Build centralized deny-by-default gates, per-business usage and worker limits before releasing advanced operations. |
| Vendor credentials, production accounts, paid AWS, commercial decisions | Requires additional owner approval | Choose pilot data and external accounts when a connector is ready. Agree paid infrastructure, production access, sensitive-action policies and commercial activation separately. |
