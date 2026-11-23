"use server";

import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { asAssistantManager } from "../assistant/store";

export async function assign(business: string, thread: string, form: FormData) {
  z.uuid().parse(thread);
  const action = z.enum(["claim", "release"]).parse(form.get("action"));
  const assignmentId = action === "release" ? z.uuid().parse(form.get("assignment")) : null;
  await asAssistantManager(business, async ({ tx, membershipId }) => {
    const [conversation] = await tx.execute(sql`select id from conversations
      where business_id=${business} and id=${thread} and needs_human
      and agent_version is not null for update`);
    if (!conversation) return;
    const [changed] = action === "claim"
      ? await tx.execute(sql`insert into conversation_assignments(business_id,conversation_id,membership_id)
          values(${business},${thread},${membershipId})
          on conflict (business_id,conversation_id) where ended_at is null do nothing returning id`)
      : await tx.execute(sql`update conversation_assignments set ended_at=clock_timestamp()
          where business_id=${business} and conversation_id=${thread} and id=${assignmentId} and ended_at is null
          and (membership_id=${membershipId} or exists (
            select 1 from business_memberships m join roles r on m.business_id=r.business_id and m.role_id=r.id
            where m.business_id=${business} and m.id=${membershipId} and m.active and r.name='Owner'
          )) returning id`);
    if (changed) await tx.execute(sql`insert into audit_events(business_id,membership_id,action,target_id)
      values(${business},${membershipId},${"assistant.handoff." + action},${thread})`);
  }).catch((error: unknown) => {
    // A simultaneous assignment can invalidate the repeatable-read snapshot.
    // Refresh the queue so the operator sees the winning assignment.
    const cause = error instanceof Error ? error.cause : undefined;
    if (!z.object({ code: z.literal("40001") }).safeParse(cause).success &&
        !z.object({ code: z.literal("40001") }).safeParse(error).success) throw error;
  });
  revalidatePath(`/workspaces/${business}/inbox`);
}
