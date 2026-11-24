"use server";

import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { asAssistantManager } from "../assistant/store";

export async function saveFact(business: string, key: string, previous: number, form: FormData) {
  const path = `/workspaces/${business}/knowledge`;
  const action = z.enum(["save", "createFaq", "retire", "restore"]).parse(form.get("action") ?? "save");
  const fields = z.object({
    title: z.string().trim().min(1).max(2000),
    body: z.string().trim().min(1).max(6000),
  }).safeParse(Object.fromEntries(form));
  if (action !== "retire" && !fields.success) redirect(path + "?notice=invalid");

  const saved = await asAssistantManager(business, async ({ tx, membershipId }) => {
    const libraryKey = z.uuid().parse(key);
    const [latest] = await tx.execute(sql`select d.revision,d.title,d.body,d.source_ref,root.retired_through from knowledge_documents d
      join knowledge_documents root on root.business_id=d.business_id and root.library_key=d.library_key and root.revision=1
      where d.business_id=${business} and d.library_key=${libraryKey} order by d.revision desc limit 1`);
    if ((latest?.revision ?? 0) !== previous) return false;
    if (!latest && action !== "save" && action !== "createFaq") return false;
    if (latest && action === "createFaq") return false;
    const sourceRef = latest?.source_ref ?? (action === "createFaq" ? "workspace-faq" : "workspace-text");
    const retired = latest && Number(latest.revision) <= Number(latest.retired_through);
    if (action === "restore" ? !retired : retired) return false;
    const title = action === "retire" ? String(latest.title) : fields.data!.title;
    const body = action === "retire" ? String(latest.body) : fields.data!.body;
    const [row] = await tx.execute(sql`insert into knowledge_documents
      (business_id,library_key,revision,title,body,source_ref,status,processed_at)
      values(${business},${libraryKey},${previous + 1},${title},${body},${String(sourceRef)},'ready',now())
      on conflict on constraint workspace_fact_revision do nothing returning id`);
    if (!row) return false;
    if (action === "retire") {
      await tx.execute(sql`update knowledge_documents set retired_through=${previous + 1}
        where business_id=${business} and library_key=${libraryKey} and revision=1`);
    }
    const event = { createFaq: "knowledge.faq.created", save: "knowledge.revision.saved", retire: "knowledge.fact.retired", restore: "knowledge.fact.restored" }[action];
    await tx.execute(sql`insert into audit_events(business_id,membership_id,action,target_id)
      values(${business},${membershipId},${event},${String(row.id)})`);
    return true;
  }).catch((error: unknown) => {
    const conflict = z.object({ code: z.literal("40001") });
    if (conflict.safeParse(error).success || conflict.safeParse(error instanceof Error && error.cause).success) return false;
    throw error;
  });
  if (saved) {
    revalidatePath(path);
    revalidatePath(`/workspaces/${business}/assistant`);
  }
  const notice = { createFaq: "faqSaved", save: "saved", retire: "retired", restore: "restored" }[action];
  redirect(path + "?notice=" + (saved ? notice : "changed"));
}
