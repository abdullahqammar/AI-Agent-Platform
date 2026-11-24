# AgentFlow Project Handbook

**Product, Business, Architecture, Security and Engineering Reference**\
**Version:** 1.0\
**Prepared:** 22 November 2026\
**Status:** Authoritative product-direction document; implementation
status must be verified against the repository.

------------------------------------------------------------------------

## 0. How to use this handbook

This handbook is the persistent product and engineering direction for
AgentFlow. Read it before planning or implementing substantial work.

### Authority and precedence

1.  The repository's `AGENTS.md` contains operational instructions for
    working in the codebase.
2.  This handbook defines the agreed product vision, business rules,
    architecture direction and implementation expectations.
3.  Existing source code, migrations, tests and verified runtime
    behavior establish what is actually implemented.
4.  A prior progress report is evidence to investigate, not proof that a
    feature still works.
5.  When code and this handbook conflict, do not silently change either.
    Identify the conflict, determine whether it is an implementation
    defect or a genuine product decision, and ask the Product Owner only
    if the decision cannot be resolved from existing direction.

Do not treat examples as requirements to hardcode. Do not invent product
scope beyond this handbook and explicit Product Owner decisions.

### Working model

-   **Product Owner:** the user. Owns business direction, pricing,
    commercial policy, provider choices, production approvals and
    material scope decisions.
-   **ChatGPT:** product and architecture partner.
-   **Codex:** implementation engineer. Expected to inspect, design,
    implement, test, document and report.
-   **AgentFlow repository:** the only repository Codex may modify for
    this project.
-   **OnPlas repository:** read-only reference for selected patterns and
    implementation ideas.

The Product Owner is a product owner/vibe coder, not an engineer who
should have to approve every routine technical choice. Make sound
technical decisions independently and explain material trade-offs.

------------------------------------------------------------------------

# Part I --- Product and business direction

## 1. Product vision

AgentFlow is a configurable, multi-tenant SaaS platform for creating,
managing and operating AI employees for businesses.

It is not merely a WhatsApp chatbot builder, a single-purpose
receptionist, or a collection of hardcoded bots.

Businesses should be able to configure specialized AI employees such as:

-   AI receptionist
-   AI sales representative
-   AI customer-support representative
-   AI booking and appointment assistant
-   AI lead qualification assistant
-   AI order or service-status assistant
-   Other business-specific roles created from reusable configuration

The first customer-facing channel focus is the official WhatsApp
Business Cloud API. The underlying platform must not be architecturally
limited to WhatsApp.

The platform must work across industries using configuration rather than
industry-specific code. Examples include healthcare practices, retail
and e-commerce, hospitality, real estate, education and professional
services. A dental clinic may be used as a demo or test tenant, but must
never define the product's architecture.

### Product principles

1.  Configurable rather than hardcoded.
2.  Multi-tenant by design, with strong tenant boundaries.
3.  AI actions are permissioned, validated and auditable.
4.  Human staff remain able to supervise and take over.
5.  Commercial entitlements are centrally controlled.
6.  All agreed long-term stages are developed as part of this project.
7.  Progressive release is achieved through feature controls, not by
    postponing architecture.
8.  A feature is not complete merely because a screen or database table
    exists.
9.  Prefer a coherent, reliable product over unnecessary abstraction or
    speculative infrastructure.
10. Preserve working foundations and existing data.

## 2. Product scope: develop all three stages now

All three stages describe the intended product scope. Codex must not
treat Stage 2 or Stage 3 as projects to be postponed until after launch.
Build the agreed capabilities now, in dependency-aware milestones, while
keeping later-stage capabilities disabled by default until the Platform
Owner releases them.

### Stage 1 --- Core platform

-   User registration, authentication and session management.
-   Multiple independent business workspaces per user account.
-   Workspace creation, onboarding and switching.
-   Business profile and operational configuration.
-   Team invitations, memberships, roles and permissions.
-   Configurable AI employee creation and lifecycle.
-   Agent instructions, identity, tone, knowledge and tools.
-   Persistent customer records and conversations.
-   Official WhatsApp Business Cloud API integration.
-   Inbox, assignment, staff takeover and human handoff.
-   Safe, permission-controlled tool execution.
-   Reusable business workflows, initially including relevant
    appointment, lead and request patterns.
-   Tenant isolation, access control, auditability and data protection.
-   Platform administration and Site Identity.

### Stage 2 --- Commercial platform

-   Subscription plans and business-level subscription relationships.
-   Configurable plan entitlements and limits.
-   Subscription lifecycle, renewals, cancellations and payment
    recovery.
-   Usage metering, allowances and configurable overage policies.
-   AI provider abstraction and model registry.
-   Multiple approved AI models and model eligibility.
-   Model selection and intelligent routing.
-   Advanced agent and team capabilities.
-   Commercial administration and subscription management.
-   Workspace-level visibility into plan, usage and limits.

### Stage 3 --- Advanced platform

-   Advanced AI orchestration and multi-agent collaboration.
-   More sophisticated workflow automation.
-   Additional communication channels.
-   Advanced analytics and reporting.
-   Enterprise capabilities.
-   Custom integrations and extensibility.
-   Advanced operational automation, monitoring and governance.

The list is the agreed direction, not permission to invent adjacent
products. Break capabilities into testable requirements during
implementation. If a capability is too broad, define its complete
vertical slice and dependencies rather than creating superficial
placeholders.

## 3. User identity and business workspace model

A user identity is not the same thing as a business workspace.

One login/email must be able to create and manage multiple businesses. A
user may also be invited into workspaces owned by other users.

Each workspace is an independent tenant with its own:

-   Business profile and operational settings.
-   Subscription, entitlements and billing history.
-   Team memberships, roles and permissions.
-   AI agents and agent configurations.
-   Customers, conversations and messages.
-   Channels, phone numbers and integrations.
-   Knowledge sources and business data.
-   Workflows and operational records.
-   Usage records, limits and relevant audit events.

A user may have different roles in different workspaces. Membership and
authorization must always be evaluated in the context of the selected
business.

### Workspace switching

Provide a clear workspace selector for users who belong to multiple
businesses. Switching workspaces must change the active tenant context
safely. Never rely on a client-supplied business ID without server-side
membership and permission validation.

### Tenant isolation

No business may read or modify another business's data unless a
deliberately designed, explicitly authorized sharing capability is
introduced. Do not introduce cross-tenant sharing casually.

Tenant isolation must apply to database queries, API routes, server
actions, background jobs, files, AI retrieval, integrations, analytics
and exports.

## 4. Business profile is not customer branding

A workspace needs operational business information because its AI
employees must understand the business they represent.

Business profile information may include:

-   Business name and industry/category.
-   Business description and services/products.
-   Contact details and website.
-   Addresses and locations.
-   Operating hours and holiday rules.
-   Time zone and supported languages.
-   Service areas and relevant operational policies.
-   Other structured information needed by agents and workflows.

This is business configuration and knowledge.

**Do not build customer-specific white-label branding.** Do not add
customer logos, favicons, themes, custom branded versions of AgentFlow
or tenant-specific rebranding unless the Product Owner explicitly
changes this direction.

AgentFlow is one SaaS platform. Its Site Identity belongs to AgentFlow,
not to each customer.

------------------------------------------------------------------------

# Part II --- AgentFlow platform identity and administration

## 5. Site Identity --- AgentFlow only

Implement a dedicated Site Identity area under Platform Admin → Settings
→ Site Identity.

This feature controls the identity of AgentFlow itself. It is not a
customer-facing branding editor.

The Platform Owner or explicitly authorized platform administrator
should be able to manage appropriate settings, including:

-   Platform/site name.
-   Site title and tagline.
-   Primary logo.
-   Alternate logo for suitable backgrounds or themes.
-   Favicon.
-   Application icon where applicable.
-   Default SEO title and description.
-   Default social-sharing title, description and image.
-   Other essential platform identity assets or metadata, where
    justified.

### Site Identity requirements

-   Persist settings in the database; do not scatter editable identity
    values as hardcoded constants.
-   Use secure, persistent asset storage.
-   Validate upload type, size and image requirements.
-   Provide sensible defaults and fallbacks.
-   Propagate changes to all applicable AgentFlow surfaces consistently.
-   Ensure supported web and future application surfaces use the same
    authoritative identity source where appropriate.
-   Handle caching and asset replacement so stale assets do not persist
    indefinitely.
-   Restrict editing to authorized platform roles.
-   Record important changes in the audit trail.
-   Prevent accidental loss of existing identity assets during
    replacement.
-   Include functional validation and browser verification.

Do not create a nonfunctional settings mockup. Do not let workspace
owners alter AgentFlow's platform identity. Do not turn Site Identity
into a general CMS unless separately approved.

## 6. Platform administration

Build the administration capabilities needed to operate AgentFlow safely
and commercially. The precise navigation and screen grouping may be
decided by engineering, provided the required functions are discoverable
and access-controlled.

Platform administration should ultimately support:

-   Site Identity.
-   Platform feature registry and release controls.
-   Subscription plans and entitlements.
-   Workspace and account administration.
-   Approved AI providers and models.
-   Usage and operational visibility.
-   Integration/provider configuration status.
-   Audit events and security-relevant administration.
-   Operational health and failure visibility.

Platform Owner privileges must be protected. Do not assume every
workspace administrator is a platform administrator. Platform roles and
tenant roles are distinct authorization domains.

------------------------------------------------------------------------

# Part III --- AI workforce product

## 7. AI employee model

Build a reusable AI agent architecture. Do not implement each job role
as a separate hardcoded chatbot.

Each agent should have, as appropriate:

-   Display name and role.
-   Purpose and responsibilities.
-   System instructions and behavior rules.
-   Communication tone and supported languages.
-   Business context.
-   Shared and agent-specific knowledge access.
-   Authorized tools and permissions.
-   Assigned communication channels.
-   Approved model and configuration.
-   Escalation and handoff rules.
-   Availability and operating rules.
-   Draft, test, publish, pause and archive lifecycle.
-   Configuration versioning and history.

Agents must be scoped to one business workspace. A tool or knowledge
source must not be accessible merely because it exists somewhere in
AgentFlow.

### Shared and agent-specific knowledge

Support reusable business-level knowledge and agent-specific knowledge.
Agents may access shared information only where their workspace and
permissions allow it. Avoid unnecessary duplication of the same business
facts across agents.

Knowledge ingestion and retrieval must consider file safety, access
control, tenant isolation, source status, freshness and deletion
behavior.

### Agent lifecycle

Provide a deliberate lifecycle such as draft → testing →
published/active → paused or archived. Exact labels may be refined, but
publishing must not accidentally expose an untested configuration.

Maintain version history or an equivalent safe rollback mechanism for
meaningful agent configuration changes.

## 8. Channels and routing

WhatsApp Business Cloud API is the initial channel priority.

Design channel abstractions so additional channels can be added without
rewriting the agent core.

A workspace may have multiple connected channels or numbers, subject to
plan entitlements and provider constraints. Channel-to-agent routing
must be explicit and validated.

Do not assume that multiple agents can independently reply to the same
inbound conversation at the same time. Provide a deterministic routing
and ownership policy. A conversation should have a clear active agent
and clear human-assignment/handoff state.

Provider credentials and tokens must be protected and never exposed to
the browser or logs.

## 9. Inbox and human handoff

Provide a persistent operational inbox with clear conversation states
and ownership.

The experience should support the necessary concepts, including:

-   New or unhandled conversations.
-   AI-handled conversations.
-   Conversations requiring human attention.
-   Assigned conversations.
-   Waiting or follow-up states.
-   Resolved conversations.

Exact state names and transitions should be normalized in the domain
model rather than duplicated inconsistently across UI and APIs.

Staff should be able to inspect conversation history, assign or reassign
ownership, add internal context where supported, take over from AI, and
return control to AI according to explicit rules.

Human takeover must prevent conflicting AI replies. Define and test the
behavior for in-flight AI runs, queued messages, retries and handoff
races.

## 10. Tools and business workflows

AI tools are controlled operations, not unrestricted model capabilities.

Each tool must define: - Input schema and validation. - Authorization
requirements. - Workspace/tenant scope. - Permitted agent roles or
capabilities. - Execution behavior. - Idempotency where appropriate. -
Audit and error behavior. - Human confirmation requirements for
sensitive actions.

Never allow arbitrary code execution, arbitrary SQL or unrestricted
database access by an AI model.

Build reusable workflow patterns for business tasks such as
appointments, leads and requests. Keep domain-specific rules
configurable where practical. Do not build an oversized generic workflow
engine before the real use cases require it.

------------------------------------------------------------------------

# Part IV --- Feature controls and commercial system

## 11. Central feature registry

Implement a centralized, extensible feature registry.

Each feature should have a stable identifier, description,
lifecycle/status, dependencies and the appropriate activation policy.
Avoid scattered hardcoded booleans and inconsistent feature checks.

Support three separate controls:

1.  **Platform availability:** Platform Owner decides whether AgentFlow
    offers/releases the capability.
2.  **Plan entitlement:** the workspace's subscription determines
    whether it is included.
3.  **Workspace preference:** the workspace owner can enable or disable
    an optional capability when eligible.

A capability is available only when every applicable condition is
satisfied.

### Enforcement

Enforce feature controls server-side in:

-   Pages and navigation.
-   API routes and server actions.
-   Background workers and scheduled jobs.
-   AI tools and agent execution.
-   Integrations and webhooks.
-   Usage metering and billing paths.
-   Exports and other access paths.

UI hiding is never sufficient enforcement.

### Safe deactivation

Disabling a feature must not silently destroy customer data. Define what
happens to existing records, queued jobs, active workflows and
integrations. Prevent new execution where appropriate, handle in-flight
operations safely, and preserve data unless a separately approved
retention/deletion policy applies.

Mandatory security, tenant isolation, auditability and data protection
are not optional features and must never be disabled through commercial
flags.

Stage 2 and Stage 3 features must be implemented and tested but default
to disabled until released. A feature flag does not make incomplete
functionality safe to expose.

## 12. Subscription and entitlement model

Subscriptions belong to business workspaces.

A single user may own multiple workspaces with different plans, usage
and billing state.

Plans should support configurable entitlements such as:

-   Maximum active agents.
-   Connected channels/numbers.
-   Approved model access.
-   AI usage allowances.
-   Team seats.
-   Knowledge capacity.
-   Automation capabilities.
-   Advanced analytics or integrations.
-   Other justified limits.

Implement a coherent entitlement evaluation service. Do not duplicate
plan logic in individual pages or routes.

### Subscription lifecycle

Design for plan activation and changes, renewals, cancellation, failed
payments, recovery/retries, grace periods, refunds and history.

Payment state must be established from trusted server-side provider
events. Webhooks must be authenticated and idempotent. Handle duplicate,
delayed and out-of-order events safely.

Track AgentFlow subscription charges separately from third-party costs
such as messaging, model usage and storage.

Do not choose a payment provider, invent prices, connect paid services,
incur charges or activate live billing without explicit Product Owner
approval.

## 13. Usage and cost accounting

Create reliable usage records for the relevant billable or limited
operations. Define usage dimensions and units before implementing
metering.

Usage accounting should be: - Tenant-scoped. - Auditable. - Idempotent
where events may be retried. - Resistant to duplicate counting. -
Consistent with entitlement evaluation. - Capable of distinguishing
estimated from finalized external provider costs.

Do not represent estimated provider costs as confirmed invoices. Handle
missing or delayed provider usage data transparently.

------------------------------------------------------------------------

# Part V --- AI provider and orchestration architecture

## 14. Provider-independent AI engine

Do not permanently couple AgentFlow to one AI provider or model.

Create a practical provider abstraction and controlled model registry.
Support provider adapters, approved models, capability metadata, model
entitlements, configuration and usage tracking.

Model selection/routing may consider:

-   Platform-approved models.
-   Workspace plan eligibility.
-   Task type and complexity.
-   Quality requirements.
-   Cost and budget.
-   Provider availability and errors.
-   Workspace preferences within allowed limits.

Do not build a complex autonomous routing system before there are
reliable metrics and safe fallbacks. Implement the foundation and agreed
routing capabilities with explicit controls.

## 15. AI execution safety

Keep reasoning, tool selection, authorization and tool execution
separate.

Before executing an AI-requested operation: 1. Validate the tool exists
and is enabled. 2. Validate the agent is permitted to use it. 3. Resolve
the authenticated workspace context server-side. 4. Validate and
normalize inputs. 5. Check relevant business permissions and feature
entitlements. 6. Apply confirmation rules for sensitive actions. 7.
Execute through a controlled service. 8. Record appropriate audit and
usage events. 9. Return a bounded result to the model.

Do not trust model output as authorization. Do not allow the model to
choose a tenant ID that overrides authenticated context.

## 16. Advanced orchestration and multi-agent collaboration

Stage 3 should support more advanced agent coordination, but must
preserve clear responsibility and authorization boundaries.

Define explicit orchestration contracts: task ownership, agent
capabilities, permitted handoffs, context transfer, budgets, termination
conditions, failure recovery and auditability.

Avoid uncontrolled agent loops, unbounded tool calls, hidden cost
escalation or agents granting permissions to one another.

------------------------------------------------------------------------

# Part VI --- Automation, reliability and operations

## 17. Event-driven processing

Design reliable event processing for:

-   Incoming messages and delivery events.
-   Conversation and AI processing.
-   Tool execution.
-   Human handoff and assignment.
-   Subscription and payment events.
-   Usage thresholds.
-   Notifications.
-   Webhook retries.
-   Integration failures.
-   Scheduled renewals and maintenance.
-   Approved business workflows.

Implement appropriate idempotency, retries, timeouts, failure handling,
dead-letter or equivalent recovery, observability and safe replay.

Use the simplest architecture that meets reliability needs. Do not
introduce microservices, brokers or infrastructure that the product does
not yet need. Keep boundaries clean enough to evolve.

## 18. Reliability and observability

Provide enough operational visibility to diagnose failures without
exposing secrets or sensitive customer content unnecessarily.

Track relevant operational states, failed jobs, retries, provider
errors, webhook processing and system health.

Sensitive logs must be redacted. Avoid logging access tokens, API keys,
passwords, full payment credentials or unnecessary personal data.

Backups, restore procedures, migrations and recovery must be treated as
real operational requirements, not assumed from successful local
development.

------------------------------------------------------------------------

# Part VII --- Security, privacy and governance

## 19. Authentication and authorization

Use the existing authentication architecture unless inspection proves a
material defect.

Authentication establishes identity; authorization determines what that
identity may do. Never confuse a valid session with permission to access
a workspace or platform administration function.

Use server-side permission checks for every protected operation. Enforce
least privilege and validate role changes, invitations and membership
removal.

Platform administration roles and business workspace roles must remain
separate.

## 20. Tenant isolation and database security

Preserve and verify the existing PostgreSQL tenant-security design.

Inspect row-level security policies, transaction-scoped tenant context,
composite foreign keys and runtime database privileges. Verify that all
tenant-scoped operations establish the correct context.

Test cross-tenant ID substitution, unauthorized reads and writes,
background-job isolation, file access, exports, AI retrieval and
webhook-to-tenant mapping.

Never rely only on application UI filtering for tenant security.

## 21. Secrets and external integrations

-   Keep secrets server-side.
-   Never commit environment files, API keys, tokens, private keys or
    credentials.
-   Never ask the Product Owner to paste secrets into ordinary chat or
    commit them to the repository.
-   Use environment variables or approved secret-management mechanisms.
-   Validate webhook signatures and provider identity.
-   Rotate or replace credentials safely.
-   Redact sensitive values from logs and error messages.
-   Document owner-operated provider setup without inventing
    credentials.

## 22. Privacy and data lifecycle

Design data access, correction, export and deletion behavior with tenant
isolation and auditability.

Do not silently delete business data during feature deactivation,
account changes, migrations or retries. Destructive actions need clear
scope, preview where appropriate, authorization and explicit approval
when irreversible or production-impacting.

Apply retention and deletion rules only where they have been defined and
approved. Do not invent legal retention periods.

------------------------------------------------------------------------

# Part VIII --- User experience and product quality

## 23. UX principles

The application should feel like a coherent professional SaaS product.

-   Clear navigation and workspace context.
-   Consistent design system and reusable components.
-   Useful empty, loading, error and disabled states.
-   Clear validation and recovery guidance.
-   Responsive layouts for supported screen sizes.
-   Accessible controls and readable information hierarchy.
-   No dead buttons, fake data presented as real, or placeholder
    workflows represented as complete.
-   Avoid unnecessary configuration complexity for ordinary business
    users.

A user should understand which business workspace they are operating in
and which AI employee/channel/conversation they are managing.

## 24. Site Identity UX

Site Identity is part of Platform Admin settings and controls AgentFlow
itself. It must not appear as a tenant branding editor.

The identity form should show current assets, support safe replacement,
explain applicable requirements and give a reliable preview where
practical. Save operations must persist and propagate correctly.

## 25. Browser and responsive acceptance

For meaningful user-facing flows, verify actual browser interaction, not
just compilation or component tests.

At minimum, test: - Registration. - Login and logout. - Workspace
onboarding. - Workspace switching for multi-workspace users. - Dashboard
loading and navigation. - Relevant settings forms. - AI agent creation
and configuration. - Inbox and handoff flows. - Site Identity
administration. - Responsive behavior at representative mobile and
desktop widths.

Report what was actually tested, browser/tool used, viewport sizes and
any limitations. Do not claim browser verification if only unit tests or
build checks were run.

------------------------------------------------------------------------

# Part IX --- Engineering execution rules

## 26. Existing stack and architecture

The known project stack is:

-   Next.js App Router.
-   TypeScript.
-   Tailwind CSS.
-   PostgreSQL.
-   Drizzle ORM.
-   postgres-js.
-   Zod.
-   Better Auth.

Treat this as a starting baseline, not a substitute for inspecting the
current repository. Preserve these choices unless a justified technical
issue requires a change.

The project is a single Next.js application containing web UI and
backend/API routes. Do not introduce a separate backend or mobile
backend without a real requirement and Product Owner approval.

## 27. Repository workflow

Before changing code: 1. Read `AGENTS.md` and this handbook. 2. Inspect
Git status and preserve unrelated work. 3. Inspect the relevant code,
schema, migrations, tests and docs. 4. Understand the current behavior.
5. Identify reusable code and avoid duplication. 6. Define the smallest
coherent implementation slice and its dependencies.

Work only in the AgentFlow repository.

Do not force-push, rewrite history, discard unrelated changes or
overwrite user work. Do not commit secrets or sensitive data.

## 28. Implementation expectations

-   Do not stop after writing a roadmap.
-   Do not produce repeated planning documents instead of implementing.
-   Do not ask for approval for routine technical decisions.
-   Implement functional vertical slices across backend, frontend,
    persistence and tests.
-   Keep migrations and schema changes consistent.
-   Preserve existing data and behavior.
-   Add tests at the correct layers.
-   Verify actual runtime behavior where possible.
-   Update docs when implementation changes architectural facts.
-   Do not claim completion based solely on code presence or successful
    compilation.
-   Do not replace real provider integrations with mocks and then report
    provider acceptance.

Complete independent work even if another task is blocked by external
setup or an owner decision.

## 29. Decision boundaries

Make normal engineering decisions independently.

Ask the Product Owner only when a genuine business decision is
necessary, including: - Final prices and commercial policies. - Payment
provider selection or paid-service activation. - External provider
accounts, credentials or domain verification. - Material changes to
agreed scope. - Destructive or irreversible operations. - Production
deployment or migration approvals. - Ambiguous business rules that
cannot be safely inferred.

When asking, state the exact decision, why it is required, the
recommended default and the consequence of each material option. Do not
bundle many unrelated questions together.

Never purchase services, incur charges or make destructive production
changes without explicit approval.

------------------------------------------------------------------------

# Part X --- OnPlas reference policy

## 30. OnPlas is a read-only reference

Repository: `abdullahqammar/Onplas` (private).

Use it only to study relevant reusable patterns, such as: - Site
Identity and platform administration. - Reusable UI components and
design conventions. - Authentication and authorization patterns. -
Database and migration conventions. - Tenant/security approaches where
applicable. - Testing, audit and operational workflows. - Storage
patterns where relevant.

Do not modify, commit to, push to, create branches in or otherwise
mutate OnPlas.

Prefer read-only repository permissions. If permissions cannot be
separated, use a read-only copy or another safe method.

Do not blindly copy marketplace-specific business logic, unnecessary
components or dependencies. Do not add OnPlas as a runtime dependency.
Respect its license.

AgentFlow remains the only implementation repository.

------------------------------------------------------------------------

# Part XI --- Known repository baseline and first execution priorities

## 31. Repository identity

Known AgentFlow repository:
`https://github.com/abdullahqammar/AI-Agent-Platform`

Known local project directory:
`D:\Abdullah Project\App Development\AI Development\Whatsapp AI Training\agent-platform`

These values are reference information. Verify the actual checkout and
remote before acting. Do not assume a path or branch if the environment
differs.

The user has previously confirmed that the AgentFlow repository is
private and synchronized with GitHub. Environment files are intended to
remain ignored by Git. Still apply normal secret hygiene without
repeatedly asking the user to prove already-established facts.

## 32. Existing implementation reported so far --- verify, do not blindly trust

Prior development reports described the following work:

### Database foundation

-   Approximately 24 application tables.
-   Business membership, roles and permissions.
-   Business locations.
-   Versioned agent configuration.
-   Tools and channels.
-   Customers, conversations and messages.
-   Delivery events and assignments.
-   Knowledge records.
-   Appointment and status-history structures.
-   Audit events.
-   Foreign keys, uniqueness constraints and indexes.
-   Composite tenant-aware relationships.
-   Transaction-scoped tenant identity and row-level security on tenant
    tables.
-   Live PostgreSQL tests for cross-tenant ID substitution, unauthorized
    writes, permissions and foreign keys.

### Authentication foundation

-   Better Auth integration.
-   Separate authentication tables for users, sessions, accounts and
    verification.
-   Shared database client.
-   Authentication API handler.
-   Registration, login, session and logout tests.
-   Duplicate registration and deletion-cascade checks.

### Workspace onboarding foundation

A prior report stated that authenticated workspace creation was verified
through real Next.js endpoints and local PostgreSQL: -
Session-to-application identity mapping. - Atomic creation of a
business, Owner role, permissions, location, membership and audit
event. - Concurrent onboarding protection. - Registration, login,
duplicate handling, session, logout and onboarding retry/rollback
tests. - Permission checks and anonymous/cross-business substitution
tests. - Dashboard showing business, role and location.

The prior report referenced migration `0002_first_workspace.sql`.

### Known acceptance gap

The previous report explicitly stated that browser interaction and
responsive-layout verification had not been completed for registration,
login, onboarding and dashboard flows.

**First priority:** inspect the current code and tests, then complete
real browser interaction and responsive verification for those flows.
Fix genuine defects discovered. Do not rebuild the foundations if they
are already sound.

### Important caveat

The above is a historical reported baseline, not a guarantee of current
repository state. Verify the actual code, migration journal, tests and
runtime behavior. Correct outdated documentation if the implementation
differs.

## 33. Immediate execution sequence

After inspecting the repository:

1.  Read `AGENTS.md`, this handbook and relevant project docs.
2.  Verify Git state and current branch.
3.  Verify the existing implementation and reported milestones.
4.  Complete browser and responsive acceptance for registration, login,
    onboarding and dashboard.
5.  Fix any genuine defects and record evidence.
6.  Produce a concise dependency-aware implementation sequence for the
    remaining agreed scope.
7.  Continue implementation without waiting for approval on ordinary
    technical decisions.

The broader sequence should respect dependencies. Likely foundations
include: - Workspace identity and membership correctness. - Platform
roles and administration. - Agent configuration and lifecycle. -
Knowledge and tool permissions. - Messaging/channel integration and
reliable processing. - Inbox and human handoff. - Central feature
registry and server-side enforcement. - Usage and subscription
architecture. - Provider/model abstraction and routing. - Advanced
orchestration, channels, integrations and analytics. - Site Identity and
platform operational administration. - End-to-end security, browser,
reliability and deployment acceptance.

This is not a rigid mandate to implement in this exact order if
repository inspection reveals a better dependency sequence. Do not skip
required capabilities.

## 34. Milestone reporting format

At the end of each coherent milestone, provide a concise report with:

1.  **Completed:** actual functionality delivered.
2.  **Changed:** important files, schema and migrations.
3.  **Verification:** exact commands/tests and results.
4.  **Security:** relevant tenant and permission checks.
5.  **Browser/device:** what was actually exercised.
6.  **External setup:** owner actions still required.
7.  **Limitations:** incomplete or skipped acceptance.
8.  **Next task:** one highest-priority task.

Use precise status labels: - Implemented. - Locally tested. -
Browser-verified. - Provider-configured. - Production-verified.

Do not treat skipped tests as passed. Do not describe local success as
production verification.

------------------------------------------------------------------------

# Final product standard

Deliver a complete, secure, reliable and commercially operable AI
workforce SaaS platform.

All agreed Stage 1, Stage 2 and Stage 3 capabilities must be developed
as part of this project. Later-stage capabilities remain disabled by
default until the Platform Owner activates them and the relevant
plan/workspace conditions are satisfied.

AgentFlow must support multiple independent business workspaces per
user, configurable AI employees across industries, safe tool execution,
reliable communications, human oversight, commercial controls and
platform-level Site Identity.

Build the agreed product fully. Do not omit agreed functionality, invent
unrelated scope, introduce customer white-label branding, rewrite
working foundations unnecessarily or waste implementation time on
repeated planning and unnecessary approval cycles.

## Business Connect and Business Copilot

The master blueprint now includes a shared business connection layer for customer-facing AI employees and the authenticated internal Business Copilot. Both use the workspace's shared AI foundation. Authority comes from the request's verified origin, current actor, connection grant, AI assignment and record-level permission. Keep private copilot conversations outside customer transcripts and staff handoff exports. For source access, freshness and revocation rules, follow AGENTFLOW_ARCHITECTURE_AND_SECURITY.md. Relevance AI remains the primary SaaS experience benchmark. Use AWS and Amazon Connect as architectural and service-operations references.
