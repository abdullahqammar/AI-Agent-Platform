import assert from "node:assert/strict";
import test from "node:test";
import { assistantConfig, dentalExample, usesRetiredModel } from "../src/lib/assistant/config.ts";
import { generateAnswer } from "../src/lib/assistant/provider.ts";

test("assigned sources and history stay below the instruction boundary", async () => {
  const result = await generateAnswer(
    {
      ...dentalExample,
      knowledge: dentalExample.knowledge.map(source => ({
        ...source,
        shared: {
          id: "c44ce2ba-fd1c-46b2-b9fa-2c2c35bb158c",
          key: "99e2d937-05ed-45d8-a101-caa463fee9d0",
          revision: 1,
        },
      })),
    },
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
  assert.deepEqual(result.knowledgeIndexes, [0]);
  assert.equal(result.usage.outputTokens, 12);
  assert.equal(result.handoff, false);
});
test("retired local versions can be identified but cannot be executed", () => {
  const previous = { ...dentalExample, model: "qwen2.5:3b" };
  assert.equal(usesRetiredModel(previous), true);
  assert.equal(assistantConfig.safeParse(previous).success, false);
  const replacement = { ...previous, model: "qwen2.5:7b" };
  assert.equal(usesRetiredModel(replacement), false);
  assert.equal(assistantConfig.safeParse(replacement).success, true);
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

for (const model of ["qwen3.5:4b", "qwen2.5:7b"] as const) {
test(`${model} calls only loopback and receives no cloud credential`, async () => {
  const result = await generateAnswer({...dentalExample, model}, [], "Hours?", async (url, init) => {
    assert.equal(url, "http://127.0.0.1:11434/v1/chat/completions");
    assert.equal(new Headers(init?.headers).has("authorization"), false);
    const payload = JSON.parse(String(init?.body));
    assert.deepEqual(payload.messages.map((m: {role:string}) => m.role), ["system","user"]);
    assert.equal(payload.max_tokens,600);
    assert.equal(payload.model, model);
    return Response.json({choices:[{message:{content:'{"answer":"Weekdays.","handoff":false}'}}],
      usage:{prompt_tokens:36,completion_tokens:8}});
  }, "");
  assert.equal(result.usage.model,model);
});

}

test("Ollama failures distinguish connection, timeout and missing model", async () => {
  const config = { ...dentalExample, model: "qwen2.5:7b" } as const;
  await assert.rejects(generateAnswer(config, [], "Hello", async () => new Response(null, { status: 404 })), { reason: "modelMissing" });
  await assert.rejects(generateAnswer(config, [], "Hello", async () => { throw new TypeError("fetch failed"); }), { reason: "offline" });
  await assert.rejects(generateAnswer(config, [], "Hello", async () => { throw new DOMException("expired", "TimeoutError"); }), { reason: "timeout" });
});

test("testable retrieval order survives duplicate titles and the four-source fallback limit", async () => {
  const knowledge = Array.from({ length: 6 }, (_, index) => ({
    title: "Information", text: index === 5 ? "Returns accepted" : `Fact ${index}`,
  }));
  for (const [question, expected] of [["returns", [5]], ["hello", [0, 1, 2, 3]]] as const) {
    const result = await generateAnswer({ ...dentalExample, knowledge }, [], question, async (_url, init) => {
      const payload = JSON.parse(String(init?.body));
      const context = JSON.parse(payload.messages.at(-1).content);
      assert.deepEqual(context.assignedKnowledge, expected.map(index => knowledge[index]));
      return Response.json({ choices: [{ message: { content: '{"answer":"OK","handoff":false}' } }],
        usage: { prompt_tokens: 12, completion_tokens: 4 } });
    }, "test-only");
    assert.deepEqual(result.knowledgeIndexes, expected);
  }
});

test("installation check reports the selected approved tag and sends no customer data", async () => {
  const { checkLocalModel } = await import("../src/lib/assistant/provider.ts");
  const tags: typeof fetch = async (url, init) => {
    assert.equal(url, "http://127.0.0.1:11434/api/tags");
    assert.equal(init?.method, "GET");
    assert.equal(init?.redirect, "error");
    assert.equal(init?.body, undefined);
    assert.equal(init?.headers, undefined);
    return Response.json({ models: [{ name: "qwen3.5:4b" }, { name: "private-model" }] });
  };
  assert.equal(await checkLocalModel("qwen3.5:4b", tags), "installed");
  assert.equal(await checkLocalModel("qwen2.5:7b", tags), "missing");
  await assert.rejects(checkLocalModel("gpt-4.1-mini", tags), /Expected a local model/);
});

test("unreachable or invalid model listings do not report a missing model", async () => {
  const { checkLocalModel } = await import("../src/lib/assistant/provider.ts");
  for (const send of [async () => { throw new TypeError(); }, async () => new Response(null, {status: 503}), async () => Response.json({})]) {
    assert.equal(await checkLocalModel("qwen3.5:4b", send), "unavailable");
  }
});
