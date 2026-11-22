import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { TenantAccessDenied } from "@/db";
import { assistantConfig, businessTemplate } from "@/lib/assistant/config";
import { act } from "./actions";
import { Editor } from "./editor";
import { asAssistantManager } from "./store";

type Props = PageProps<"/workspaces/[businessId]/assistant">;
async function Studio({ params, searchParams }: Props) {
  const { businessId } = await params;
  const query = await searchParams;
  const ids = z
    .object({
      agent: z.uuid().optional(),
      thread: z.uuid().optional(),
      version: z.coerce.number().int().positive().optional(),
    })
    .safeParse(query);
  if (!ids.success) notFound();
  const { agent, thread, version } = ids.data;
  const base = `/workspaces/${businessId}/assistant`;
  const data = await asAssistantManager(businessId, async ({ tx }) => {
    const agents = await tx.execute(
      sql`select id,name,active,published_version,tested_version from agents order by created_at`,
    );
    const versions = agent
      ? await tx.execute(
          sql`select version,settings from agent_configurations where agent_id=${agent} order by version desc`,
        )
      : [];
    const threads = agent
      ? await tx.execute(
          sql`select c.id,c.agent_version,c.needs_human,c.test_mode,u.name from conversations c join customers u on u.id=c.customer_id where c.agent_id=${agent} and c.agent_version is not null order by c.created_at desc`,
        )
      : [];
    const selected = threads.find((t) => t.id === thread);
    const messages = selected
      ? await tx.execute(
          sql`select direction,body from messages where conversation_id=${thread} order by occurred_at,id`,
        )
      : [];
    return { agents, versions, threads, selected, messages };
  }).catch((error) => {
    if (error instanceof TenantAccessDenied) notFound();
    throw error;
  });
  const current = data.agents.find((a) => a.id === agent);
  const row =
    data.versions.find(
      (v) => v.version === (data.selected?.agent_version ?? version),
    ) ?? data.versions[0];
  if ((agent && !current) || (thread && !data.selected)) notFound();
  const config = row ? assistantConfig.parse(row.settings) : businessTemplate;
  const formAction = act.bind(null, businessId);
  const fields = (
    <>
      {agent && <input type="hidden" name="agent" value={agent} />}
      <input type="hidden" name="version" value={Number(row?.version ?? 1)} />
    </>
  );
  return (
    <main className="assistant-studio">
      <Link href={`/dashboard?businessId=${businessId}`}>
        Workspace overview
      </Link>
      <h1>Business assistants</h1>
      <nav>
        <Link href={base}>New assistant</Link>
        {data.agents.map((a) => (
          <Link key={String(a.id)} href={base + "?agent=" + a.id}>
            {String(a.name)}
          </Link>
        ))}
      </nav>
      {current && (
        <p>
          {current.active ? "Enabled" : "Disabled"} · Published version{" "}
          {String(current.published_version ?? "none")}
        </p>
      )}
      <form action={formAction}>
        {fields}
        <Editor key={String(agent) + String(row?.version)} initial={config} />
        <button name="action" value="save">
          Save new draft version
        </button>
      </form>
      {agent && (
        <>
          <h2>Version history</h2>
          <nav>
            {data.versions.map((v) => (
              <Link
                key={Number(v.version)}
                href={base + "?agent=" + agent + "&version=" + v.version}
              >
                Version {Number(v.version)}
              </Link>
            ))}
          </nav>
          <form action={formAction}>
            {fields}
            <p>
              Selected version {Number(row.version)}. Save a historical version
              as a new draft to restore it.
            </p>
            <button
              name="action"
              value="publish"
              disabled={current?.tested_version !== row.version}
            >
              Publish and enable
            </button>
            <button name="action" value="disable">
              Disable
            </button>
          </form>
          <h2>Conversations</h2>
          <form action={formAction}>
            {fields}
            <label>
              Customer name
              <input name="customer" required maxLength={120} />
            </label>
            <button name="action" value="test">
              Start version test
            </button>
            <button
              name="action"
              value="chat"
              disabled={
                !current?.active || current.published_version !== row.version
              }
            >
              Start published conversation
            </button>
          </form>
          <ul>
            {data.threads.map((t) => (
              <li key={String(t.id)}>
                <Link href={base + "?agent=" + agent + "&thread=" + t.id}>
                  {String(t.name)} · {t.test_mode ? "Test" : "Published"} ·{" "}
                  {t.needs_human ? "Needs staff" : "Open"}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      {thread && (
        <section>
          <h2>Conversation with {String(data.selected?.name)}</h2>
          {data.messages.map((m, i) => (
            <p key={i}>
              <strong>
                {m.direction === "inbound" ? "Customer" : "Assistant"}
              </strong>{" "}
              {String(m.body)}
            </p>
          ))}
          {query.providerError && (
            <p role="alert">
              Provider unavailable. Your message was saved. Check provider
              settings before retrying.
            </p>
          )}
          {data.selected?.needs_human ? (
            <p>Awaiting staff follow-up</p>
          ) : (
            <form action={formAction}>
              {fields}
              <input type="hidden" name="thread" value={thread} />
              <label>
                Message
                <textarea name="message" required maxLength={3000} />
              </label>
              <button name="action" value="send">
                Send
              </button>
              <button name="action" value="handoff" formNoValidate>
                Request staff handoff
              </button>
            </form>
          )}
        </section>
      )}
    </main>
  );
}
export default function Page(props: Props) {
  return (
    <Suspense fallback={<p>Loading assistants…</p>}>
      <Studio {...props} />
    </Suspense>
  );
}
