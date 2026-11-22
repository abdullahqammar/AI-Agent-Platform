import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "drizzle-orm";
import { TenantAccessDenied } from "@/db";
import { withWorkspaceRoles } from "../assistant/store";
import { InviteForm } from "./invite-form";
import { changeTeam } from "./actions";
async function Team({ params }: PageProps<"/workspaces/[businessId]/team">) {
  const { businessId } = await params;
  const data = await withWorkspaceRoles(
    businessId,
    ["Owner", "Assistant manager", "Viewer"],
    async ({ tx, membershipId }) => {
      const members =
        await tx.execute(sql`select m.id,m.display_name,m.active,r.name from business_memberships m
      join roles r on r.id=m.role_id order by m.created_at`);
      const owner = members.some(
        (m) => m.id === membershipId && m.name === "Owner",
      );
      const invites = owner
        ? await tx.execute(sql`select id,email,role,case when status='pending' and expires_at<=now() then 'expired' else status end as state
      from workspace_invitations order by email`)
        : [];
      return { members, owner, invites, membershipId };
    },
  ).catch((e) => {
    if (e instanceof TenantAccessDenied) notFound();
    throw e;
  });
  const action = changeTeam.bind(null, businessId);
  return (
    <main className="assistant-studio">
      <Link href={`/dashboard?businessId=${businessId}`}>
        Workspace overview
      </Link>
      <h1>Workspace team</h1>
      {data.owner && (
        <section>
          <h2>Invite a teammate</h2>
          <p>
            Viewers can open the workspace. Assistant managers can also
            configure, test and publish its assistants.
          </p>
          <InviteForm business={businessId} />
        </section>
      )}
      <section>
        <h2>Members</h2>
        {data.members.map((m) => (
          <article key={String(m.id)}>
            <h3>
              {String(m.display_name ?? m.name)}
              {m.id === data.membershipId ? " (you)" : ""}
            </h3>
            <p>
              {String(m.name)} · {m.active ? "Active" : "Revoked"}
            </p>
            {m.active === true &&
              m.name !== "Owner" &&
              (data.owner || m.id === data.membershipId) && (
                <>
                  {data.owner && (
                    <form action={action}>
                      <input name="id" type="hidden" value={String(m.id)} />
                      <label>
                        Member role
                        <select name="role" defaultValue={String(m.name)}>
                          <option>Viewer</option>
                          <option>Assistant manager</option>
                        </select>
                      </label>
                      <button name="action" value="change role">
                        Save role
                      </button>
                    </form>
                  )}
                  <form action={action}>
                    <input name="id" type="hidden" value={String(m.id)} />
                    <label>
                      <input required type="checkbox" name="confirm" /> Confirm
                      access removal
                    </label>
                    <button
                      name="action"
                      value={data.owner ? "revoke access" : "leave"}
                    >
                      {data.owner ? "Revoke access" : "Leave workspace"}
                    </button>
                  </form>
                </>
              )}
          </article>
        ))}
      </section>
      {data.owner && (
        <section>
          <h2>Invitations</h2>
          {!data.invites.length && <p>No invitations yet.</p>}
          {data.invites.map((i) => (
            <article key={String(i.id)}>
              <p>
                {String(i.email)} · {String(i.role)} · {String(i.state)}
              </p>
              {i.state === "pending" && (
                <form action={action}>
                  <input type="hidden" name="id" value={String(i.id)} />
                  <button name="action" value="revoke invite">
                    Revoke invitation
                  </button>
                </form>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
export default function Page(
  props: PageProps<"/workspaces/[businessId]/team">,
) {
  return (
    <Suspense fallback={<p>Loading team…</p>}>
      <Team {...props} />
    </Suspense>
  );
}
