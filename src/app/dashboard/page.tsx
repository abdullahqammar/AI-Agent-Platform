import { z } from "zod";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { Building2, MapPin, Globe2, LayoutDashboard, MessageSquare, Bot, Users, CalendarDays, BookOpen, Plug, Settings } from "lucide-react";
import { verifiedSession, workspaceStore, readWorkspace } from "@/lib/workspace";
import { TenantAccessDenied } from "@/db";
import { Brand } from "@/components/brand";
import { Logout } from "@/components/logout";

type DashboardProps = Pick<PageProps<"/dashboard">, "searchParams">;

async function Dashboard({ searchParams }: DashboardProps) {
  const session = await verifiedSession();
  if (!session) redirect("/login");
  const { businessId } = await searchParams;
  const selected = z.uuid().optional().safeParse(businessId);
  if (!selected.success) notFound();
  const target = selected.data ?? (await workspaceStore().identity(session.user.id)).homeBusinessId;
  if (!target) redirect("/onboarding");
  let workspace;
  try { workspace = await readWorkspace(session.user.id, target); }
  catch (error) {
    if (!(error instanceof TenantAccessDenied)) throw error;
    return <main className="access-message"><Brand /><h1>Workspace access unavailable</h1><p>Your membership or permissions may have changed. Contact your business owner.</p><a href="/workspaces">Your workspaces</a><Logout /></main>;
  }
  const { business, role, locations } = workspace;
  const navigation = [
    ["Inbox", MessageSquare], ["AI Agents", Bot], ["Customers", Users], ["Appointments", CalendarDays],
    ["Knowledge", BookOpen], ["Channels", Plug], ["Settings", Settings],
  ] as const;
  return <main className="workspace">
    <aside className="sidebar"><Brand /><a className="workspace-switch" aria-label="Switch workspace" href="/workspaces"><Building2 size={20} /><div><strong>{business.name}</strong><span>{role}</span></div></a>
      <nav aria-label="Workspace"><a className="nav-active" href={`/dashboard?businessId=${business.id}`} aria-current="page"><LayoutDashboard size={18} />Overview</a>{navigation.map(([label, Icon]) => <span className="nav-disabled" key={label} aria-disabled="true"><Icon size={18} />{label}<small>Soon</small></span>)}</nav>
      <div className="sidebar-account"><strong>{session.user.name}</strong><span>{session.user.email}</span><Logout /></div>
    </aside>
    <section className="workspace-main"><header><span>Workspace overview</span><span className="role-label">{role}</span></header>
      <div className="workspace-body"><div className="welcome"><p className="muted">Your business workspace</p><h1>{business.name}</h1><p>Welcome, {session.user.name}. Your workspace is ready.</p></div>
        <section className="workspace-details" aria-label="Business details"><div><Globe2 size={20} /><p>Business timezone<strong>{business.timezone}</strong></p></div><div><Building2 size={20} /><p>Your role<strong>{role}</strong></p></div></section>
        <section className="locations"><h2>Locations</h2>{locations.map(location => <article key={location.id}><MapPin size={22} /><div><h3>{location.name}</h3>{location.address && <p>{location.address}</p>}<p className="muted">{location.timezone}</p></div></article>)}</section>
        <section className="workspace-empty"><div className="empty-icon"><Bot size={30} /></div><h2>Your assistants will live here</h2><p>Agent configuration and channel connections are coming next.</p></section>
      </div>
    </section>
  </main>;
}
export default function Page(props: DashboardProps) { return <Suspense fallback={<p className="loading">Loading workspace…</p>}><Dashboard {...props} /></Suspense>; }
