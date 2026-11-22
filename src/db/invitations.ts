import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { z } from "zod";
import { ensureIdentity } from "./workspace.ts";
import type { createConnection } from "./connection.ts";

export const invitationRole = z.enum(["Viewer", "Assistant manager"]);
export const tokenDigest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export type TeamTransaction = Parameters<
  Parameters<ReturnType<typeof drizzle>["transaction"]>[0]
>[0];
export async function resolveRole(
  tx: TeamTransaction,
  business: string,
  name: string,
) {
  const role = invitationRole.parse(name);
  const [row] =
    await tx.execute(sql`insert into roles(business_id,name) values(${business},${role})
    on conflict(business_id,name) do update set name=excluded.name returning id`);
  const id = String(row.id);
  await tx.execute(sql`insert into role_permissions(business_id,role_id,permission_key)
    values(${business},${id},'workspace.read') on conflict do nothing`);
  return id;
}

// A signed-in email and the privately delivered capability are both required.
// Only the invite row matching both can be consumed in this transaction.
export async function respondToInvitation(
  connection: ReturnType<typeof createConnection>,
  business: string,
  token: string,
  user: { id: string; email: string; name: string },
  accept: boolean,
) {
  z.uuid().parse(business);
  z.string()
    .regex(/^[a-f0-9]{64}$/)
    .parse(token);
  return drizzle(connection).transaction(async (tx) => {
    const identity = await ensureIdentity(tx, user.id);
    await tx.execute(
      sql`select set_config('agentflow.business_id',${business},true)`,
    );
    const [invite] =
      await tx.execute(sql`update workspace_invitations set status=${accept ? "accepted" : "declined"}
      where business_id=${business} and token_hash=${tokenDigest(token)} and email=${user.email.trim().toLowerCase()}
      and status='pending' and expires_at>now() returning id,role`);
    if (!invite) return false;
    let membership: string | null = null;
    if (accept) {
      const role = await resolveRole(tx, business, String(invite.role));
      const [member] =
        await tx.execute(sql`insert into business_memberships(business_id,user_id,role_id,display_name)
        values(${business},${identity.id},${role},${user.name}) on conflict(business_id,user_id) do update
        set active=true,role_id=case when business_memberships.active then business_memberships.role_id else excluded.role_id end,
        display_name=excluded.display_name returning id`);
      membership = String(member.id);
      await tx.execute(
        sql`update users set home_business_id=coalesce(home_business_id,${business}) where id=${identity.id}`,
      );
    }
    await tx.execute(sql`insert into audit_events(business_id,membership_id,action,target_id) values
      (${business},${membership},${accept ? "invitation.accepted" : "invitation.declined"},${String(invite.id)})`);
    return true;
  });
}
