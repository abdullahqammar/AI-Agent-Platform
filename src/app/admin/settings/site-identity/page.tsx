import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getConnection } from "@/db/connection";
import { verifiedSession } from "@/lib/workspace";
import { defaultIdentity, type Identity } from "@/lib/platform-identity";
import { saveIdentity } from "./actions";

type Props = PageProps<"/admin/settings/site-identity">;
async function Settings({ searchParams }: Props) {
  const session = await verifiedSession();
  if (!session) notFound();
  const data = await getConnection().begin(async tx => {
    const [admin] = await tx`select user_id from platform_admins where user_id=${session.user.id} for share`;
    if (!admin) return null;
    return tx<(Identity & { version: number; edited: string })[]>`select version,name,tagline,title,description,
      to_char(created_at at time zone 'UTC','YYYY-MM-DD HH24:MI') as edited
      from site_identity_versions order by version desc limit 10`;
  });
  if (!data) notFound();
  const current = data[0] ?? { ...defaultIdentity, version: 0 };
  const { notice } = await searchParams;
  const messages = new Map([["saved","Site identity saved."],["stale","A newer version was saved. Review the current settings before editing."],
    ["same","These settings are already active."],["invalid","Complete all four fields within their length limits."]]);
  return <main className="assistant-studio">
    <Link href="/workspaces">Your workspaces</Link>
    <p>Platform administration · Settings</p><h1>Site Identity</h1>
    <p>These settings appear across all business workspaces.</p>
    {typeof notice === "string" && messages.has(notice) && <p role="status">{messages.get(notice)}</p>}
    <form key={current.version} action={saveIdentity.bind(null,current.version)}>
      <label>Platform name<input name="name" required maxLength={80} defaultValue={current.name}/></label>
      <label>Tagline<input name="tagline" required maxLength={160} defaultValue={current.tagline}/></label>
      <label>Page title<input name="title" required maxLength={120} defaultValue={current.title}/></label>
      <div><label htmlFor="identity-description">Search description</label>
        <textarea id="identity-description" name="description" required maxLength={320} defaultValue={current.description}/></div>
      <button>Save site identity</button>
    </form>
    <h2>Recent versions</h2>{data.length ? <ol>{data.map(row => <li key={row.version}>
      <details><summary>Version {row.version} · {row.edited} UTC</summary>
      <p>{row.name} · {row.tagline}</p><p>{row.title}</p><p>{row.description}</p></details>
    </li>)}</ol> : <p>Platform defaults are active.</p>}
  </main>;
}
export default function Page(props: Props) {
  return <Suspense fallback={<p>Loading settings…</p>}><Settings {...props}/></Suspense>;
}
