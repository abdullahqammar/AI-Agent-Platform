import { Suspense } from "react";
import { redirect } from "next/navigation";
import { verifiedSession, workspaceStore } from "@/lib/workspace";
import { EntryShell } from "@/components/entry-shell";
import { OnboardingForm } from "@/components/onboarding-form";
import { Logout } from "@/components/logout";
async function Onboarding() {
  const session = await verifiedSession();
  if (!session) redirect("/login");
  const user = await workspaceStore().identity(session.user.id);
  if (user.homeBusinessId) redirect("/dashboard");
  const timezones = ["UTC", ...Intl.supportedValuesOf("timeZone")];
  return <EntryShell><h1>Set up your business</h1><p className="intro">Create a workspace for your team and business assistants.</p><OnboardingForm timezones={timezones} /><div className="entry-signout"><Logout /></div></EntryShell>;
}
export default function Page() { return <Suspense fallback={<p className="loading">Loading…</p>}><Onboarding /></Suspense>; }
