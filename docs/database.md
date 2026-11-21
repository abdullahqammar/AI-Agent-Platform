# AgentFlow database foundation

Run `npm run db:generate -- --name=<change>` to generate a Drizzle migration, review its SQL, then run `npm run db:migrate`. The migration runner reads the local `.env.local`, validates the loopback database URL, and verifies database, login role, and PostgreSQL major version before issuing DDL. It uses Drizzle migration files and records their hashes in `public.__drizzle_migrations`. The advisory lock and transaction serialize migration runs and commit schema changes with their journal entries. Keep applied migration files immutable. Review RLS policies and triggers explicitly when generating migrations because those parts of the foundation are maintained in SQL.

Run `npm run db:test` against the migrated development database. The tests create uniquely identified fixtures, exercise PostgreSQL through the application role, and clean up the fixture records.

## Tenant access

Use `withTenant` from `src/db/index.ts` for tenant operations. Supply the issuer and subject from a verified server session, the requested business UUID, and a permission key selected by server code for the operation. Keep all queries inside the transaction callback. It checks active membership and role permission before running the operation. The transaction sets RLS context locally, so the context expires on commit or rollback.

Composite foreign keys include the business UUID for tenant-to-tenant links. Forced RLS limits tenant-owned rows to the transaction business and user rows to the transaction identity. RLS trusts transaction context set by the backend. Treat the database connection and transaction callback as privileged server code. In local development, the application role owns the tables. Before deployment, provision a separate migration owner and grant the runtime role only the DML needed by the application. The authenticated session, onboarding, route integration, and endpoint-level isolation tests belong to the next phase.

## Data and workflows

- External channel account IDs are unique per provider so a single account can resolve to one business during future webhook routing. Channel rows accept only a tenant- and connection-specific secret reference. An encrypted secret store and the integration that resolves references remain to be implemented.
- Message IDs are unique per channel within a tenant. Delivery events and assignment rows preserve history. A partial unique index permits one current assignment per conversation. Webhook ingestion and delivery reconciliation remain future work.
- Agent configurations have positive version numbers unique within each agent. The schema stores tool definitions, per-agent enablement and settings, and knowledge and channel links. Tool execution authorization remains an application responsibility.
- Event timestamps use `timestamptz`. Database triggers validate timezone identifiers for businesses, locations and appointments. The appointment timezone is a scheduling snapshot. Scheduling code will derive it from the location and enforce opening hours, status transitions and availability.
- The audit table can record tenant actions. Workflow code will insert audit events in the transaction performing the corresponding action.
