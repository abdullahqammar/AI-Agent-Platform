# Workspace interface conventions

Use the bundled Geist family and the existing white surfaces, slate text, blue actions, restrained borders and spacing in globals.css. Reuse Brand, EntryShell, OnboardingForm and Logout where their behaviour applies. Dashboard and assistant studio have different navigation today. Before extracting a shared shell, compare the dashboard, studio, team and inbox with a real owner and a restricted member.

| Element | Contract and application |
|---|---|
| Workspace context | Persistent business name and a labelled switcher. Show the current role. Re-resolve membership on navigation and mutation. Platform controls belong to a distinct admin shell. |
| Primary navigation | Links lead to usable destinations. Mark the active page with aria-current. A viewer sees only allowed operations. An unconfigured integration belongs in a meaningful setup flow when available. |
| Directory | Use a labelled section with one primary creation link. Provide name and textual state in each row; the whole row opens the selected employee. Sort predictably. Support wrapping long names, keyboard navigation and visible focus. For large workforces introduce scoped pagination and filtering before adding heavy tables. |
| Setup form | Group role and responsibilities, knowledge, behaviour, tools and model. Use plain language, labels beside inputs, short examples and optional advanced disclosures. Preserve selections when applying a template. Save a new version explicitly. |
| Chat and work queue | Keep agent/version, speaker, test/live state, assignment and handoff visible. Use persisted messages and clear pending feedback. Returning from configuration should preserve the conversation. Never imply a customer received an in-app staff reply via an external channel. |
| Primary and secondary actions | One primary action per task area. Use links for navigation, buttons for mutations. Explain prerequisites for disabled publishing. Prevent repeated submissions while pending and enforce idempotency server-side for repeatable operations. |
| States and messages | Draft, enabled and disabled describe lifecycle. Connection verified, test successful and customer delivery are separate facts. Pair color with text. Recoverable failures should name the failed operation, whether the message was saved, and a next action. |
| Measurements | Show measured totals, period and unit; label test traffic. Display an empty state before data arrives. Use a chart only to answer a specific operational question. |
| Responsive layout | One column for narrow screens, wrapping controls and no horizontal page overflow. Keep row labels readable at 390px; allow text enlargement and keyboard-only use. Test again at 1440px with long business, role and assistant names. |
| Assets and identity | Platform-owned logo and title should eventually read from one validated settings projection. Preserve a default asset and version replacements for cache invalidation. Keep uploaded workspace knowledge distinct from platform branding. |

## Component evolution

Extract a WorkspaceShell when the second destination adopts the same workspace navigation and role context. Consolidate status labels when directory and editor share a precise lifecycle contract, including the case of a newer draft beside an enabled release. Extract a shared credential form only after secret storage, revocation and verification APIs exist. Keep these as implementation triggers rather than adding unused components today.

## Source review from OnPlas

Read-only inspection at d214eeaf included apps/web/src/app/admin/site-identity/page.tsx and apps/web/src/app/api/admin/site-identity/route.ts. The page separately loads settings after its full-admin guard; the API independently checks authorization, validates patch fields, passes actor identity to the settings write and returns a public projection that omits internal storage keys. Separate text and image forms allow independent updates. Apply these boundaries to AgentFlow’s future Site Identity. No OnPlas code, branding or assets are needed.
