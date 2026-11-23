import assert from "node:assert/strict";
import test from "node:test";
import { assistantConfig, dentalExample } from "../src/lib/assistant/config.ts";
import { generateAnswer } from "../src/lib/assistant/provider.ts";

test("assigned sources and history stay below the instruction boundary", async () => {
  const result = await generateAnswer(
    dentalExample,
    [],
    "When are you open?",
    async (url, init) => {
      assert.equal(url, "https://api.openai.com/v1/chat/completions");
      const payload = JSON.parse(String(init?.body));
      assert.equal(payload.messages[0].role, "system");
      assert.equal(payload.messages[2].role, "user");
      assert.deepEqual(
        JSON.parse(payload.messages[2].content).assignedKnowledge,
        [dentalExample.knowledge[0]],
      );
      return Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                answer: "Monday to Friday, 9 to 5.",
                handoff: false,
              }),
            },
          },
        ],
        usage: { prompt_tokens: 90, completion_tokens: 12 },
      });
    },
    "test-only",
  );
  assert.equal(result.usage.outputTokens, 12);
  assert.equal(result.handoff, false);
});
test("model allowlist rejects workspace-selected endpoints and unknown models", () => {
  assert.equal(
    assistantConfig.safeParse({ ...dentalExample, model: "unapproved" })
      .success,
    false,
  );
  assert.equal(
    assistantConfig.safeParse({
      ...dentalExample,
      endpoint: "https://example.org",
    }).success,
    false,
  );
});
test("provider failures and unauthorized tool-shaped output fail closed", async () => {
  await assert.rejects(
    generateAnswer(
      dentalExample,
      [],
      "Hi",
      async () => new Response("", { status: 429 }),
      "test-only",
    ),
  );
  await assert.rejects(
    generateAnswer(
      dentalExample,
      [],
      "Hi",
      async () =>
        Response.json({
          choices: [{ message: { content: '{"execute":"sql"}' } }],
        }),
      "test-only",
    ),
  );
});

test("exhausted billing credit is distinct from transient rate limiting", async () => {
  const { ProviderCreditsExhausted } = await import("../src/lib/assistant/provider.ts");
  for (const code of ["credit_balance_exhausted", "insufficient_quota", "rate_limit_exceeded"]) {
    await assert.rejects(generateAnswer(dentalExample, [], "Hello", async () =>
      Response.json({ error: { code } }, { status: 429 }), "test-only"),
      error => error instanceof Error && (error instanceof ProviderCreditsExhausted) === (code !== "rate_limit_exceeded"));
  }
});

test("local model calls only loopback and receives no cloud credential", async () => {
  const result = await generateAnswer({...dentalExample, model:"qwen2.5:3b"}, [], "Hours?", async (url, init) => {
    assert.equal(url, "http://127.0.0.1:11434/v1/chat/completions");
    assert.equal(new Headers(init?.headers).has("authorization"), false);
    const payload = JSON.parse(String(init?.body));
    assert.deepEqual(payload.messages.map((m: {role:string}) => m.role), ["system","user"]);
    assert.equal(payload.max_tokens,600);
    return Response.json({choices:[{message:{content:'{"answer":"Weekdays.","handoff":false}'}}],
      usage:{prompt_tokens:36,completion_tokens:8}});
  }, "");
  assert.equal(result.usage.model,"qwen2.5:3b");
});
