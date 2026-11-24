"use client";
import { approvedModel, modelCatalog } from "@/lib/assistant/config";
import { useFormStatus } from "react-dom";
import { useState } from "react";
import {
  businessTemplate,
  dentalExample,
  type AssistantConfig,
} from "@/lib/assistant/config";

export function SendMessage({ disabled }: { disabled: boolean }) {
  const { pending, data } = useFormStatus();
  return <button name="action" value="send" disabled={disabled || pending} aria-live="polite">
    {pending && data?.get("action") === "send" ? "Waiting for reply…" : "Send"}
  </button>;
}

type Fact = { id: string; key: string; revision: number; title: string; body: string };
function snapshot(fact: Fact) {
  return { title: fact.title, text: fact.body, shared: { id: fact.id, key: fact.key, revision: fact.revision } };
}

export function Editor({ initial, facts, libraryPath }: { initial: AssistantConfig; facts: Fact[]; libraryPath: string }) {
  const [config, set] = useState(initial);
  const labels = {
    name: "Assistant name", businessProfile: "Business profile", role: "Role", purpose: "Responsibilities",
    instructions: "Instructions", policies: "Business policies", tone: "Tone", language: "Language", escalation: "Handoff rules",
  };
  function field(key: keyof typeof labels) {
    return <label key={key}>{labels[key]}
      <textarea required maxLength={2000} value={config[key]}
        onChange={event => set({ ...config, [key]: event.target.value })} />
    </label>;
  }
  return (
    <fieldset className="editor-fields">
      <legend>Assistant configuration</legend>
      <label>
        Load template{" "}
        <select
          defaultValue=""
          onChange={(e) => {
            if (!e.target.value) return;
            const template = e.target.value === "example" ? dentalExample : businessTemplate;
            set({ ...structuredClone(template), model: config.model });
          }}
        >
          <option value="">Choose a template</option>
          <option value="business">General business</option>
          <option value="example">Example dental clinic</option>
        </select>
      </label>
      <div className="identity-grid">
        {(["name", "businessProfile", "role", "purpose"] as const).map(key => field(key))}
      </div>
      <details className="behavior-fields">
        <summary>Instructions, tone and handoff rules</summary>
        {(["instructions", "policies", "tone", "language", "escalation"] as const).map(key => field(key))}
      </details>
      <label>Model
        <select aria-label="Model" value={config.model} onChange={event => set({...config, model: approvedModel.parse(event.target.value)})}>
          {approvedModel.options.map(model => <option key={model} value={model}>{modelCatalog[model].label}</option>)}
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={config.allowHandoff}
          onChange={(e) => set({ ...config, allowHandoff: e.target.checked })}
        />{" "}
        Allow the assistant to request staff handoff
      </label>
      <h2>Business knowledge</h2>
      <label>Add a workspace fact
        <select aria-label="Add a workspace fact" value="" disabled={config.knowledge.length >= 12}
          onChange={event => {
            const fact = facts.find(item => item.id === event.target.value);
            if (fact) set({ ...config, knowledge: [...config.knowledge, snapshot(fact)] });
          }}>
          <option value="">Choose a shared fact</option>
          {facts.filter(fact => !config.knowledge.some(source => source.shared?.key === fact.key)).map(fact =>
            <option key={fact.id} value={fact.id}>{fact.title} · revision {fact.revision}</option>)}
        </select>
      </label>
      <a href={libraryPath}>Manage shared knowledge</a>
      {config.knowledge.map((source, index) => {
        const latest = source.shared && facts.find(fact => fact.key === source.shared?.key);
        return (
          <fieldset key={index}>
            <legend>Assigned source {index + 1}</legend>
            {source.shared && <p>Shared fact · revision {source.shared.revision}</p>}
            {latest && latest.id !== source.shared?.id && <button type="button" onClick={() => set({
              ...config, knowledge: config.knowledge.map((item, i) => i === index ? snapshot(latest) : item),
            })}>Use revision {latest.revision} of {latest.title}</button>}
            {(["title", "text"] as const).map((key) => (
              <label key={key}>
                {key === "title" ? "Source name" : "Information"}
                <textarea
                  required
                  readOnly={Boolean(source.shared)}
                  aria-label={key === "title" ? "Source name" : "Information"}
                  value={source[key]}
                  maxLength={key === "title" ? 2000 : 6000}
                  onChange={(e) =>
                    set({
                      ...config,
                      knowledge: config.knowledge.map((s, i) =>
                        i === index ? { ...s, [key]: e.target.value } : s,
                      ),
                    })
                  }
                />
              </label>
            ))}
            <button
              type="button"
              disabled={config.knowledge.length === 1}
              onClick={() =>
                set({
                  ...config,
                  knowledge: config.knowledge.filter((_, i) => i !== index),
                })
              }
            >
              Remove source
            </button>
          </fieldset>
        );
      })}
      <button
        type="button"
        disabled={config.knowledge.length >= 12}
        onClick={() =>
          set({
            ...config,
            knowledge: [...config.knowledge, { title: "", text: "" }],
          })
        }
      >
        Add source
      </button>
      <input type="hidden" name="config" value={JSON.stringify(config)} />
    </fieldset>
  );
}
