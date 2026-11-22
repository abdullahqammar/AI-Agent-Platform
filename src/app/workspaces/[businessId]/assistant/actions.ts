"use server";
import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assistantConfig } from "@/lib/assistant/config";
import { generateAnswer } from "@/lib/assistant/provider";
import { asAssistantManager } from "./store";

export async function act(business: string, form: FormData) {
  const action = z
    .enum(["save", "publish", "disable", "test", "chat", "send", "handoff"])
    .parse(form.get("action"));
  let agent = z.uuid().nullable().parse(form.get("agent"));
  let thread = z.uuid().nullable().parse(form.get("thread"));
  let notice = "";
  await asAssistantManager(business, async ({ tx, membershipId }) => {
    const audit = (event: string, target: string) =>
      tx.execute(sql`insert into audit_events(business_id,membership_id,action,target_id)
      values(${business},${membershipId},${event},${target})`);
    if (!agent && action !== "save") throw Error("Agent required");
    const [current] = agent
      ? await tx.execute(
          sql`select * from agents where id=${agent} and business_id=${business} for update`,
        )
      : [];
    if (agent && !current) throw Error("Agent unavailable");
    if (action === "save") {
      const config = assistantConfig.parse(
        JSON.parse(z.string().max(90000).parse(form.get("config"))),
      );
      if (!agent) {
        const [row] = await tx.execute(
          sql`insert into agents(business_id,name,active) values(${business},${config.name},false) returning id`,
        );
        agent = String(row.id);
      }
      await tx.execute(sql`insert into agent_configurations(business_id,agent_id,version,identity,instructions,tone,languages,settings)
        select ${business},${agent},coalesce(max(version),0)+1,${config.role},${config.instructions},${config.tone},ARRAY[${config.language}]::text[],${JSON.stringify(config)}::jsonb
        from agent_configurations where agent_id=${agent}`);
      await audit("assistant.draft.saved", agent);
      return;
    }
    if (!current || !agent) throw Error("Agent unavailable");
    const version = z.coerce
      .number()
      .int()
      .positive()
      .parse(form.get("version"));
    const [row] = await tx.execute(
      sql`select settings from agent_configurations where agent_id=${agent} and version=${version}`,
    );
    if (!row) throw Error("Version unavailable");
    const config = assistantConfig.parse(row.settings);
    if (action === "publish" || action === "disable") {
      if (action === "publish") {
        if (current.tested_version !== version)
          throw Error("Test this version successfully before publishing");
        await tx.execute(
          sql`update agents set name=${config.name},active=true,published_version=${version} where id=${agent}`,
        );
      } else
        await tx.execute(sql`update agents set active=false where id=${agent}`);
      await audit("assistant." + action, agent);
      return;
    }
    if (action === "test" || action === "chat") {
      if (
        action === "chat" &&
        (!current.active || current.published_version !== version)
      )
        throw Error("Version unavailable");
      const [channel] =
        await tx.execute(sql`insert into channel_connections(business_id,provider,external_account_id)
        values(${business},'in-app',${business}) on conflict(provider,external_account_id) do update set provider=excluded.provider returning id`);
      const channelId = String(channel.id);
      await tx.execute(
        sql`insert into agent_channels(business_id,agent_id,channel_id) values(${business},${agent},${channelId}) on conflict do nothing`,
      );
      const name = z
        .string()
        .trim()
        .min(1)
        .max(120)
        .parse(form.get("customer"));
      const [customer] = await tx.execute(
        sql`insert into customers(business_id,name) values(${business},${name}) returning id`,
      );
      const [created] =
        await tx.execute(sql`insert into conversations(business_id,customer_id,channel_id,agent_id,agent_version,test_mode)
        values(${business},${String(customer.id)},${channelId},${agent},${version},${action === "test"}) returning id`);
      thread = String(created.id);
      await audit("assistant.conversation.started", thread);
      return;
    }
    if (!thread) throw Error("Conversation required");
    const [conversation] = await tx.execute(
      sql`select * from conversations where id=${thread} and agent_id=${agent} and agent_version=${version} for update`,
    );
    if (!conversation || conversation.needs_human)
      throw Error("Conversation unavailable");
    if (action === "handoff") {
      await tx.execute(
        sql`update conversations set needs_human=true where id=${thread}`,
      );
      await audit("assistant.handoff.requested", thread);
      return;
    }
    if (
      !conversation.test_mode &&
      (!current.active || current.published_version !== version)
    )
      throw Error("Version inactive");
    const message = z
      .string()
      .trim()
      .min(1)
      .max(3000)
      .parse(form.get("message"));
    const context = await tx.execute<{ direction: string; body: string }>(
      sql`select direction,body from messages where conversation_id=${thread} order by occurred_at desc,id desc limit 12`,
    );
    const append = (
      direction: "inbound" | "outbound",
      body: string,
      usage: object | null,
    ) =>
      tx.execute(sql`insert into messages(business_id,conversation_id,channel_id,direction,body,usage,occurred_at)
      values(${business},${thread},${String(conversation.channel_id)},${direction},${body},${JSON.stringify(usage)}::jsonb,clock_timestamp())`);
    await append("inbound", message, null);
    let result;
    try {
      result = await generateAnswer(config, [...context].reverse(), message);
    } catch {
      await audit("assistant.provider.failed", thread);
      notice =
        "Provider unavailable. Your message was saved. Retry after checking provider settings.";
      return;
    }
    await append("outbound", result.answer, result.usage);
    if (conversation.test_mode)
      await tx.execute(
        sql`update agents set tested_version=${version} where id=${agent}`,
      );
    if (result.handoff && config.allowHandoff) {
      await tx.execute(
        sql`update conversations set needs_human=true where id=${thread}`,
      );
      await audit("assistant.handoff.requested", thread);
    }
  });
  const params = new URLSearchParams({ agent: String(agent) });
  if (thread) params.set("thread", thread);
  if (notice) params.set("providerError", "1");
  redirect(`/workspaces/${business}/assistant?${params}`);
}
