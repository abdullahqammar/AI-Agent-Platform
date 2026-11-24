"use server";

import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { asAssistantManager } from "../assistant/store";

export async function saveFact(business: string, key: string, previous: number, form: FormData) {
  const path = `/workspaces/${business}/knowledge`;
  const fields = z.object({
    title: z.string().trim().min(1).max(2000),
    body: z.string().trim().min(1).max(6000),
  }).safeParse(Object.fromEntries(form));
  if (!fields.success) redirect(path + "?notice=invalid");
  const { title, body } = fields.data;
  const saved = await asAssistantManager(business, async ({ tx, membershipId }) => {
    const libraryKey = z.uuid().parse(key);
    const [latest] = await tx.execute(sql`select revision from knowledge_documents
      where business_id=${business} and library_key=${libraryKey} order by revision desc limit 1`);
    if ((latest?.revision ?? 0) !== previous) return false;
    const [row] = await tx.execute(sql`insert into knowledge_documents
      (business_id,library_key,revision,title,body,source_ref,status,processed_at)
      values(${business},${libraryKey},${previous + 1},${title},${body},'workspace-text','ready',now())
      on conflict on constraint workspace_fact_revision do nothing returning id`);
    if (!row) return false;
    await tx.execute(sql`insert into audit_events(business_id,membership_id,action,target_id)
      values(${business},${membershipId},'knowledge.revision.saved',${String(row.id)})`);
    return true;
  }).catch((error: unknown) => {
    const conflict = z.object({ code: z.literal("40001") });
    if (conflict.safeParse(error).success || conflict.safeParse(error instanceof Error && error.cause).success) return false;
    throw error;
  });
  redirect(path + (saved ? "?notice=saved" : "?notice=changed"));
}
