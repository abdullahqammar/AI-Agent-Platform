import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { sql } from "drizzle-orm";
import { TenantAccessDenied } from "@/db";
import { asAssistantManager } from "../assistant/store";
import { assign } from "./actions";

type Props = PageProps<"/workspaces/[businessId]/inbox">;

async function Inbox({ params }: Props) {
  const { businessId } = await params;
  const rows = await asAssistantManager(businessId, ({ tx, membershipId }) =>
    tx.execute<{ id: string; agent_id: string; customer: string; assistant: string;
      test_mode: boolean; assignment_id: string | null; membership_id: string | null; assignee: string | null; can_release: boolean }>(
      sql`select c.id,c.agent_id,u.name as customer,a.name as assistant,c.test_mode,
        assignment.id as assignment_id,assignment.membership_id,staff.display_name as assignee,
        (assignment.membership_id=${membershipId} or r.name='Owner') as can_release
        from conversations c
        join customers u on u.business_id=c.business_id and u.id=c.customer_id
        join agents a on a.business_id=c.business_id and a.id=c.agent_id
        join business_memberships me on me.business_id=c.business_id and me.id=${membershipId}
        join roles r on r.business_id=me.business_id and r.id=me.role_id
        left join conversation_assignments assignment on assignment.business_id=c.business_id
          and assignment.conversation_id=c.id and assignment.ended_at is null
        left join business_memberships staff on staff.business_id=c.business_id and staff.id=assignment.membership_id
        where c.business_id=${businessId} and c.needs_human and c.agent_version is not null
        order by c.created_at,c.id`)
  ).catch(error => {
    if (error instanceof TenantAccessDenied) notFound();
    throw error;
  });
  return <main className="assistant-studio">
    <Link href={`/dashboard?businessId=${businessId}`}>Workspace overview</Link>
    <h1>Staff handoffs</h1>
    {rows.length === 0 && <p>No conversations awaiting staff.</p>}
    {rows.map(row => <section key={row.id}>
      <h2><Link href={`/workspaces/${businessId}/assistant?agent=${row.agent_id}&thread=${row.id}`}>{row.customer}</Link></h2>
      <p>{row.assistant} · {row.test_mode ? "Test conversation" : "Published conversation"}</p>
      <p>{row.membership_id ? "Assigned to " + (row.assignee ?? "a workspace member") : "Unassigned"}</p>
      <form action={assign.bind(null, businessId, row.id)}>
        {row.assignment_id && <input type="hidden" name="assignment" value={row.assignment_id} />}
        {row.membership_id
          ? row.can_release && <button name="action" value="release">Release assignment</button>
          : <button name="action" value="claim">Assign to me</button>}
      </form>
    </section>)}
  </main>;
}

export default function Page(props: Props) {
  return <Suspense fallback={<p>Loading staff handoffs…</p>}><Inbox {...props} /></Suspense>;
}
