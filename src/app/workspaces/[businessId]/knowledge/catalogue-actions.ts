"use server";

import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { compareCatalogue, parseCatalogue, type Product } from "@/lib/assistant/catalogue";
import { withWorkspaceRoles } from "../assistant/store";

export async function importCatalogue(business: string, id: string, form: FormData) {
  const path = `/workspaces/${business}/knowledge`;
  const name = z.string().trim().min(1).max(160).safeParse(form.get("name"));
  const rows = form.get("products");
  const products = typeof rows === "string" && parseCatalogue(rows);
  if (!name.success || !products) redirect(path + "?notice=invalidCatalogue");
  await withWorkspaceRoles(business, ["Owner"], async ({ tx, membershipId }) => {
    const inserted = await tx.execute(sql`insert into knowledge_documents
      (id,business_id,title,source_ref,status,catalogue_items,revision,processed_at)
      values(${z.uuid().parse(id)},${business},${name.data},'catalogue-import','ready',${JSON.stringify(products)}::jsonb,1,now())
      on conflict(id) do nothing returning id`);
    if (inserted.length) await tx.execute(sql`insert into audit_events(business_id,membership_id,action,target_id)
      values(${business},${membershipId},'catalogue.imported',${id})`);
  });
  revalidatePath(path);
  redirect(path + "?notice=catalogueSaved");
}

export async function changeCatalogueAccess(business: string, id: string, revision: number, form: FormData) {
  const path = `/workspaces/${business}/knowledge`;
  const action = z.enum(["grant", "revoke", "disconnect"]).parse(form.get("action"));
  const changed = await withWorkspaceRoles(business, ["Owner"], async ({ tx, membershipId }) => {
    const [source] = await tx.execute(sql`select revision from knowledge_documents where business_id=${business}
      and id=${id} and source_ref='catalogue-import' and disconnected_at is null for update`);
    if (source?.revision !== revision) return false;
    let affected;
    if (action === "disconnect") {
      affected = await tx.execute(sql`select agent_id from agent_knowledge where business_id=${business} and document_id=${id} order by agent_id`);
    } else {
      affected = [{ agent_id: z.uuid().parse(form.get("agent")) }];
    }
    for (const row of affected) {
      const agent = String(row.agent_id);
      const updated = await tx.execute(sql`update agents set access_generation=access_generation+1, tested_version=null
        where business_id=${business} and id=${agent} returning id`);
      if (!updated.length) throw Error("Assistant unavailable");
      if (action === "grant") {
        await tx.execute(sql`insert into agent_knowledge(business_id,agent_id,document_id) values(${business},${agent},${id})
          on conflict(business_id,agent_id,document_id) do nothing`);
      } else {
        await tx.execute(sql`delete from agent_knowledge where business_id=${business} and document_id=${id} and agent_id=${agent}`);
      }
      await tx.execute(sql`insert into audit_events(business_id,membership_id,action,target_id)
        values(${business},${membershipId},${`catalogue.${id}.access.${action}`},${agent})`);
    }
    await tx.execute(sql`update knowledge_documents set revision=revision+1,
      disconnected_at=case when ${action}='disconnect' then now() else disconnected_at end where business_id=${business} and id=${id}`);
    if (action === "disconnect") await tx.execute(sql`insert into audit_events(business_id,membership_id,action,target_id)
      values(${business},${membershipId},'catalogue.disconnected',${id})`);
    return true;
  }).catch((error: unknown) => {
    const conflict = z.object({code: z.literal("40001")});
    if (conflict.safeParse(error).success || conflict.safeParse(error instanceof Error && error.cause).success) return false;
    throw error;
  });
  revalidatePath(path);
  redirect(path + "?notice=" + (changed ? "catalogueUpdated" : "changed"));
}

export async function refreshCatalogue(business: string, id: string, revision: number, form: FormData) {
  const path = `/workspaces/${business}/knowledge/${id}`;
  const rows = form.get("products");
  const products = typeof rows === "string" && parseCatalogue(rows);
  if (!products || form.get("reviewed") !== "yes") redirect(path + "?notice=invalid");
  const outcome = await withWorkspaceRoles(business, ["Owner"], async ({ tx, membershipId }) => {
    const [source] = await tx.execute<{ revision: number; catalogue_items: Product[] }>(sql`
      select revision,catalogue_items from knowledge_documents
      where business_id=${business} and id=${id} and source_ref='catalogue-import' and disconnected_at is null for update`);
    if (!source || source.revision !== revision) return "stale";
    const diff = compareCatalogue(source.catalogue_items, products);
    if (!diff.added.length && !diff.changed.length && !diff.removed.length) return "same";
    await tx.execute(sql`insert into catalogue_refreshes
      (business_id,document_id,membership_id,source_revision,previous_items,previous_import,added,changed,removed)
      select business_id,id,${membershipId},revision,catalogue_items,processed_at,${diff.added.length},${diff.changed.length},${diff.removed.length}
      from knowledge_documents where business_id=${business} and id=${id}`);
    const affected = await tx.execute<{ agent_id: string }>(sql`select agent_id from agent_knowledge
      where business_id=${business} and document_id=${id} order by agent_id`);
    for (const { agent_id } of affected) {
      await tx.execute(sql`update agents set access_generation=access_generation+1,tested_version=null where business_id=${business} and id=${agent_id}`);
    }
    await tx.execute(sql`update knowledge_documents set catalogue_items=${JSON.stringify(products)}::jsonb,
      processed_at=now(),revision=revision+1 where business_id=${business} and id=${id}`);
    await tx.execute(sql`insert into audit_events(business_id,membership_id,action,target_id)
      values(${business},${membershipId},'catalogue.refreshed',${id})`);
    return "updated";
  }).catch((error: unknown) => {
    const conflict = z.object({ code: z.literal("40001") });
    if (conflict.safeParse(error).success || conflict.safeParse(error instanceof Error && error.cause).success) return "stale";
    throw error;
  });
  revalidatePath(path);
  revalidatePath(`/workspaces/${business}/knowledge`);
  redirect(path + "?notice=" + outcome);
}
