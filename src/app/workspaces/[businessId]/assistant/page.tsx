import { randomUUID } from "node:crypto";
import { latestFacts } from "../knowledge/library";
import { respond } from "../inbox/respond";
import Link from "next/link";
import { Fragment, Suspense } from "react";
import { notFound } from "next/navigation";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { TenantAccessDenied } from "@/db";
import { assistantConfig, businessTemplate, modelCatalog, usesRetiredModel } from "@/lib/assistant/config";
import { act } from "./actions";
import { Editor, SendMessage } from "./editor";
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
  const data = await asAssistantManager(businessId, async ({ tx, membershipId }) => {
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
          sql`select c.id,c.agent_version,c.needs_human,c.test_mode,c.closed_at,u.name from conversations c join customers u on u.id=c.customer_id where c.agent_id=${agent} and c.agent_version is not null order by c.created_at desc`,
        )
      : [];
    const selected = threads.find((t) => t.id === thread);
    const messages = selected
      ? await tx.execute(
          sql`select m.id,m.direction,m.body,m.knowledge_indexes,m.staff_membership_id,s.display_name from messages m left join business_memberships s on s.business_id=m.business_id and s.id=m.staff_membership_id where m.conversation_id=${thread} order by m.occurred_at,m.id`,
        )
      : [];
    const [assignment] = selected?.needs_human ? await tx.execute(sql`select id from conversation_assignments
      where business_id=${businessId} and conversation_id=${thread} and membership_id=${membershipId} and ended_at is null`) : [];
    const facts = await latestFacts(tx, businessId);
    return { agents, versions, threads, selected, messages, assignment, facts };
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
  const settings = row?.settings;
  const retired = usesRetiredModel(settings);
  const config = row ? assistantConfig.parse(retired ? { ...settings, model: "qwen2.5:7b" } : settings) : businessTemplate;
  const hasWithdrawnSource = config.knowledge.some(({ shared }) =>
    shared && data.facts.some(fact => fact.key === shared.key && fact.cutoff >= shared.revision));
  const formAction = act.bind(null, businessId);
  const staffAction = data.assignment && agent && thread ? respond.bind(null, businessId, agent, thread, String(data.assignment.id), randomUUID()) : undefined;
  const fields = (
    <>
      {agent && <input type="hidden" name="agent" value={agent} />}
      <input type="hidden" name="version" value={Number(row?.version ?? 1)} />
    </>
  );
  return (
    <main className="assistant-studio assistant-workbench">
      <Link href={`/dashboard?businessId=${businessId}`}>
        Workspace overview
      </Link>
      <h1>Business assistants</h1>
      <nav aria-label="Assistants">
        <Link href={base} aria-current={!agent ? "page" : undefined}>New assistant</Link>
        {data.agents.map((a) => (
          <Link key={String(a.id)} aria-current={a.id === agent ? "page" : undefined} href={base + "?agent=" + a.id}>
            {String(a.name)}
          </Link>
        ))}
      </nav>
      <div className="workbench-content">
      {query.conversationChanged && <p role="alert">The conversation or assistant access changed while sending. Review the conversation and send your message again.</p>}
      {query.knowledgeChanged && <p role="alert">The draft or its shared knowledge changed. Review the sources before saving or publishing again.</p>}
      {current && (
        <p>
          {current.published_version ? `${current.active ? "Enabled" : "Disabled"} · Published version ${current.published_version}` : "Draft · Ready for testing"}
        </p>
      )}
      {agent && <p className="version-model">Version {Number(row.version)} · {retired ? "Qwen2.5 3B (retired)" : modelCatalog[config.model].label}</p>}
      {thread && (
        <section className="chat-panel">
          <h2>Conversation with {String(data.selected?.name)}</h2>
          {data.messages.map(m => (
            <Fragment key={String(m.id)}>
            <p className={m.direction === "inbound" ? "customer-message" : "assistant-message"}>
              <strong>
                {m.staff_membership_id ? "Staff · " + String(m.display_name ?? "Workspace member") : m.direction === "inbound" ? "Customer" : "Assistant"}
              </strong>{" "}
              {String(m.body)}
            </p>
            {data.selected?.test_mode === true && data.selected.agent_version === row?.version && Array.isArray(m.knowledge_indexes) && m.knowledge_indexes.length > 0 && (
              <details className="test-knowledge">
                <summary>Knowledge sent with this reply ({m.knowledge_indexes.length})</summary>
                <dl>{m.knowledge_indexes.map((index: number) => {
                  const source = config.knowledge[index];
                  return source && <Fragment key={index}><dt>{source.title}</dt><dd>{source.text}</dd></Fragment>;
                })}</dl>
              </details>
            )}
            </Fragment>
          ))}
          {query.providerError && (
            <p role="alert">
              {query.providerError === "billing"
                ? "OpenAI reports exhausted API credit or quota. Your message was saved. Check API project billing before retrying."
                : query.providerError === "modelMissing"
                ? `Ollama could not find ${config.model}. Check ollama list on the computer running AgentFlow. Select an installed model, save a draft and start a new test.`
                : query.providerError === "offline"
                ? `AgentFlow could not reach Ollama. Open Ollama on the computer running AgentFlow and check that ollama list shows ${config.model}.`
                : query.providerError === "timeout"
                ? "Ollama took longer than 90 seconds. Try a shorter message after the model has loaded."
                : modelCatalog[config.model].provider === "ollama"
                ? `Ollama could not return a usable reply. Your message was saved. Test ${config.model} directly in Ollama, then send a message again.`
                : "OpenAI could not return a reply. Check the server’s OpenAI API key and provider availability, or save a draft using local Ollama."}
            </p>
          )}
          {query.staffNotice && <p role="alert">{query.staffNotice === "empty" ? "Enter a reply of up to 3,000 characters." : "The assignment changed. Check the queue before replying."}</p>}
          {data.selected?.closed_at ? <p>Resolved by staff</p> : data.selected?.needs_human ? (
            <>
              <p>Awaiting staff follow-up</p>
              {staffAction ? <>
                <form action={staffAction}>
                  <label>Staff reply<textarea name="body" required maxLength={3000} /></label>
                  <button name="action" value="reply">Save in-app reply</button>
                </form>
                <form action={staffAction}>
                  <button name="action" value="resolve">Resolve and close conversation</button>
                </form>
              </> : <Link href={`/workspaces/${businessId}/inbox`}>Manage assignment</Link>}
            </>
          ) : (
            <form action={formAction}>
              {fields}
              <input type="hidden" name="thread" value={thread} />
              <label>
                Message
                <textarea name="message" required maxLength={3000} />
              </label>
              <SendMessage disabled={retired} />
              <button name="action" value="handoff" formNoValidate>
                Request staff handoff
              </button>
            </form>
          )}
        </section>
      )}
      <details className="studio-card" key={agent ?? "new"} open={!agent}>
        <summary>{agent ? "Edit configuration and knowledge" : "Create an assistant"}</summary>
      <form action={formAction}>
        {fields}
        {retired && <p>This version used Qwen2.5 3B. Choose an available model, save a new draft and test it before publishing.</p>}
        <Editor key={String(agent) + String(row?.version)} initial={config} facts={data.facts} businessId={businessId} />
      </form>
      </details>
      {agent && <>
      <section className="studio-card">
          <h2>Start a conversation</h2>
          <form action={formAction}>
            {fields}
            <label>
              Customer name
              <input name="customer" placeholder="e.g. Demo customer" required maxLength={120} />
            </label>
            <button name="action" value="test" disabled={retired}>
              Start version test
            </button>
            <button
              name="action"
              value="chat"
              disabled={
                retired || !current?.active || current.published_version !== row.version
              }
            >
              Start published conversation
            </button>
          </form>
      </section>
      <section className="studio-card">
        <h2>Publishing</h2>
        <form action={formAction}>
            {fields}
            <p>
              {hasWithdrawnSource ? "Replace retired knowledge in a new draft and test it before publishing." : current?.tested_version === row.version ? "This version has completed a test reply." : "Get a successful test reply to unlock publishing."}
            </p>
            <button
              name="action"
              value="publish"
              disabled={retired || hasWithdrawnSource || current?.tested_version !== row.version}
            >
              Publish and enable
            </button>
            <button name="action" value="disable" disabled={!current?.active}>
              Disable
            </button>
          </form>
      </section>
      <details className="studio-card"><summary>Conversation history ({data.threads.length})</summary>
          <ul>
            {data.threads.map((t) => (
              <li key={String(t.id)}>
                <Link href={base + "?agent=" + agent + "&thread=" + t.id}>
                  {String(t.name)} · {t.test_mode ? "Test" : "Published"} ·{" "}
                  {t.closed_at ? "Resolved" : t.needs_human ? "Needs staff" : "Open"}
                </Link>
              </li>
            ))}
          </ul>
      </details>
      <details className="studio-card"><summary>Version history</summary>

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
      </details>
      </>}
      </div>
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
