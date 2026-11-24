import "server-only";
import { sql } from "drizzle-orm";
import { asAssistantManager } from "../assistant/store";

type Transaction = Parameters<Parameters<typeof asAssistantManager>[1]>[0]["tx"];

export function latestFacts(tx: Transaction, business: string) {
  return tx.execute<{ id: string; key: string; revision: number; title: string; body: string; is_faq: boolean; cutoff: number }>(sql`
    select latest.*,root.retired_through as cutoff from (
      select distinct on (library_key) id, library_key as key, revision, title, body, source_ref='workspace-faq' as is_faq
      from knowledge_documents where business_id=${business} and library_key is not null and status='ready'
      order by library_key, revision desc
    ) latest join knowledge_documents root on root.business_id=${business}
      and root.library_key=latest.key and root.revision=1 order by latest.title, latest.key`);
}

// A share lock orders a draft save or publication against retirement of the same fact.
export function assignableFacts(tx: Transaction, business: string, ids: string[]) {
  return tx.execute<{ id: string; key: string; revision: number; title: string; body: string }>(sql`
    select d.id,d.library_key as key,d.revision,d.title,d.body from knowledge_documents d
    join knowledge_documents root on root.business_id=d.business_id and root.library_key=d.library_key and root.revision=1
    where d.business_id=${business} and d.status='ready' and d.revision>root.retired_through
      and d.id in (${sql.join(ids.map(id => sql`${id}`), sql`,`)})
    order by root.id for share of root`);
}
