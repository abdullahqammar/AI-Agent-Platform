import "server-only";
import { sql } from "drizzle-orm";
import { asAssistantManager } from "../assistant/store";

type Transaction = Parameters<Parameters<typeof asAssistantManager>[1]>[0]["tx"];

export function latestFacts(tx: Transaction, business: string) {
  return tx.execute<{ id: string; key: string; revision: number; title: string; body: string }>(sql`
    select * from (
      select distinct on (library_key) id, library_key as key, revision, title, body
      from knowledge_documents where business_id=${business} and library_key is not null and status='ready'
      order by library_key, revision desc
    ) latest order by title, key`);
}
