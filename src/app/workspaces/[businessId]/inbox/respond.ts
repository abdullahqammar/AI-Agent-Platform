"use server";

import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { asAssistantManager } from "../assistant/store";

export async function respond(business: string, agent: string, thread: string, assignment: string, requestId: string, form: FormData) {
  [agent, thread, assignment, requestId].forEach(id => z.uuid().parse(id));
  const action = z.enum(["reply", "resolve"]).parse(form.get("action"));
  const body = action === "reply" ? z.string().trim().min(1).max(3000).safeParse(form.get("body")) : undefined;
  const path = `/workspaces/${business}/assistant?agent=${agent}&thread=${thread}`;
  if (body && !body.success) redirect(path + "&staffNotice=empty");

  const accepted = await asAssistantManager(business, async ({ tx, membershipId, staffName }) => {
    const [held] = await tx.execute(sql`select c.channel_id from conversations c
      join conversation_assignments a on a.business_id=c.business_id and a.conversation_id=c.id
      join channel_connections ch on ch.business_id=c.business_id and ch.id=c.channel_id
      where c.business_id=${business} and c.agent_id=${agent} and c.id=${thread}
      and ch.provider='in-app' and c.needs_human and c.closed_at is null
      and a.id=${assignment} and a.membership_id=${membershipId} and a.ended_at is null
      for update of c,a`);
    if (!held) return false;
    if (action === "reply") {
      const [saved] = await tx.execute(sql`insert into messages
        (id,business_id,conversation_id,channel_id,direction,body,staff_membership_id,occurred_at)
        values(${requestId},${business},${thread},${String(held.channel_id)},'outbound',${body?.data},${membershipId},clock_timestamp())
        on conflict (id) do nothing returning id`);
      if (!saved) return true;
      await tx.execute(sql`update business_memberships set display_name=${staffName}
        where business_id=${business} and id=${membershipId} and display_name is null`);
    } else {
      await tx.execute(sql`update conversation_assignments set ended_at=clock_timestamp() where id=${assignment}`);
      await tx.execute(sql`update conversations set closed_at=clock_timestamp(), needs_human=false where id=${thread}`);
    }
    await tx.execute(sql`insert into audit_events(business_id,membership_id,action,target_id)
      values(${business},${membershipId},${"assistant.handoff." + action},${thread})`);
    return true;
  }).catch((error: unknown) => {
    const serialization = z.object({ code: z.literal("40001") });
    if (serialization.safeParse(error).success || serialization.safeParse(error instanceof Error && error.cause).success) return false;
    throw error;
  });
  redirect(path + (accepted ? "" : "&staffNotice=changed"));
}
