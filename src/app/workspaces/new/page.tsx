import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EntryShell } from "@/components/entry-shell";
import { OnboardingForm } from "@/components/onboarding-form";
import { verifiedSession } from "@/lib/workspace";

async function NewWorkspace() {
  if (!await verifiedSession()) redirect("/login");
  return <EntryShell><h1>Create a workspace</h1>
    <OnboardingForm additional timezones={["UTC", ...Intl.supportedValuesOf("timeZone")]} />
    <Link href="/workspaces">Back to workspaces</Link>
  </EntryShell>;
}

export default function Page() {
  return <Suspense fallback={<p>Loading…</p>}><NewWorkspace /></Suspense>;
}
