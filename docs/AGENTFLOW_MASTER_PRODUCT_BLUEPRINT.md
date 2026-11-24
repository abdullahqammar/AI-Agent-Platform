# AgentFlow — Master Product Blueprint, Complete Roadmap & Next Development Milestone

You are working as the primary implementation engineer for **AgentFlow**, a configurable, multi-tenant AI workforce SaaS platform.

The Product Owner wants you to establish a permanent, comprehensive product blueprint and development roadmap inside this repository, incorporating all previously agreed requirements, existing implementation, architectural decisions, and relevant inspiration from the OnPlas reference repository.

This is not permission to expand the product indiscriminately. The objective is to document and deliver the complete agreed AgentFlow vision, avoid forgetting requirements between development sessions, and maintain a reliable source of truth.

## 1. Mandatory repository boundaries

There are two repositories available:

**Writable implementation repository**
- `/workspace/AI-Agent-Platform`
- GitHub: `abdullahqammar/AI-Agent-Platform`

**Read-only reference repository**
- OnPlas, currently checked out under `/workspace` (verify its exact location before accessing it).
- GitHub: `abdullahqammar/Onplas`

The permissions are deliberately different.

### AgentFlow

You are authorized to:
- Inspect and modify source code and documentation.
- Create and update migrations.
- Implement features and fix defects.
- Run development tests, builds and local database operations.
- Create commits and push changes to the AgentFlow remote, subject to the verification rules below.

### OnPlas — STRICTLY READ-ONLY

OnPlas is an inspiration and reference repository only.

You may inspect its:
- Source code and directory structure.
- Pages, dashboards, forms, components and layouts.
- Admin and user interfaces.
- Feature implementations and workflows.
- Database structure and migrations.
- Authentication, authorization and permission patterns.
- Settings, configuration and feature controls.
- Notifications, email, uploads, storage and background processing.
- Security, audit, moderation and operational safeguards.
- Documentation and product architecture.

You must NEVER:
- Edit, create, delete, rename, move, format or overwrite anything in OnPlas.
- Run mutating installation, build, test, migration or deployment commands against it.
- Commit, push, merge, rebase, cherry-pick or amend anything in OnPlas.
- Create or delete branches, tags, releases or pull requests there.
- Modify its remotes, GitHub settings, permissions, workflows, secrets or configuration.
- Treat its broad GitHub permissions as authorization to modify it.

**All implementation work belongs exclusively in AgentFlow.**

Before every commit or push, verify:
1. Current working directory.
2. Git repository root.
3. Current branch.
4. Remote URL.
5. The repository is `/workspace/AI-Agent-Platform`.
6. The remote is `abdullahqammar/AI-Agent-Platform`.

Never use force-push or rewrite existing history.

Preserve all existing uncommitted AgentFlow changes. Do not overwrite or discard work simply because it predates your current task.

## 2. First: read and understand the existing project

Before planning or modifying anything:

1. Read the complete root `AGENTS.md`.
2. Read the complete `docs/AGENTFLOW_HANDBOOK.md`.
3. Read all relevant existing architecture, product, security, roadmap and development documents.
4. Inspect the actual repository structure and current Git status.
5. Inspect the current database schema, migration history, authentication, authorization, workspace architecture, APIs, UI and tests.
6. Verify which features are implemented, partially implemented, missing, locally tested, browser-verified or production-verified.
7. Do not assume a feature exists merely because documentation mentions it.
8. Do not assume a feature is missing merely because it is not immediately visible in the dashboard.

Preserve existing working foundations. Avoid unnecessary rewrites.

## 3. OnPlas reference-repository research

Inspect OnPlas systematically as a product and engineering reference.

Do not limit your inspection to the homepage or a few screenshots.

Study its existing implementation and identify reusable concepts in the following areas:

- Authentication, registration, login, account security and session management.
- User profiles, account settings and account lifecycle.
- Multi-role permissions and access control.
- Admin dashboards and platform administration.
- Dashboard navigation, layouts, sidebars, responsive design and reusable UI components.
- Forms, validation, tables, filters, search, pagination and bulk actions.
- Notifications, notification preferences and email delivery.
- File uploads, private/public storage and media handling.
- Audit logs, activity history and administrative traceability.
- Feature flags, settings and configuration management.
- Subscription and commercial administration concepts.
- User management, invitations, moderation and account restrictions.
- Security controls, privileged actions, two-factor authentication and session protection.
- Reporting, analytics and operational dashboards.
- Background jobs, retry mechanisms and event processing.
- Data export, retention, deletion and recovery safeguards.
- Localization, accessibility and mobile-responsive behavior.
- Error handling, loading states, empty states and success feedback.

Also inspect other relevant components and capabilities you discover.

### How to use the findings

For every potentially useful feature or component, classify it as:

1. **Directly applicable** — AgentFlow needs the same underlying capability.
2. **Adaptable** — The concept is useful but must be redesigned for AI workforce workflows.
3. **Reference only** — Useful as inspiration, but not necessary for AgentFlow.
4. **Not applicable** — Specific to OnPlas's plastics marketplace business.

For each applicable or adaptable item, document:
- What it does in OnPlas.
- Why it is relevant to AgentFlow.
- How it should work in AgentFlow.
- Which AgentFlow module should own it.
- Whether it already exists in AgentFlow.
- What remains necessary to implement it.

Do not blindly copy OnPlas's business-specific workflows.

AgentFlow is an independent product with its own architecture, domain model and user experience.

Use OnPlas to discover good patterns and avoid reinventing useful functionality. Do not copy code, assets or third-party material without verifying applicable licensing and compatibility.

**Keep OnPlas completely untouched throughout this research.**

## 4. AgentFlow — product vision

AgentFlow is a configurable, multi-tenant AI workforce platform.

It allows businesses to create, configure, deploy, manage and monitor AI agents that perform real business roles.

It must NOT become a hard-coded WhatsApp chatbot or a dental-clinic-only receptionist.

Possible agent roles include:
- Receptionist.
- Sales representative.
- Customer support representative.
- Lead qualification assistant.
- Appointment and booking assistant.
- Customer success assistant.
- E-commerce shopping assistant.
- Real estate inquiry assistant.
- Hotel reservation assistant.
- Other configurable business roles.

A dental clinic may be used as a demo or test business, but the underlying platform must remain industry-independent.

The business owner must be able to configure:
- Business identity and profile.
- Agent purpose and responsibilities.
- Agent personality, tone and communication style.
- Languages.
- Knowledge sources.
- Tools and permissions.
- Supported channels.
- Escalation rules.
- Workflows and business processes.
- Model eligibility and settings.
- Operating hours and availability.
- Testing, publishing and versioning.

The product should eventually operate as a configurable AI workforce, not merely an automated chat responder.

## 5. Multi-business and multi-user architecture

A single user account must be able to:
- Own multiple independent business workspaces.
- Create and switch between workspaces.
- Belong to workspaces owned by other people.
- Accept invitations to other workspaces.
- Have different roles in different workspaces.
- Leave a workspace where permitted.
- Manage independent business environments without data mixing.

Each workspace must independently own or control its:
- Business identity and configuration.
- Team members, roles and permissions.
- AI agents and their configurations.
- Knowledge bases and documents.
- Channels and integrations.
- Customers and leads.
- Conversations and inbox.
- Workflows and automation.
- Usage and activity records.
- Subscription and entitlements.
- Billing and commercial records.
- Analytics and reports.
- Audit history.

Subscriptions and entitlements belong to the workspace, not the user's email address.

Strict tenant isolation is mandatory across database queries, APIs, UI, background jobs, integrations, AI tools, file storage and reporting.

## 6. Complete product roadmap — all agreed stages

The full agreed product vision should be documented and developed. Do not defer entire stages simply because they are called Stage 2 or Stage 3.

Stage 2 and Stage 3 capabilities must be architected and implemented now, but remain disabled by default until they are complete, tested, operationally ready and explicitly released by the Platform Owner.

### STAGE 1 — Core platform and business operations

#### A. Identity and authentication
- Registration and login.
- Secure sessions.
- Password recovery and account verification.
- Account profile and settings.
- Authentication protection and rate limiting.
- Appropriate privileged-user security.
- Session management and secure logout.
- Account lifecycle and recovery safeguards.

#### B. Workspace management
- Create multiple business workspaces.
- Workspace discovery and switching.
- Independent workspace configuration.
- Workspace ownership.
- Workspace membership.
- Workspace invitations.
- Invitation acceptance, rejection, expiry and revocation.
- Member roles and permission assignment.
- Member role changes and access revocation.
- Workspace ownership and administrative safeguards.

#### C. Team management
- Team directory.
- Invitations by email.
- Role assignment.
- Permission management.
- Member status.
- Access revocation.
- Activity and audit history.
- Prevention of privilege escalation.

#### D. Business configuration
- Business name and identity.
- Industry and business type.
- Description and operating information.
- Contact information.
- Languages and timezone.
- Business hours.
- Configurable operational preferences.

#### E. AI agent management
- Create and configure multiple agents.
- Select an agent's role and purpose.
- Instructions and system behavior.
- Tone, personality and communication style.
- Language settings.
- Knowledge assignment.
- Tool and permission assignment.
- Channel assignment.
- Escalation and human handoff.
- Agent testing.
- Draft and published states.
- Version history and safe updates.
- Enable, disable and archive agents.
- Usage visibility and operational status.

#### F. Knowledge management
- Upload and manage knowledge documents.
- Organize knowledge by workspace.
- Assign knowledge to agents.
- Document processing and indexing.
- Source tracking.
- Knowledge updates and removal.
- Processing status and failure handling.
- Secure access to private documents.

#### G. WhatsApp integration
- WhatsApp Cloud API integration.
- Business and phone-number configuration.
- Webhook verification.
- Incoming and outgoing messages.
- Delivery and message status.
- Secure credential management.
- Duplicate event protection.
- Retry and failure handling.
- Connection status and diagnostics.

#### H. Conversations and customer management
- Persistent conversation history.
- Customer records.
- Inbox and conversation list.
- Search, filters and status.
- Conversation assignment.
- Human handoff.
- Agent/human interaction history.
- Conversation ownership and permissions.
- Customer information and context.
- Safe conversation resolution and reopening.

#### I. Safe AI tools and workflows
- Approved tool registry.
- Tool permissions and authorization.
- Business-configurable workflows.
- Appointment and booking workflows where enabled.
- Lead qualification.
- Follow-up workflows.
- Customer support workflows.
- Human approval where necessary.
- Tool execution logging.
- Failure recovery.
- Idempotency and duplicate-action protection.

#### J. Platform administration
- Platform Owner administration.
- Platform Admin roles and permissions.
- Workspace and user oversight.
- Platform configuration.
- System status and operational monitoring.
- Audit logs.
- Secure privileged actions.
- Platform-wide feature management.
- Safe account suspension and recovery.

#### K. Notifications and communication
- In-app notifications.
- Email notifications.
- Notification preferences.
- Delivery status and retry.
- Event-based notifications.
- Secure email configuration.
- Administrative visibility into delivery failures.

#### L. UI and experience
- Professional, responsive dashboard.
- Clear workspace navigation.
- Consistent design system.
- Reusable components.
- Responsive desktop, tablet and mobile layouts.
- Loading, empty, error and success states.
- Accessible forms and navigation.
- Search, filtering, sorting and pagination where relevant.

### STAGE 2 — Commercial platform and advanced AI capabilities

#### A. Subscription management
- Workspace-based plans.
- Subscription lifecycle.
- Plan entitlements.
- Activation and renewal.
- Cancellation.
- Expiration.
- Grace periods.
- Payment failure and recovery.
- Subscription history.
- Administrative subscription controls.

#### B. Billing and payment architecture
- Provider-independent payment architecture.
- Payment records.
- Payment verification.
- Webhook processing.
- Idempotent payment events.
- Refund handling where authorized.
- Reconciliation and audit history.
- Secure payment status transitions.
- Manual administrative handling where necessary.

Do not select a real payment provider, activate paid services, set final prices or initiate charges without explicit Product Owner authorization.

#### C. Usage and commercial controls
- Workspace usage tracking.
- Agent usage.
- Message and channel usage.
- Model usage.
- Cost accounting.
- Plan limits.
- Usage allowances.
- Overages where approved.
- Usage alerts.
- Usage history and reporting.
- Administrative overrides with audit trails.

#### D. AI provider and model management
- Provider-independent AI architecture.
- Model adapter interfaces.
- Approved model registry.
- Model availability.
- Model selection and routing.
- Model-specific capabilities.
- Workspace model entitlements.
- Usage and cost tracking.
- Model fallback policies.
- Error handling and provider outages.
- Secure API key management.

Do not allow arbitrary model access or unrestricted customer-supplied code execution.

#### E. Advanced agent capabilities
- More sophisticated agent configurations.
- Agent collaboration.
- Advanced tool permissions.
- More complex workflows.
- Conditional behavior.
- Advanced escalation.
- Agent performance and usage insights.
- Testing and controlled publishing.

#### F. Commercial administration
- Plan configuration.
- Entitlement configuration.
- Subscription oversight.
- Workspace billing history.
- Payment and usage reporting.
- Manual commercial adjustments with auditability.
- Platform-wide commercial controls.

### STAGE 3 — Advanced AI workforce and enterprise platform

#### A. Multi-agent orchestration
- Multiple specialized agents collaborating.
- Task delegation.
- Agent-to-agent handoffs.
- Orchestration policies.
- Shared task context with strict permission controls.
- Coordination and failure recovery.
- Human supervision.

#### B. Advanced workflow automation
- Visual or structured workflow configuration.
- Conditional branches.
- Multi-step processes.
- Scheduled execution.
- Event-triggered execution.
- Retry and recovery.
- Approval steps.
- Workflow history and monitoring.

#### C. Additional channels and integrations
- Additional messaging channels.
- Channel-independent conversation architecture.
- Approved third-party integrations.
- Integration credentials and permissions.
- Webhook management.
- Integration health monitoring.
- Extensible integration architecture.

#### D. Advanced analytics
- Agent performance.
- Conversation analytics.
- Customer and lead analytics.
- Workflow performance.
- Team performance.
- Usage and cost analytics.
- Business-level reporting.
- Exportable reports where permitted.

#### E. Enterprise capabilities
- Advanced team and access controls.
- Enterprise workspace administration.
- Advanced auditability.
- Operational monitoring.
- Configurable retention policies.
- Secure data export.
- Enterprise integration capabilities.
- Advanced governance and security controls.

#### F. AI workforce management
- Agent health and operational status.
- Agent performance monitoring.
- Workload and task distribution.
- Orchestration monitoring.
- Operational alerts.
- Failure investigation.
- Controlled agent updates.
- Workforce-level reporting.

## 7. Centralized feature management — mandatory architecture

Build a central feature-control system that distinguishes three separate layers:

1. **Platform availability:** controlled by the Platform Owner.
2. **Workspace subscription entitlement:** determined by the workspace's plan.
3. **Workspace preference:** enabled or disabled by an authorized workspace owner.

All applicable conditions must be satisfied before a capability becomes usable.

Feature controls must be enforced server-side, not merely hidden in the interface.

This includes:
- Pages and UI.
- API routes.
- Server actions.
- Background jobs.
- AI agent tools.
- Integrations and webhooks.
- Usage tracking.
- Billing and subscription operations.

Security, tenant isolation, auditability and mandatory data-protection safeguards must never be optional features.

Stage 2 and Stage 3 functionality must default to disabled until explicitly released.

## 8. Design system and reusable components

Study OnPlas's reusable UI patterns and component architecture.

Build and maintain a consistent AgentFlow design system.

Consider reusable components for:
- Application shell.
- Sidebar and navigation.
- Workspace selector.
- Page headers and breadcrumbs.
- Cards and dashboard statistics.
- Tables and data lists.
- Search and filters.
- Forms and field validation.
- Confirmation dialogs.
- Drawers and detail panels.
- Tabs and segmented navigation.
- Status indicators.
- Badges.
- Dropdown menus.
- Notification panels.
- Empty states.
- Loading states.
- Error states.
- Pagination.
- File upload interfaces.
- User and team selectors.
- Permission editors.
- Agent configuration panels.
- Conversation interfaces.
- Analytics visualizations.

Do not create unnecessary components for their own sake. Use existing project conventions and consolidate genuinely repeated patterns.

The objective is a cohesive, reusable, maintainable interface—not a collection of unrelated screens.

## 9. Technical and architectural principles

Preserve the existing AgentFlow technical foundation unless a concrete problem requires a change.

Current architecture:
- One Next.js App Router application.
- Web interface and backend/API routes in the same application.
- TypeScript.
- Tailwind CSS.
- PostgreSQL 18.x.
- Drizzle ORM.
- postgres-js.
- Zod.
- Better Auth.
- PostgreSQL Row-Level Security.

There is no separate backend application.

Mandatory principles:
- Strict multi-tenant isolation.
- Server-side authorization.
- Secure database access.
- Validated inputs.
- Secure credential handling.
- Auditability.
- Idempotent operations.
- Reliable background processing.
- Error handling and recovery.
- Database integrity.
- Migration safety.
- Responsive UI.
- Automated tests.
- Documentation updated alongside implementation.

Avoid:
- Unnecessary microservices.
- Duplicate systems.
- Unnecessary dependencies.
- Unnecessary abstractions.
- Rewriting working foundations.
- Placeholder functionality presented as complete.
- Client-only security checks.
- Hard-coded business-specific behavior.

## 10. Permanent documentation to create in AgentFlow

Create a clear, structured documentation system inside the AgentFlow repository.

At minimum, create or update:

### `docs/AGENTFLOW_MASTER_PRODUCT_BLUEPRINT.md`

The canonical long-term product specification.

Include:
- Product vision.
- Target users and business types.
- Multi-tenant model.
- Workspace architecture.
- Complete Stage 1, Stage 2 and Stage 3 feature inventory.
- Platform administration.
- Feature-control architecture.
- AI workforce capabilities.
- Integrations and channels.
- Commercial architecture.
- Security and compliance requirements.
- UI and design-system principles.
- Architecture principles.
- OnPlas reference-research findings.
- Explicitly excluded or non-applicable functionality.

### `docs/AGENTFLOW_MASTER_ROADMAP.md`

A practical, dependency-aware implementation roadmap.

For each feature or module, specify:
- Feature name.
- Stage.
- Functional scope.
- Dependencies.
- Current implementation status.
- Missing work.
- Acceptance criteria.
- Security and tenant-isolation requirements.
- Required testing.
- External setup or Product Owner decisions, if applicable.

Organize development into logical milestones, not an arbitrary feature checklist.

### `docs/AGENTFLOW_CURRENT_PROJECT_STATUS.md`

An accurate, continuously maintained snapshot of the real repository.

Record:
- Completed features.
- Partially completed features.
- Missing features.
- Existing architecture.
- Migrations and database status.
- Test results.
- Browser verification.
- Security verification.
- External integrations and setup.
- Known defects and blockers.
- Current highest-priority task.
- Last verified milestone.

Never mark something complete simply because code has been written.

### `docs/AGENTFLOW_ARCHITECTURE_AND_SECURITY.md`

Document:
- Application architecture.
- Workspace and membership model.
- Tenant isolation.
- Authentication and authorization.
- Permission boundaries.
- Feature-control enforcement.
- AI execution boundaries.
- Integration security.
- Data storage.
- Auditability.
- Background processing.
- Billing and usage security.
- Recovery and operational safeguards.

### `docs/AGENTFLOW_ONPLAS_REFERENCE_CATALOG.md`

Document the OnPlas inspection findings.

For each useful feature or component, include:
- OnPlas location or module.
- What it does.
- Applicable/adaptable/reference-only/not-applicable classification.
- Proposed AgentFlow equivalent.
- Whether AgentFlow already implements it.
- Remaining implementation work.

Do not put OnPlas secrets, private user information or sensitive configuration in these documents.

### `docs/CODEX_STARTUP_INSTRUCTIONS.md`

Create permanent instructions for future Codex sessions.

Codex must:
1. Read root `AGENTS.md`.
2. Read `docs/AGENTFLOW_HANDBOOK.md`.
3. Read the Master Product Blueprint.
4. Read the Master Roadmap.
5. Read Current Project Status.
6. Read Architecture and Security.
7. Review the latest Git status and existing changes.
8. Identify the current highest-priority unfinished milestone.
9. Continue implementation without repeatedly asking the Product Owner to restate known decisions.

Codex must also know that OnPlas is read-only and AgentFlow is the only writable repository.

### `docs/AGENTFLOW_DOCUMENTATION_UPDATE_PROTOCOL.md`

Require these documents to be updated whenever meaningful work changes:
- Product scope.
- Architecture.
- Security requirements.
- Feature status.
- Roadmap dependencies.
- Acceptance criteria.
- External setup requirements.

Every significant milestone must update the current status document and roadmap.

Do not allow the documentation to become a stale description of the original plan.

### Root `AGENTS.md`

Review the existing instructions and update them only where necessary.

Make them point to the permanent documentation and require Codex to read the relevant documents before starting work.

Preserve all existing valid instructions. Do not replace a useful `AGENTS.md` with a shorter generic one.

## 11. Next implementation milestone — workspace invitations and role management

After completing the documentation and reference audit, proceed directly to the next highest-priority development milestone.

The current verified milestone is:

**Multi-business workspace creation, discovery and switching.**

The following has already been reported as implemented and locally verified:
- A single account can create multiple business workspaces.
- Workspace directory and switching.
- Server-side membership checks.
- Workspace-specific dashboard URLs.
- Transactional, retry-safe workspace creation.
- Preservation of the original home workspace.
- Migration `0003_workspace_membership_discovery.sql`.
- Database, migration, authentication and workspace tests.
- TypeScript, ESLint and production build.
- Chromium acceptance at 1440×900 and 390×844.

Preserve this work and verify the actual current repository before relying on the report.

### Implement the following next:

**A. Invitations**
- Invite teammates by email.
- Select an authorized workspace role.
- Secure invitation token generation and storage.
- Invitation expiry.
- Invitation acceptance.
- Invitation rejection.
- Resend invitations where appropriate.
- Duplicate invitation handling.
- Revoked invitation handling.
- Expired invitation handling.
- Safe handling of an invitation when the recipient already has an account.
- Safe handling when the recipient is not yet registered.

**B. Membership and roles**
- Workspace member directory.
- Display member roles and membership status.
- Change a member's role.
- Revoke workspace access.
- Handle member departure where appropriate.
- Protect workspace ownership.
- Ensure role changes and revocations take effect immediately.

**C. Permissions**
- Define and enforce workspace permissions.
- Prevent privilege escalation.
- Users cannot grant permissions beyond their own authority.
- Workspace owners retain appropriate ownership controls.
- Administrative roles must have explicit, limited permissions.
- A workspace member must never access another workspace merely by changing a URL or request parameter.

**D. Security and audit**
- Secure invitation token lifecycle.
- Avoid leaking tokens.
- Rate-limit sensitive invitation operations.
- Validate all input.
- Protect against duplicate and replayed actions.
- Audit invitations, acceptance, rejection, role changes and revocations.
- Verify access is denied immediately after revocation.
- Ensure the previous workspace membership cannot be reused through stale sessions or cached permissions.

**E. User interface**
- Team and members page.
- Invite member interface.
- Role selection.
- Invitation status.
- Pending invitations.
- Member role management.
- Revoke access confirmation.
- Clear success, loading, error and empty states.
- Responsive behavior.

Build this end-to-end using the existing AgentFlow architecture.

Do not create an incomplete UI with placeholder API behavior.

## 12. Testing and acceptance requirements

For the documentation task:
- Verify every documented feature against the actual codebase.
- Clearly distinguish existing functionality from proposed functionality.
- Ensure all three stages are represented.
- Ensure OnPlas research is documented.
- Ensure startup instructions are actionable.
- Ensure roadmap dependencies are sensible.

For the invitation milestone:
- Unit and integration tests.
- Database and migration tests.
- Concurrent invitation and acceptance tests.
- Duplicate invitation tests.
- Expired and revoked invitation tests.
- Unauthorized role assignment tests.
- Cross-tenant isolation tests.
- Immediate permission-revocation tests.
- Audit-log verification.
- TypeScript.
- ESLint.
- Production build.
- Browser acceptance at desktop and mobile viewport sizes.

Do not claim physical mobile-device acceptance unless actually performed.

Do not run production migrations, deploy, activate paid services or send real customer communications without the required authorization and setup.

## 13. Execution order

Follow this order:

1. Read existing project instructions and documentation.
2. Inspect AgentFlow's actual state and preserve existing changes.
3. Inspect OnPlas read-only and prepare the reference catalog.
4. Create the permanent AgentFlow blueprint, roadmap, status, architecture/security, reference catalog, startup instructions and update protocol.
5. Update root `AGENTS.md` carefully.
6. Reconcile the roadmap with the actual implementation.
7. Implement workspace invitations and role management.
8. Run the complete relevant test and verification suite.
9. Update the roadmap and current project status with the actual results.
10. Report the next highest-priority milestone.

Do not stop after producing a plan. Complete the documentation and proceed with the implementation milestone unless a genuine external dependency or Product Owner decision prevents it.

If a decision is genuinely needed, explain the exact decision, why it matters and your recommendation. Continue all independent work rather than waiting unnecessarily.

## 14. Future-session continuity — mandatory

This project must not depend on the memory of a particular ChatGPT account or a previous conversation.

The repository documentation is the durable source of truth.

At the beginning of every future implementation session:
- Read the startup instructions.
- Read the current project status.
- Read the roadmap.
- Check the actual Git state.
- Identify the next unfinished milestone.

At the end of every significant implementation session:
- Update the current project status.
- Update roadmap progress.
- Record new architectural and business decisions.
- Record tests and their exact results.
- Record anything requiring manual Product Owner setup.
- Identify the next highest-priority task.

Do not silently change agreed business decisions. Record proposed changes and seek the Product Owner's decision when necessary.

## 15. Final report

When finished, provide:

1. Repository verification and confirmation that OnPlas remained untouched.
2. Documentation files created or updated.
3. Summary of OnPlas capabilities/components worth adapting.
4. Complete roadmap overview and actual implementation status.
5. Workspace invitation and role-management functionality implemented.
6. Database migrations created and applied locally.
7. Exact test results, including failures and skipped tests.
8. Security and tenant-isolation verification.
9. Browser and responsive verification.
10. External setup or manual actions still required.
11. Remaining limitations.
12. The single highest-priority next milestone.

Use accurate status labels:
- Planned.
- Implemented.
- Locally tested.
- Browser verified.
- Externally configured.
- Production verified.

Never confuse these statuses.

**The ultimate objective is to build the complete agreed AgentFlow platform, maintain its full product vision permanently in the repository, learn from OnPlas without modifying it, and ensure that every future Codex session can continue from the actual project state without losing context.**
## 16. Business Connect and the two AI experiences

A business connects an authorized source once. The workspace owner assigns selected records and operations to named employees. Business Connect covers four families: reviewed website content, structured business data, supported vendor integrations and custom authorized APIs. The business owns the connection; creating an assistant grants no implicit source access.

Customer AI serves an identified channel and its published employee version. Business Copilot serves a signed-in employee in the private dashboard. Both reuse workspace connections, models, knowledge, execution services and metering. Customer AI can search approved products or help a verified customer with their own order. Copilot can summarize authorized orders and inventory or draft a reply. Each internal role sees only the records and operations it could use directly. Platform administration has a separate authority boundary.

Support guided website discovery, selected pages and exclusions, reviewed imports, mapping, sync schedules and health. Catalogue, product specifications, price, stock, services, customers, orders, suppliers, bookings, locations and policies have distinct record types and freshness needs. Prefer a verified live read for volatile values. A business owner should be able to trace a claim to its source and understand when a value could last be verified.

Release progressively under the existing three-stage strategy. Scope grants, provenance, access checks and revocation are prerequisites. Source count, crawl volume, storage, sync cadence, API use and advanced actions are candidate workspace entitlements. Prices, external procurement and payment activation remain owner decisions. See the request flow and release tests in AGENTFLOW_ARCHITECTURE_AND_SECURITY.md and the sequence in AGENTFLOW_MASTER_ROADMAP.md.
