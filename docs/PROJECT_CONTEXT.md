# AgentFlow — Project Context and Handover

> This document is a handover snapshot, not proof of current repository state. Codex must verify every implementation/status claim against the checked-out code, migrations, tests, and Git history before relying on it.

## Product vision

AgentFlow is a configurable, industry-independent, multi-tenant SaaS platform for AI-powered business assistants. The initial channel is the official WhatsApp Business Cloud API.

Businesses should be able to register, configure one or more agents, connect their official WhatsApp Business numbers, manage customer conversations, and enable suitable workflows such as appointments or service requests. Agent identity, business knowledge, tone, instructions, tools, permissions, and workflows must be configurable.

A dental clinic called BrightSmile Dental Clinic was used as an example/test configuration. It is not the product's fixed identity or target market. The architecture should support different business types, including e-commerce, real estate, hospitality, education, and professional services.

## Core MVP priorities

1. Registration, authentication, onboarding, and workspace creation.
2. Configurable AI agents with persistent conversations.
3. Safe, permission-checked server-side tool execution.
4. Official WhatsApp Business Cloud API connection and webhook handling.
5. A practical dashboard for inbox, customers, appointments/requests, and agent settings.
6. Strong tenant isolation, security, reliability, and operational observability.

Keep advanced analytics, complex visual automation builders, additional channels, and complex billing out of the MVP unless the owner explicitly approves them.

## Known technical stack

The project was created as a single Next.js application with:
- Next.js App Router and TypeScript.
- Tailwind CSS.
- PostgreSQL.
- Drizzle ORM and postgres-js.
- Zod.
- Better Auth.
- OpenAI integration intended to run server-side.

The Next.js application contains both the web interface and backend/API routes. Do not create a separate mobile backend without an approved architectural reason.

Known local development setup at the time of this handover:
- Windows development machine.
- Local PostgreSQL 18.4.
- Local database named `agentflow_dev`.
- Dedicated application role named `agentflow_app`.
- `.env.local` contains local configuration and must never be requested, printed, or committed.

Never copy passwords, tokens, or secret values into documentation.

## Architecture already reported as implemented — verify in repository

### Database foundation

A previous implementation report described:
- 24 application tables, 44 foreign keys, 34 unique constraints, and explicit indexes.
- Business membership and permissions, locations, versioned agent configuration, tools, channels, customers, conversations, messages/delivery events, assignments, knowledge, appointments/status history, and audit records.
- Composite foreign keys to enforce same-business relationships.
- A partial unique index for one current assignment per conversation.
- Time-zone validation for business/location/appointment time zones.
- Tenant access through a `withTenant` service that validates active membership and role permission before tenant operations.
- Transaction-scoped identity/business context and FORCE ROW LEVEL SECURITY on tenant-owned tables.
- Live PostgreSQL tests for cross-tenant ID substitution, unauthorized writes, permission checks, and cross-tenant foreign keys.
- A restricted runtime database role.

Do not assume the counts or implementation remain unchanged. Inspect schema, migrations, RLS policies, triggers, tenant-access helpers, and tests.

### Authentication and workspace foundation

A previous implementation report described:
- Better Auth using its own auth tables, separate from AgentFlow's application-level user identity.
- Shared PostgreSQL client used by Better Auth and tenant access.
- Auth API handler under `/api/auth/[...all]`.
- Idempotent mapping from authenticated Better Auth sessions to application identities using a fixed server-controlled issuer.
- Atomic first-workspace onboarding that creates a business, Owner role/permissions, location, membership, and audit event.
- Concurrent onboarding submissions resolving to the same workspace.
- Routes for `/register`, `/login`, `/onboarding`, and `/dashboard`.
- Dashboard reading real business, role, and location data.
- Migration files previously reported as `0001_better_auth.sql` and `0002_first_workspace.sql`, with migration journal/hash checks.
- Runtime tests for registration, login, duplicate emails, session persistence, logout, concurrent identity creation, onboarding retries, rollback, owner permissions, anonymous access, and cross-business substitution.

Verify exact current routes, schema, migration history, and tests before changing them.

## Latest known milestone and unfinished acceptance

The latest user-provided Codex report said the authenticated workspace foundation had been implemented and tested through actual Next.js endpoints and local PostgreSQL.

The report said:
- Database tests, migration consistency, TypeScript, ESLint, and production build passed.
- Repeat schema generation produced no changes.
- Disposable fixtures were cleaned.
- Browser interaction and responsive-layout verification were NOT completed. The browser attempt was interrupted by a usage-limit approval failure, and a desktop fallback did not return a browser window.

Therefore, the first implementation assignment should be to inspect the current state and complete browser interaction and responsive-layout verification for registration, login, onboarding, and dashboard. Do not jump straight into building the AI engine before this acceptance gap is closed.

Browser verification should cover relevant desktop and mobile viewport sizes, validation, loading/error states, redirects, session persistence, logout, and the authenticated dashboard. Clearly distinguish automated browser tests from actual physical mobile-device acceptance.

## Operational requirements and future checks

Before production use, verify and plan for:
- HTTPS and secure cookie configuration.
- Restricted runtime DB credentials separate from migration-owner credentials.
- Email verification and account recovery configuration.
- Shared rate limiting suitable for multiple application instances.
- Tested database backup and restore procedures.
- Secure secret storage and rotation.
- Production monitoring and error reporting.
- Provider setup and verification for WhatsApp Cloud API before claiming live integration.

Do not purchase hosting or paid infrastructure or change provider subscriptions without explicit owner approval.

## Testing philosophy

Tests should represent realistic customer and platform behavior, not just happy paths. Include, as relevant:
- Incomplete, ambiguous, changing, or contradictory customer details.
- Rescheduling and cancellation.
- Repeated messages and idempotent retries.
- Duplicate and out-of-order webhooks.
- Concurrent appointment or request operations.
- Human handoff.
- Multilingual conversations.
- Backend/provider failures.
- Cross-tenant access attempts and identifier substitution.

## Product-owner working style

The owner wants to work as a vibe coder/product owner, not learn or approve every small coding detail.

Codex should:
- Own substantial, coherent milestones.
- Make normal technical decisions independently.
- Ask only for real business-policy choices, material scope changes, paid services, external manual setup, destructive actions, or irreversible decisions.
- Explain manual steps clearly when owner action is required.
- Recommend one highest-priority next task rather than presenting a large menu of competing tasks.
- Preserve existing work and avoid unnecessary scope expansion.
