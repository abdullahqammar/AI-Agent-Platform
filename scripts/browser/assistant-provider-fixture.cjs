// Explicit local browser-test fixture. Keep actual provider credentials out of the test process.
if (
  process.env.AGENTFLOW_OPENAI_KEY !== "simulation-only" ||
  process.env.NODE_ENV === "production"
) {
  throw new Error(
    "This fixture requires a local development server and the simulation-only marker.",
  );
}
const originalFetch = globalThis.fetch;
globalThis.fetch = async function simulatedProvider(resource, init) {
  const url =
    typeof resource === "string"
      ? resource
      : (resource.url ?? String(resource));
  if (url === "http://127.0.0.1:11434/v1/chat/completions")
    return Response.json({ error: { message: "model not found" } }, {status: 404});
  if (url !== "https://api.openai.com/v1/chat/completions")
    return originalFetch(resource, init);
  const payload = JSON.parse(init?.body ?? (await resource.clone().text()));
  const context = JSON.parse(payload.messages.at(-1).content);
  const handoff = context.customerMessage.includes("appointment");
  const answer = handoff
    ? "A staff member must review your request."
    : context.assignedKnowledge.find((s) => s.title === "Hours").text;
  return Response.json({
    choices: [{ message: { content: JSON.stringify({ answer, handoff }) } }],
    usage: { prompt_tokens: 20, completion_tokens: 10 },
  });
};
