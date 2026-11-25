import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { EntryShell } from "@/components/entry-shell";
import { TenantAccessDenied } from "@/db";
import { readWorkspace, verifiedSession, workspaceStore } from "@/lib/workspace";

import { isPlatformAdmin } from "@/lib/platform-identity";

async function WorkspaceList() {
  const session = await verifiedSession();
  if (!session) redirect("/login");
  const platformAdmin = await isPlatformAdmin(session.user.id);
  const memberships = await workspaceStore().listMemberships(session.user.id);
  const workspaces = [];
  for (const { businessId } of memberships) {
    try {
      const { business, role } = await readWorkspace(session.user.id, businessId);
      workspaces.push({ business, role });
    } catch (error) {
      if (!(error instanceof TenantAccessDenied)) throw error;
    }
  }
  return <EntryShell><h1>Your workspaces</h1><ul>{workspaces.map(({ business, role }) => <li key={business.id}><Link href={`/dashboard?businessId=${business.id}`}>{business.name}</Link> · {role}</li>)}</ul><Link href="/workspaces/new">Create a workspace</Link>{platformAdmin && <p><Link href="/admin/settings/site-identity">Platform settings</Link></p>}</EntryShell>;
}

export default function Page() {
  return <Suspense fallback={<p>Loading workspaces…</p>}><WorkspaceList /></Suspense>;
}
