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

export function Editor({ initial }: { initial: AssistantConfig }) {
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
      {config.knowledge.map((source, index) => (
        <fieldset key={index}>
          <legend>Assigned source {index + 1}</legend>
          {(["title", "text"] as const).map((key) => (
            <label key={key}>
              {key === "title" ? "Source name" : "Information"}
              <textarea
                required
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
      ))}
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
