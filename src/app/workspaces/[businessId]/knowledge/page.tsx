import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TenantAccessDenied } from "@/db";
import { asAssistantManager } from "../assistant/store";
import { saveFact } from "./actions";
import { latestFacts } from "./library";

const notices = new Map([
  ["saved", "Fact saved."],
  ["retired", "Fact retired."],
  ["restored", "Fact restored as a new revision."],
  ["changed", "This fact changed. Review the latest revision before editing."],
  ["invalid", "Enter a name and information for the fact."],
]);

type Props = PageProps<"/workspaces/[businessId]/knowledge">;
function Fields({ title = "", body = "" }) {
  return <>
    <label>Fact name<input name="title" required maxLength={2000} defaultValue={title} /></label>
    <label>Business information<textarea name="body" required rows={3} maxLength={6000} defaultValue={body} /></label>
  </>;
}
async function Library({ params, searchParams }: Props) {
  const { businessId } = await params;
  const { notice } = await searchParams;
  const message = typeof notice === "string" && notices.get(notice);
  const { facts, releases } = await asAssistantManager(businessId, async ({ tx }) => {
    const facts = await latestFacts(tx, businessId);
    const releases = await tx.execute<{ id: string; name: string; version: number; key: string; revision: string }>(sql`
      select a.id,a.name,c.version,source->'shared'->>'key' as key,source->'shared'->>'revision' as revision
      from agents a join agent_configurations c on c.agent_id=a.id and c.business_id=a.business_id and c.version=a.published_version
      cross join lateral jsonb_array_elements(c.settings->'knowledge') as source
      where a.business_id=${businessId} and a.active and source ? 'shared' order by a.name,a.id`);
    return { facts, releases };
  }).catch(error => {
    if (error instanceof TenantAccessDenied) notFound();
    throw error;
  });
  return <main className="assistant-studio">
    <Link href={`/dashboard?businessId=${businessId}`}>Workspace overview</Link>
    <h1>Shared knowledge</h1>
    <p>Save business facts here, then choose which assistants can use them.</p>
    <Link href={`/workspaces/${businessId}/assistant`}>AI assistants</Link>
    {message && <p role="status">{message}</p>}
    <section><h2>Add a fact</h2><form action={saveFact.bind(null, businessId, randomUUID(), 0)}>
      <Fields /><button>Add fact</button></form></section>
    {facts.map(fact => {
      const retired = fact.revision <= fact.cutoff;
      const activeReleases = releases.filter(release => release.key === fact.key);
      return <section key={fact.id} aria-label={fact.title}>
        <h2>{fact.title}</h2><p>Revision {fact.revision}{retired ? " · Retired" : ""}</p><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{fact.body}</p>
        {activeReleases.length > 0 && <>
          <h3>Enabled assistants using this fact</h3>
          <ul>{activeReleases.map(release => <li key={release.id}>
            <Link href={`/workspaces/${businessId}/assistant?agent=${release.id}&version=${release.version}`}>
              {release.name} · published v{release.version} · fact revision {release.revision}
            </Link>
          </li>)}</ul>
        </>}
        <details><summary>{retired ? "Review and restore" : "Edit fact"}</summary><form action={saveFact.bind(null, businessId, fact.key, fact.revision)}>
          <Fields title={fact.title} body={fact.body} /><button name="action" value={retired ? "restore" : "save"}>{retired ? "Restore as new revision" : "Save revision"}</button>
        </form></details>
        {!retired && <details><summary>Retire fact</summary>
          <p>Published assistants keep answering with their saved information. To stop those answers immediately, disable each affected assistant. To publish again, remove or replace this fact and test the draft.</p>
          <form action={saveFact.bind(null, businessId, fact.key, fact.revision)}><button name="action" value="retire">Confirm retirement</button></form>
        </details>}
      </section>;
    })}
  </main>;
}
export default function Page(props: Props) {
  return <Suspense fallback={<p>Loading shared knowledge…</p>}><Library {...props} /></Suspense>;
}
