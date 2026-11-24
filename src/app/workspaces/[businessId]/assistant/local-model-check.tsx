"use client";

import { useState } from "react";

export function LocalModelCheck({ businessId, model }: { businessId: string; model: string }) {
  const [status, setStatus] = useState("");
  async function check() {
    setStatus("checking");
    try {
      const response = await fetch(`/api/workspaces/${businessId}/local-model?model=${encodeURIComponent(model)}`, { cache: "no-store" });
      if (!response.ok) { setStatus("failed"); return; }
      const result = await response.json();
      setStatus(result.status);
    } catch { setStatus("failed"); }
  }
  const messages: Record<string, string> = {
    checking: "Checking Ollama…",
    installed: `Ollama lists ${model} as installed. Test a conversation to verify a reply.`,
    missing: `Ollama is running, but ${model} is missing. Choose an installed, supported model.`,
    unavailable: "Could not read the Ollama model list. Open Ollama on the computer running AgentFlow and retry.",
    failed: "The check could not finish. Refresh this workspace and try again.",
  };
  return <div>
    <button type="button" disabled={status === "checking"} onClick={check}>Check local model</button>
    <p role="status" aria-live="polite">{messages[status]}</p>
  </div>;
}
