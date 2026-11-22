# AgentFlow database foundation

Run `npm run db:generate -- --name=<change>` to generate a Drizzle migration, review its SQL, then run `npm run db:migrate`. The migration runner reads the local `.env.local`, validates the loopback database URL, and verifies database, login role, and PostgreSQL major version before issuing DDL. It uses Drizzle migration files and records their hashes in `public.__drizzle_migrations`. The advisory lock and transaction serialize migration runs and commit schema changes with their journal entries. Keep applied migration files immutable. Review RLS policies and triggers explicitly when generating migrations because those parts of the foundation are maintained in SQL.

Run `npm run db:test` against the migrated development database. The tests create uniquely identified fixtures, exercise PostgreSQL through the application role, and clean up the fixture records.

## Tenant access

Use `withTenant` from `src/db/index.ts` for tenant operations. Supply the issuer and subject from a verified server session, the requested business UUID, and a permission key selected by server code for the operation. Keep all queries inside the transaction callback. It checks active membership and role permission before running the operation. The transaction sets RLS context locally, so the context expires on commit or rollback.

Composite foreign keys include the business UUID for tenant-to-tenant links. Forced RLS limits tenant-owned rows to the transaction business and user rows to the transaction identity. RLS trusts transaction context set by the backend. Treat the database connection and transaction callback as privileged server code. In local development, the application role owns the tables. Before deployment, provision a separate migration owner and grant the runtime role only the DML needed by the application.

## Authentication and application identity

Better Auth owns login, password hashing, sessions and cookies through its four authentication tables. Those tables have no tenant RLS. Its adapter and tenant access share the PostgreSQL client. Production cookies require HTTPS and have Secure enabled. Local development uses HTTP with HttpOnly and SameSite cookie protections.

The server obtains the session through Better Auth on every protected entry point. The application identity uses the fixed issuer `agentflow:better-auth` and the verified authentication user ID as subject. The server sets both identity settings transaction-locally, inserts with conflict protection and selects the existing identity under users-table RLS. Browser input cannot select an issuer, subject, application user ID, role or permissions.

## First workspace

`POST /api/workspace` verifies the session and same-origin request, then accepts only business name, timezone, location name and optional address through a strict Zod schema. The internal onboarding primitive acquires an advisory transaction lock for the verified identity, ensures that identity, and returns its existing first workspace on retries. Concurrent submissions serialize before checking the workspace reference.

For a first submission, the server generates a business UUID and sets that tenant context locally. One transaction creates the business, Owner role, canonical permissions, location, active membership, audit event and identity workspace reference. All existing RLS checks remain enabled and forced. The narrowly scoped creation primitive can only create a new workspace for its verified caller. It accepts no business UUID and offers no operation to claim an existing workspace. Its database primitives are internal code, reached through the server-only session facade.

Migration `0002_first_workspace.sql` adds the nullable `users.home_business_id` foreign key and seeds the global `workspace.read` permission. The nullable reference lets the server discover the first business using only the caller's identity RLS context. It is a routing hint. Business reads still call `withTenant`, which verifies active membership and role permissions. The Owner receives the permissions implemented in this phase. New operations must introduce and migrate their own canonical keys in `src/db/permissions.ts`.

The first successful onboarding submission wins. Later submissions return that workspace, including when the submitted details differ. Business editing and workspace switching are outside this phase.

## Verification and production preparation

With local migrations applied, run `npm run db:test` and `npm run test:migrations`. Start `npm run dev -- --hostname localhost` on port 3000 before running `npm run test:auth` and `npm run test:workspace`. Runtime suites use disposable identities against actual HTTP endpoints and PostgreSQL, then remove their own rows. The workspace suite also verifies rollback by intentionally throwing after all creation writes inside the same transaction.

Production preparation still includes a production-specific connection policy, separate migration/runtime database roles, HTTPS and trusted origin configuration, persistent rate limiting for multiple application instances, an email provider and account recovery/verification policy, backup/restore procedures, and account deletion lifecycle handling for application identities. None of these services are provisioned by this milestone. The current connection policy accepts only local AgentFlow development credentials.

## Data and workflows

- External channel account IDs are unique per provider so a single account can resolve to one business during future webhook routing. Channel rows accept only a tenant- and connection-specific secret reference. An encrypted secret store and the integration that resolves references remain to be implemented.
- Message IDs are unique per channel within a tenant. Delivery events and assignment rows preserve history. A partial unique index permits one current assignment per conversation. Webhook ingestion and delivery reconciliation remain future work.
- Agent configurations have positive version numbers unique within each agent. The schema stores tool definitions, per-agent enablement and settings, and knowledge and channel links. Tool execution authorization remains an application responsibility.
- Event timestamps use `timestamptz`. Database triggers validate timezone identifiers for businesses, locations and appointments. The appointment timezone is a scheduling snapshot. Scheduling code will derive it from the location and enforce opening hours, status transitions and availability.
- The audit table can record tenant actions. Workflow code will insert audit events in the transaction performing the corresponding action.

An authenticated dashboard link may select a workspace with `/dashboard?businessId=<uuid>`. Without that parameter, the dashboard opens the user's home workspace. The requested UUID is only a selector. Every dashboard read goes through the same transaction-scoped membership and workspace.read checks as the workspace API. Following Overview retains the selected workspace.

The workspace directory uses migration 0003's SELECT policy to discover the verified user's active membership IDs outside tenant context. Each displayed workspace and dashboard still requires workspace.read through withTenant. The first-workspace POST remains idempotent. Additional creations send a UUID Idempotency-Key scoped to the application user, serialize with onboarding, and leave the original home workspace as the default.

Workspace invitations use an expiring 256-bit bearer token delivered privately to the selected email recipient by the owner. Only its SHA-256 digest is stored. Opening the link sends the public workspace selector to the server. Accepting or declining submits the fragment token through a server action. The verified session email, selected business, digest, expiry and pending status must match in a single transaction. Acceptance grants either Viewer (workspace and team directory) or Assistant manager (also assistant configuration and conversations). Existing active memberships retain their role. The Owner role is excluded from invitation, demotion, revocation and leave operations. Issuing another invitation for an email rotates its token. Owner issuance is limited to 20 per workspace per hour. Email delivery and identity-provider email verification require external configuration.
