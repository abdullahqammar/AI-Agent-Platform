import { Suspense } from "react";
import { redirect } from "next/navigation";
import { verifiedSession } from "@/lib/workspace";
import { EntryShell } from "@/components/entry-shell";
import { AuthForm } from "@/components/auth-form";
async function Register() {
  if (await verifiedSession()) redirect("/dashboard");
  return <EntryShell><AuthForm mode="register" /></EntryShell>;
}
export default function Page() { return <Suspense fallback={<p className="loading">Loading…</p>}><Register /></Suspense>; }
