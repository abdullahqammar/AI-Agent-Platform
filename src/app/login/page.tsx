import { Suspense } from "react";
import { redirect } from "next/navigation";
import { verifiedSession } from "@/lib/workspace";
import { EntryShell } from "@/components/entry-shell";
import { AuthForm } from "@/components/auth-form";
async function Login() {
  if (await verifiedSession()) redirect("/dashboard");
  return <EntryShell><AuthForm mode="login" /></EntryShell>;
}
export default function Page() { return <Suspense fallback={<p className="loading">Loading…</p>}><Login /></Suspense>; }
