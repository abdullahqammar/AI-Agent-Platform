# Read-only reference catalog

The OnPlas engineering handbook contains reference material on settings audit-log consistency (chapter 95), moderation audit browsing (chapter 62) and responsive web auditing. These are candidates for future platform administration reviews. Their presence was verified by filename. Their implementations and applicability to AgentFlow require review when the corresponding milestones begin. No OnPlas runtime dependency is required.

Read-only source inspection at d214eeaf verified independent full-admin checks at the Site Identity page and settings API, validation at the patch boundary and public projection of identity metadata. The exact paths and proposed AgentFlow application are recorded in [design conventions](AGENTFLOW_DESIGN_SYSTEM.md).

On 24 November 2026, the managed checkout was at d214eeaf and the remote default branch at 35b2afa7. Read-only inspection of the latter confirmed that Site Identity API reads and writes still perform the full-admin guard and project public settings. Apply that independent server-side authorization pattern to staff actions using AgentFlow’s own tenant roles.
