# AgentFlow

AgentFlow is a configurable business-assistant workspace built with Next.js App Router, Better Auth, Drizzle and PostgreSQL. The current milestone provides registration, login, first-business onboarding, owner authorization and an authenticated workspace.

## Local setup

Use Node.js 24 and npm. Install dependencies with `npm ci`.

The ignored root `.env.local` must contain `DATABASE_URL`, `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`. The database connection is deliberately restricted to local `agentflow_dev` as `agentflow_app`. Generate the authentication secret locally and keep it private. Set the development auth URL to `http://localhost:3000`.

Review pending migration SQL, then run:

```sh
npm run db:migrate
npm run dev -- --hostname localhost
```

Open [AgentFlow locally](http://localhost:3000). Register an account, create a business with its timezone and initial location, and enter the dashboard. Sign out and sign in again to return to the same workspace.

## Checks

Run these checks against the local development database:

```sh
npm run db:test
npm run test:migrations
npx tsc --noEmit
npm run lint
npm run build
```

With the development server running on localhost port 3000, run the HTTP integration suites:

```sh
npm run test:auth
npm run test:workspace
```

The suites create disposable test users and workspaces, exercise actual endpoints and PostgreSQL, then remove their own fixtures. Passwords and session cookies stay in memory. The workspace suite covers concurrent identity creation and onboarding, retries, rollback, owner permissions, anonymous access and cross-business access attempts.

Generate schema changes with `npm run db:generate -- --name=<change>`. Review SQL before running migrations. Keep applied migration files immutable. Generation and journal checks are offline operations. Runtime database checks require the local configuration.

## Architecture

See [database architecture](docs/database.md) for identity mapping, the onboarding transaction, permission definitions, RLS boundaries, migration behavior and production preparation.

The current UI contains Overview and clearly unavailable navigation for upcoming modules. Agent management, WhatsApp connections, inbox workflows and business editing are future milestones.

Production preparation requires HTTPS, production-specific database access configuration, separate migration/runtime roles, shared rate-limit storage for multiple instances, email and account recovery configuration, an account lifecycle policy, and backup/restore procedures. The local environment is the only configured database target.
