# Business owner experience

23 November 2026. The comparison uses the evidence and screenshot links in [the competitor study](AGENTFLOW_COMPETITOR_RESEARCH.md). Recommendations below are design decisions for AgentFlow. Competitor responsive behaviour remains unmeasured.

## Priorities for the owner journey

| Moment | Friction observed in AgentFlow | Design and acceptance |
|---|---|---|
| First visit | Selecting a business works, but a dashboard full of unavailable entries distracts from the first task. | Keep business name, workspace switcher and role visible. With zero assistants, offer Create assistant. After creation, replace setup advice with actual employees and states. Implemented here. |
| Business setup | Onboarding captures location and timezone. Similar business facts must be entered in each agent configuration. | Keep first login short. Add a reusable business profile later with editable hours, policies, contacts, languages and sources. Preview what an assistant can use. Changing shared facts must have defined version semantics. |
| Choose a role | The general and dental templates prove reuse, but most fields still assume familiarity with agent configuration. | Ask what job needs doing. Demonstrate reception, sales and support as editable starting points. Keep custom roles available. Ask for one known question and one escalation example. Save a draft before showing channel controls. |
| Supply knowledge | A pasted fact can answer a question, but owners cannot inspect the passages selected for the turn. | Show a test-only “Sources used” list drawn from actual authorized retrieval results. For uploads, surface processing, usable and failed states; permit publication only against usable knowledge. |
| Test and correct | Provider errors were hard to distinguish from bad instructions. | Show selected version/model and actionable failure text, with the chat near the editor. On mobile preserve the active thread and return focus to the composer. A failed answer must not unlock publication. |
| Publish and connect | “Enabled” can be mistaken for customer availability. | Keep an in-app published version independent of channel verification. Show a channel as live only after a verified provider exchange. Restoring history creates a draft to retest. |
| Run the workforce | Owners need to find an existing assistant without opening a new configuration form. | Use a directory scoped to one workspace; make the whole employee row actionable. Later add role/status filters when warranted by workforce size. |
| Handle exceptions | A queue can be claimed, but follow-up ends at assignment. | Put customer, assistant version, transcript, assignee and paused AI status together. Next add an attributed staff reply and explicitly authorized resolution. Keep private notes separate from customer-visible messages. |
| Manage spend | A model token count cannot tell an owner their invoice. | Separate measured tokens, estimated provider cost, actual subscription charges and entitlements. Show period, tenant and unit. Missing cost data should remain unknown. |

## Information architecture

**Available workspace navigation:** Overview, AI assistants, Staff handoffs and Team, filtered by membership and role. Workspace switching belongs above navigation. The overview prioritizes current employees and opening a draft. Location and timezone remain available beneath the workforce. No activity count or notification badge should appear without a real event source.

**Proposed destinations:** Knowledge and Business profile when shared facts can be managed; Inbox when staff can reply and resolve; Channels when verification and disconnection work. Put workspace-level provider credentials and usage under Settings with role-sensitive controls. Keep platform administration in a separate authority boundary. An owner of three businesses selects one business before viewing costs, staff, conversations or source documents.

**Inside an employee:** overview and current state, configuration, assigned knowledge/tools, playground, versions, and verified channels. Keep test and publish distinct. The saved conversation must make its version explicit even when a newer draft exists. Use links for navigable versions and native disclosures for advanced settings. A future side-by-side editor/test pane needs an explicit policy for unsaved changes and mobile navigation before a substantial redesign.

**Workflow builder:** first support a bounded trigger, condition and approved action with an inspectable execution record. Show the triggering event, step result, failed step, next retry and responsible person. Only add a visual canvas when the execution semantics and replay safeguards are demonstrable. Scenarios include a hotel's booking inquiry and an online shop's return request; neither implies permission to confirm an external action.

**Search, notifications and reporting:** use role-scoped filters on the inbox and workforce when users have enough items to search. Prefer a real pending handoff over a generic notification feed. Give analytics a date range, denominator, drill-down and explicit missing-data states. Begin with testable outcomes such as staff handoffs resolved, separate from volume and model usage.

**Evaluation:** observe a first-time owner creating an assistant, getting a grounded answer, correcting a source, testing escalation, publishing and finding it again. Record where they hesitate, what they expect “published” to mean, and whether they can distinguish a local provider outage from missing knowledge. Desktop/mobile automation verifies interaction and isolation. It does not establish usability for real owners.
