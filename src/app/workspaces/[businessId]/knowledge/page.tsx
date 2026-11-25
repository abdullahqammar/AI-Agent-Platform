import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TenantAccessDenied } from "@/db";
import { asAssistantManager } from "../assistant/store";
import { saveFact } from "./actions";
import { latestFacts } from "./library";

import { Catalogues, catalogueView } from "./catalogues";

const notices = new Map([
  ["invalidCatalogue", "Check the product rows and catalogue name. Each row needs a unique SKU, name and description separated by tabs."],
  ["catalogueSaved", "Catalogue imported with access disabled for all assistants."],
  ["catalogueUpdated", "Catalogue access updated."],
  ["saved", "Changes saved."],
  ["faqSaved", "FAQ added."],
  ["retired", "Source retired."],
  ["restored", "Source restored as a new revision."],
  ["changed", "This source changed. Review the latest revision before editing."],
  ["invalid", "Complete both fields before saving."],
]);

type Props = PageProps<"/workspaces/[businessId]/knowledge">;
function Fields({ title = "", body = "", faq = false }) {
  return <>
    <label>{faq ? "Customer question" : "Fact name"}<input name="title" required maxLength={2000} defaultValue={title} /></label>
    <label>{faq ? "Approved answer" : "Business information"}<textarea name="body" required rows={3} maxLength={6000} defaultValue={body} /></label>
  </>;
}
async function Library({ params, searchParams }: Props) {
  const { businessId } = await params;
  const { notice } = await searchParams;
  const message = typeof notice === "string" && notices.get(notice);
  const { facts, releases, drafts, catalogues } = await asAssistantManager(businessId, async (context) => {
    const { tx } = context;
    const facts = await latestFacts(tx, businessId);
    const releases = await tx.execute<{ id: string; name: string; version: number; key: string; revision: string }>(sql`
      select a.id,a.name,c.version,source->'shared'->>'key' as key,source->'shared'->>'revision' as revision
      from agents a join agent_configurations c on c.agent_id=a.id and c.business_id=a.business_id and c.version=a.published_version
      cross join lateral jsonb_array_elements(c.settings->'knowledge') as source
      where a.business_id=${businessId} and a.active and source ? 'shared' order by a.name,a.id`);
    const drafts = await tx.execute<{ id: string; name: string; version: number; key: string; revision: number }>(sql`
      select a.id, coalesce(c.settings->>'name',a.name) as name, c.version, d.library_key as key, d.revision
      from agent_knowledge k
      join knowledge_documents d on d.business_id=k.business_id and d.id=k.document_id
      join agents a on a.business_id=k.business_id and a.id=k.agent_id
      join lateral (
        select version,settings from agent_configurations
        where business_id=a.business_id and agent_id=a.id order by version desc limit 1
      ) c on true
      where k.business_id=${businessId} and d.library_key is not null
        and (not a.active or c.version is distinct from a.published_version)
      order by name,a.id`);
    return { facts, releases, drafts, catalogues: await catalogueView(context, businessId) };
  }).catch(error => {
    if (error instanceof TenantAccessDenied) notFound();
    throw error;
  });
  return <main className="assistant-studio">
    <Link href={`/dashboard?businessId=${businessId}`}>Workspace overview</Link>
    <h1>Business Connect</h1>
    {message && <p role="status">{message}</p>}
    <Catalogues business={businessId} data={catalogues}/>
    <h2>Shared knowledge</h2>
    <p>Write business facts and answers to common questions, then assign them to your assistants.</p>
    <Link href={`/workspaces/${businessId}/assistant`}>AI assistants</Link>
    <section><h2>Add a fact</h2><form action={saveFact.bind(null, businessId, randomUUID(), 0)}>
      <Fields /><button>Add fact</button></form></section>
    <details><summary>Add an FAQ</summary>
      <form action={saveFact.bind(null, businessId, randomUUID(), 0)}>
        <Fields faq /><button name="action" value="createFaq">Save FAQ</button>
      </form>
    </details>
    {facts.map(fact => {
      const retired = fact.revision <= fact.cutoff;
      const assignedDrafts = drafts.filter(draft => draft.key === fact.key);
      const activeReleases = releases.filter(release => release.key === fact.key);
      return <section key={fact.id} aria-label={fact.title}>
        <h2>{fact.title}</h2>{fact.is_faq && <p>FAQ</p>}<p>Revision {fact.revision}{retired ? " · Retired" : ""}</p><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{fact.body}</p>
        {activeReleases.length > 0 && <>
          <h3>Enabled assistants using this source</h3>
          <ul>{activeReleases.map(release => <li key={release.id}>
            <Link href={`/workspaces/${businessId}/assistant?agent=${release.id}&version=${release.version}`}>
              {release.name} · published v{release.version} · revision {release.revision}
            </Link>
          </li>)}</ul>
        </>}
        {assignedDrafts.length > 0 && <>
          <h3>Assigned in other current versions</h3>
          <ul>{assignedDrafts.map(draft => <li key={draft.id}>
            <Link href={`/workspaces/${businessId}/assistant?agent=${draft.id}&version=${draft.version}`}>
              {draft.name} · v{draft.version} · revision {draft.revision}
            </Link>
          </li>)}</ul>
        </>}
        {!activeReleases.length && !assignedDrafts.length && <p>No enabled release or latest draft uses this source.</p>}
        <details><summary>{retired ? "Review and restore" : fact.is_faq ? "Edit FAQ" : "Edit fact"}</summary><form action={saveFact.bind(null, businessId, fact.key, fact.revision)}>
          <Fields faq={fact.is_faq} title={fact.title} body={fact.body} /><button name="action" value={retired ? "restore" : "save"}>{retired ? "Restore as new revision" : "Save revision"}</button>
        </form></details>
        {!retired && <details><summary>{fact.is_faq ? "Retire FAQ" : "Retire fact"}</summary>
          <p>Published assistants keep answering with their saved information. To stop those answers immediately, disable each affected assistant. To publish again, remove or replace this source and test the draft.</p>
          <form action={saveFact.bind(null, businessId, fact.key, fact.revision)}><button name="action" value="retire">Confirm retirement</button></form>
        </details>}
      </section>;
    })}
  </main>;
}
export default function Page(props: Props) {
  return <Suspense fallback={<p>Loading shared knowledge…</p>}><Library {...props} /></Suspense>;
}
