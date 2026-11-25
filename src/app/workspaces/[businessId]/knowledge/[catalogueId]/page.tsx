import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { TenantAccessDenied } from "@/db";
import type { Product } from "@/lib/assistant/catalogue";
import { withWorkspaceRoles } from "../../assistant/store";
import { refreshCatalogue } from "../catalogue-actions";
import { ProductRows } from "../product-rows";

type Props = PageProps<"/workspaces/[businessId]/knowledge/[catalogueId]">;
async function Review({ params, searchParams }: Props) {
  const { businessId, catalogueId } = await params;
  if (!z.uuid().safeParse(catalogueId).success) notFound();
  const { notice, snapshot } = await searchParams;
  if (snapshot !== undefined && !z.uuid().safeParse(snapshot).success) notFound();
  const data = await withWorkspaceRoles(businessId, ["Owner"], async ({ tx }) => {
    const [source] = await tx.execute<{ title: string; revision: number; catalogue_items: Product[]; disconnected: boolean }>(sql`
      select title,revision,catalogue_items,disconnected_at is not null as disconnected from knowledge_documents
      where business_id=${businessId} and id=${catalogueId} and source_ref='catalogue-import'`);
    if (!source) return null;
    const history = await tx.execute<{id:string; date:string; added:number; changed:number; removed:number}>(sql`
      select id,to_char(created_at at time zone 'UTC','YYYY-MM-DD HH24:MI') as date,added,changed,removed from catalogue_refreshes
      where business_id=${businessId} and document_id=${catalogueId} order by created_at desc,id desc limit 25`);
    const [archived] = typeof snapshot === "string" ? await tx.execute<{ previous_items: Product[]; imported: string }>(sql`
      select previous_items,to_char(previous_import at time zone 'UTC','YYYY-MM-DD HH24:MI') as imported
      from catalogue_refreshes where business_id=${businessId} and document_id=${catalogueId} and id=${snapshot}`) : [];
    if (snapshot && !archived) return null;
    return { source, history, archived };
  }).catch(error => { if (error instanceof TenantAccessDenied) notFound(); throw error; });
  if (!data) notFound();
  const { source, history, archived } = data;
  const path = `/workspaces/${businessId}/knowledge/${catalogueId}`;
  const notices = new Map([["updated","Catalogue refreshed."], ["stale","Catalogue access or contents changed. Review the current catalogue before applying another refresh."],
    ["invalid","Review a valid replacement before applying it."], ["same","The catalogue already contains these products."]]);
  return <main className="assistant-studio">
    <Link href={`/workspaces/${businessId}/knowledge`}>Business Connect</Link>
    <h1>{source.title}</h1>
    {typeof notice === "string" && notices.has(notice) && <p role="status">{notices.get(notice)}</p>}
    {archived && <section aria-label="Previous catalogue snapshot"><h2>Previous products</h2>
      <p>Imported {archived.imported} UTC</p><Products items={archived.previous_items}/>
      <Link href={path}>Close previous snapshot</Link>
    </section>}
    <details><summary>Current products ({source.catalogue_items.length})</summary>
      <Products items={source.catalogue_items}/>
    </details>
    {source.disconnected ? <p>Disconnected</p> : <section><h2>Refresh products</h2>
      <p>Paste the complete replacement list. Products omitted from it will be removed from the current catalogue.</p>
      <form key={source.revision} action={refreshCatalogue.bind(null,businessId,catalogueId,source.revision)}>
        <ProductRows previous={source.catalogue_items}/>
      </form></section>}
    <section><h2>Recent refreshes</h2>{history.length ? <ul>{history.map(row =>
      <li key={row.id}>{row.date} UTC · {row.added} added · {row.changed} changed · {row.removed} removed · <Link href={`${path}?snapshot=${row.id}`}>View previous products</Link></li>)}</ul> : <p>No refreshes recorded.</p>}</section>
  </main>;
}

function Products({ items }: { items: Product[] }) {
  return <ul className="catalogue-preview">{items.map(item => <li key={item.sku}>
    <strong>{item.sku} · {item.name}</strong><p>{item.description}</p>
  </li>)}</ul>;
}

export default function Page(props: Props) {
  return <Suspense fallback={<p>Loading catalogue…</p>}><Review {...props}/></Suspense>;
}
