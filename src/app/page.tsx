import { Suspense } from "react";
import { redirect } from "next/navigation";
import { verifiedSession } from "@/lib/workspace";
async function Entry() { return redirect(await verifiedSession() ? "/dashboard" : "/login"); }
export default function Page() { return <Suspense fallback={<p className="loading">Opening AgentFlow…</p>}><Entry /></Suspense>; }

