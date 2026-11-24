import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TenantAccessDenied } from "@/db";
import { asAssistantManager } from "../assistant/store";
import { saveFact } from "./actions";
import { latestFacts } from "./library";

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
  const facts = await asAssistantManager(businessId, ({ tx }) => latestFacts(tx, businessId)).catch(error => {
    if (error instanceof TenantAccessDenied) notFound();
    throw error;
  });
  return <main className="assistant-studio">
    <Link href={`/dashboard?businessId=${businessId}`}>Workspace overview</Link>
    <h1>Shared knowledge</h1>
    <p>Save business facts here, then choose which assistants can use them.</p>
    <Link href={`/workspaces/${businessId}/assistant`}>AI assistants</Link>
    {notice && <p role="status">{notice === "saved" ? "Fact saved." : notice === "changed" ? "This fact changed. Review the latest revision before editing." : "Enter a name and information for the fact."}</p>}
    <section><h2>Add a fact</h2><form action={saveFact.bind(null, businessId, randomUUID(), 0)}>
      <Fields /><button>Add fact</button></form></section>
    {facts.map(fact => <section key={fact.id} aria-label={fact.title}>
      <h2>{fact.title}</h2><p>Revision {fact.revision}</p><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{fact.body}</p>
      <details><summary>Edit fact</summary><form action={saveFact.bind(null, businessId, fact.key, fact.revision)}>
        <Fields title={fact.title} body={fact.body} /><button>Save revision</button>
      </form></details>
    </section>)}
  </main>;
}
export default function Page(props: Props) {
  return <Suspense fallback={<p>Loading shared knowledge…</p>}><Library {...props} /></Suspense>;
}
