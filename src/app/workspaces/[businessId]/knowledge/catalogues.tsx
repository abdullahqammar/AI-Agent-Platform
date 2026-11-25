import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { changeCatalogueAccess, importCatalogue } from "./catalogue-actions";
import type { asAssistantManager } from "../assistant/store";

type Context = Parameters<Parameters<typeof asAssistantManager>[1]>[0];

export async function catalogueView({tx,membershipId}: Context, business: string) {
  const [role] = await tx.execute(sql`select r.name from business_memberships m join roles r
    on r.business_id=m.business_id and r.id=m.role_id where m.business_id=${business} and m.id=${membershipId}`);
  const sources = await tx.execute<{id:string; title:string; revision:number; count:number; imported:string; disconnected:boolean}>(sql`
    select id,title,revision,jsonb_array_length(catalogue_items) as count,
      to_char(processed_at at time zone 'UTC','YYYY-MM-DD HH24:MI') as imported, disconnected_at is not null as disconnected
    from knowledge_documents where business_id=${business} and source_ref='catalogue-import' order by created_at desc,id`);
  const agents = await tx.execute<{id:string; name:string}>(sql`select id,name from agents where business_id=${business} order by name,id`);
  const grants = await tx.execute<{agent_id:string; document_id:string}>(sql`select k.agent_id,k.document_id
    from agent_knowledge k join knowledge_documents d on d.id=k.document_id and d.business_id=k.business_id
    where k.business_id=${business} and d.source_ref='catalogue-import'`);
  return {owner:role.name==="Owner",sources,agents,grants};
}

export function Catalogues({business,data}:{business:string;data:Awaited<ReturnType<typeof catalogueView>>}) {
  return <section><h2>Product catalogues</h2>
    {data.owner && <details><summary>Import a catalogue</summary>
      <form action={importCatalogue.bind(null,business,randomUUID())}>
        <label>Catalogue name<input name="name" required maxLength={160}/></label>
        <label>Product rows<textarea name="products" required maxLength={120000} rows={5} aria-describedby="product-format"/></label>
        <p id="product-format">Paste up to 250 spreadsheet rows with three columns in order: SKU, product name and description. Omit the header. Each SKU must be unique.</p>
        <button>Import products</button>
      </form></details>}
    {!data.sources.length && <p>No product catalogues imported.</p>}
    {data.sources.map(source => <article key={source.id} aria-label={source.title}>
      <h3>{source.title}</h3><p>{source.count} products · Imported {source.imported} UTC · {source.disconnected ? "Disconnected" : "Read-only snapshot"}</p>
      {!source.disconnected && <>
        <p>Access applies immediately to draft tests and enabled assistants.</p>
        {data.agents.map(agent => {
          const allowed = data.grants.some(g => g.document_id===source.id && g.agent_id===agent.id);
          return <form key={agent.id} action={changeCatalogueAccess.bind(null,business,source.id,source.revision)}>
            <input type="hidden" name="agent" value={agent.id}/>
            {agent.name} · {allowed ? "Read access" : "No access"}{" "}
            {data.owner && <button name="action" value={allowed ? "revoke" : "grant"} aria-label={`${allowed ? "Revoke" : "Grant"} access for ${agent.name}`}>{allowed ? "Revoke" : "Grant access"}</button>}
          </form>;
        })}
        {data.owner && <details><summary>Disconnect catalogue</summary>
          <p>All assistants will lose access. The import and past transcripts are retained.</p>
          <form action={changeCatalogueAccess.bind(null,business,source.id,source.revision)}><button name="action" value="disconnect">Confirm disconnect</button></form>
        </details>}
      </>}
    </article>)}
  </section>;
}
