# Reference Repositories

## Repository roles

### Primary implementation repository

`abdullahqammar/AI-Agent-Platform`

This is the AgentFlow source of truth. Codex may modify this repository within the project's working and approval rules.

### Architectural reference repository

`abdullahqammar/Onplas`

This is a separate product and must be treated as read-only reference material. Do not modify it, commit to it, push to it, open pull requests against it, or change its settings.

Repository inclusion in a Codex environment is not itself a technical read-only guarantee. The GitHub integration/repository permissions must enforce the intended access boundary wherever possible. If separate per-repository permissions are unavailable, do not use a credential that grants write access to OnPlas; use a read-only clone, read-only credential, or another owner-approved read-only access method.

## What may be studied

Inspect OnPlas only when it can help solve a concrete AgentFlow engineering or product-design problem. Potentially reusable reference areas include:
- UI components, layouts, responsive patterns, and design-system conventions.
- Authentication and authorization patterns.
- Admin dashboard organization and interaction patterns.
- Database schema conventions, migrations, constraints, and testing.
- Tenant isolation and security controls.
- File upload/storage patterns.
- Audit trails, moderation, and operational workflows.
- Documentation and engineering handover practices.

## How to adapt a reference

For each candidate pattern:
1. Identify the exact problem AgentFlow needs to solve.
2. Locate the relevant OnPlas implementation and understand its dependencies and assumptions.
3. Check whether the pattern is generic or tied to OnPlas's marketplace domain.
4. Compare it with AgentFlow's existing stack, schema, security model, and product requirements.
5. Prefer a clean AgentFlow-native implementation over importing a large or tightly coupled subsystem.
6. Preserve applicable license notices and comply with the repository's license and dependency terms.
7. Explain the proposed adaptation and meaningful trade-offs in the AgentFlow task report.

Do not copy code simply because it exists. Do not add a dependency on the OnPlas repository or make AgentFlow require OnPlas at runtime.

## Explicit prohibitions

- Never edit files in OnPlas.
- Never commit, push, merge, tag, or create branches in OnPlas.
- Never run scripts or commands against OnPlas that mutate its working tree, Git history, issues, settings, or deployment.
- Never expose OnPlas secrets, customer data, production database contents, or private operational information in AgentFlow.
- Do not transplant marketplace-specific business rules, supplier workflows, payment/commission logic, or other OnPlas-specific features into AgentFlow unless the AgentFlow owner explicitly approves a relevant requirement.

## Reference review output

When asked to perform a reference review, produce a concise table with:
- AgentFlow need.
- OnPlas pattern/file(s) worth examining.
- Whether the pattern is generic or domain-specific.
- Recommendation: reuse concept, adapt, or do not use.
- Dependencies/security implications.
- Whether owner approval is needed.

Do not modify AgentFlow merely because a reference review identifies an idea. Implement only work that belongs to an approved AgentFlow milestone.
