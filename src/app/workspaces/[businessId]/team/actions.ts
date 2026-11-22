"use server";
import { randomBytes } from "node:crypto";
import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { invitationRole, resolveRole, tokenDigest } from "@/db/invitations";
import { withWorkspaceRoles } from "../assistant/store";

export async function invite(
  business: string,
  form: FormData,
) {
  const email = z
    .email()
    .max(254)
    .safeParse(String(form.get("email")).trim().toLowerCase());
  const role = invitationRole.safeParse(form.get("role"));
  if (!email.success || !role.success)
    return { message: "Enter a valid email and role.", link: "" };
  const token = randomBytes(32).toString("hex");
  return withWorkspaceRoles(
    business,
    ["Owner"],
    async ({ tx, membershipId }) => {
      // Serialize concurrent issuances; conflict on repeatable-read transactions fails closed.
      await tx.execute(
        sql`update businesses set timezone=timezone where id=${business}`,
      );
      const [count] =
        await tx.execute(sql`select count(*)::int as total from audit_events where business_id=${business}
      and action='invitation.issued' and created_at>now()-interval '1 hour'`);
      if (Number(count.total) >= 20)
        return { message: "Hourly invitation limit reached.", link: "" };
      const [row] =
        await tx.execute(sql`insert into workspace_invitations(business_id,email,role,token_hash,expires_at)
      values(${business},${email.data},${role.data},${tokenDigest(token)},now()+interval '7 days')
      on conflict(business_id,email) do update set role=excluded.role,token_hash=excluded.token_hash,status='pending',
      expires_at=excluded.expires_at returning id`);
      await tx.execute(sql`insert into audit_events(business_id,membership_id,action,target_id)
      values(${business},${membershipId},'invitation.issued',${String(row.id)})`);
      revalidatePath(`/workspaces/${business}/team`);
      return {
        message:
          "Share this link privately with the recipient. It expires in seven days. Issuing another replaces it.",
        link: `/join/${business}#${token}`,
      };
    },
  );
}

export async function changeTeam(business: string, form: FormData) {
  const action = z
    .enum(["revoke invite", "change role", "revoke access", "leave"])
    .parse(form.get("action"));
  const id = z.uuid().parse(form.get("id"));
  await withWorkspaceRoles(
    business,
    action === "leave" ? ["Owner", "Viewer", "Assistant manager"] : ["Owner"],
    async ({ tx, membershipId }) => {
      if (action === "leave" && id !== membershipId)
        throw Error("Access denied");
      if (action === "revoke invite") {
        const rows = await tx.execute(
          sql`update workspace_invitations set status='revoked' where id=${id} and status='pending' returning id`,
        );
        if (!rows.length) return;
      } else {
        const [member] =
          await tx.execute(sql`select r.name from business_memberships m join roles r on m.role_id=r.id
        where m.id=${id} and m.active for update of m`);
        if (!member || member.name === "Owner")
          throw Error("Membership cannot be changed");
        if (action === "change role") {
          const role = await resolveRole(
            tx,
            business,
            invitationRole.parse(form.get("role")),
          );
          await tx.execute(
            sql`update business_memberships set role_id=${role} where id=${id}`,
          );
        } else {
          if (form.get("confirm") !== "on")
            throw Error("Confirmation required");
          await tx.execute(sql`update workspace_invitations set status='revoked' where status='pending' and id in
            (select target_id from audit_events where membership_id=${id} and action='invitation.accepted')`);
          await tx.execute(
            sql`update business_memberships set active=false where id=${id}`,
          );
        }
      }
      await tx.execute(sql`insert into audit_events(business_id,membership_id,action,target_id) values
      (${business},${membershipId},${"team." + action.replaceAll(" ", "_")},${id})`);
    },
  );
  revalidatePath(`/workspaces/${business}/team`);
  if (action === "leave") redirect("/workspaces");
}
