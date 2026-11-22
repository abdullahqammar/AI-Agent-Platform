# AgentFlow — Codex Working Instructions

## 1. Project identity and source of truth

- This repository is the primary implementation repository for **AgentFlow**.
- GitHub repository: `abdullahqammar/AI-Agent-Platform`.
- The separate `abdullahqammar/Onplas` repository is an architectural and implementation reference only.
- AgentFlow must remain an independent product. Do not merge the two products or introduce runtime dependencies on OnPlas.

Before making changes:
1. Read this file and `docs/PROJECT_CONTEXT.md` and `docs/REFERENCE_REPOSITORIES.md`.
2. Inspect the current repository state, Git history, README, project documentation, migrations, tests, and relevant implementation.
3. Treat the checked-out code and migrations as authoritative for what is currently implemented. The project context document is a handover snapshot and may be stale.
4. Identify the current branch, working-tree state, and existing uncommitted changes. Never overwrite or discard user work.

## 2. Role and execution expectations

Act as the implementation engineer. The product owner is a vibe coder and should not need to direct routine coding details.

- Take ownership of coherent milestones, including investigation, implementation, tests, and a clear completion report.
- Make ordinary technical and architectural decisions independently when they are reversible, conventional, and consistent with this project's established design.
- Ask the product owner only when a genuine business-policy decision, material scope change, paid service, external account setup, destructive action, or irreversible decision is required.
- Do not turn every small implementation detail into a question.
- Prefer the simplest maintainable solution that meets the requirements. Avoid speculative abstractions and overengineering.
- Do not expand product scope or add features merely because they seem useful.
- Distinguish clearly between implemented, locally tested, externally configured, and production-verified work.

## 3. Product boundaries

AgentFlow is a configurable, industry-independent, multi-tenant SaaS platform for AI-powered business assistants, initially using the official WhatsApp Business Cloud API.

The dental-clinic configuration used in early testing is only an example. Do not hard-code AgentFlow as a dental-clinic product. Design business identity, agent instructions, tone, knowledge, workflows, enabled tools, and permissions to be configurable by each business.

Keep the core priorities focused:
- Registration, authentication, onboarding, and business workspace setup.
- Configurable AI agents and controlled tool execution.
- Persistent customer conversations and inbox workflows.
- Official WhatsApp Business Cloud API integration.
- Customer, appointment/request, and agent-management workflows.
- Tenant isolation, security, reliability, and operational correctness.

Do not introduce advanced analytics, a complex visual automation builder, additional messaging channels, or complex billing unless explicitly approved.

## 4. Architecture and security rules

- Preserve the existing Next.js App Router + TypeScript application structure unless a justified architectural change is necessary.
- The Next.js application contains the web UI and backend/API routes; do not create a separate mobile backend without an approved reason.
- Preserve the existing PostgreSQL, Drizzle ORM, Better Auth, Zod, and tenant-access architecture.
- Tenant identity and business scope must be resolved and enforced server-side. Never trust a client-supplied business ID as authorization.
- Keep tenant-owned reads and writes tenant-scoped. Preserve existing composite foreign keys, constraints, transaction boundaries, and FORCE ROW LEVEL SECURITY protections.
- Do not add an unscoped tenant-data access shortcut or bypass RLS with superuser/BYPASSRLS credentials.
- AI-generated tool calls are untrusted requests. Validate inputs, permissions, tenant ownership, and business rules server-side before executing actions. Never permit arbitrary code or unrestricted database actions.
- Keep credentials server-side and encrypted where the existing design requires it. Never expose secrets in client bundles, logs, commits, test output, or reports.
- Use UTC for stored instants and IANA time-zone identifiers for business/location scheduling.
- Keep auditability for sensitive operations.
- Do not weaken authentication, authorization, database roles, rate limits, or security controls to make tests pass.
- Use separate migration-owner and restricted runtime database credentials in production, consistent with the repository's deployment design.

## 5. Database and migration safety

- Inspect existing migration conventions and journal before changing the schema.
- Never edit an already-applied migration to change its historical meaning; create a new migration.
- Do not run migrations against production or any remote database unless the product owner explicitly authorizes the exact target and operation.
- Do not drop, truncate, reset, or rewrite a database to make local tests pass.
- Before destructive or high-risk database work, establish and verify a backup/restore procedure.
- Test migrations against a disposable/local database and verify both the intended changes and preservation of existing security controls.
- Do not put production data, database dumps, or credentials in this repository.

## 6. Git and change management

- Work only in the AgentFlow repository.
- Do not modify, commit to, push to, or open write operations against the OnPlas repository.
- Do not force-push, rewrite shared history, delete branches, or overwrite commits without explicit approval.
- Preserve existing user changes. Do not use destructive cleanup commands.
- Prefer a dedicated task branch or the review workflow configured by the product owner. Do not silently push unreviewed work to the default branch.
- Keep changes focused and explain any migration or dependency changes.
- Never commit `.env*`, credentials, private keys, tokens, local database files/dumps, customer data, or generated secrets.
- Do not assume `.gitignore` is sufficient: check tracked files and scan changed files/history as appropriate.

## 7. Testing and evidence

For each milestone:
1. Establish the current baseline.
2. Add or update focused tests for changed behavior.
3. Run relevant database/runtime tests, TypeScript, lint, and production build where applicable.
4. Run regression tests for tenant isolation, permissions, authentication, and RLS when changes touch those boundaries.
5. Report exact commands and results, including failures, skips, and environmental limitations.
6. Do not claim browser, mobile-device, WhatsApp-provider, email-provider, or production acceptance unless it was actually performed against that environment.

Include realistic edge cases where relevant: incomplete or contradictory customer messages, rescheduling/cancellation, retries, duplicate/out-of-order webhooks, concurrent operations, handoff, multilingual input, provider failures, and cross-tenant access attempts.

## 8. External services and owner approvals

- Do not purchase services, create paid infrastructure, incur charges, or change subscription plans.
- Do not use real customer messaging or send real emails without explicit authorization and a controlled test plan.
- Identify manual provider setup clearly (for example Meta Business/WhatsApp configuration, domain verification, API credentials, webhooks, or billing).
- Do not claim an integration is live merely because code or mocked tests exist.
- For destructive cleanup, production deployment, data migration, ownership/security changes, or material product-policy choices, explain the impact and wait for approval.

## 9. Required completion report

At the end of every milestone, report:
- What changed and why.
- Important files and migrations touched.
- Tests/checks run, with exact pass/fail/skip counts where available.
- What was not tested and why.
- Security, data, deployment, or manual owner actions still required.
- Any decisions that genuinely require the product owner's input.
- The single highest-priority next task.

Do not report a milestone as complete while a required acceptance check remains unverified.
