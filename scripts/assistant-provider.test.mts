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
