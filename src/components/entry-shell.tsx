import { Brand } from "./brand";
import { publicIdentity } from "@/lib/platform-identity";
export async function EntryShell({ children }: { children: React.ReactNode }) {
  const {tagline} = await publicIdentity();
  return <main className="entry">
    <aside className="entry-story"><Brand /><div className="entry-story-copy"><h1>A workspace for your business assistants.</h1><p>Bring your team, knowledge and customer conversations together.</p></div><p className="entry-footer">{tagline}</p></aside>
    <section className="entry-content"><div className="mobile-brand"><Brand /></div><div className="entry-form">{children}</div></section>
  </main>;
}
