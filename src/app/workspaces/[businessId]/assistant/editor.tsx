"use client";
import { useState } from "react";
import {
  businessTemplate,
  dentalExample,
  type AssistantConfig,
} from "@/lib/assistant/config";

export function Editor({ initial }: { initial: AssistantConfig }) {
  const [config, set] = useState(initial);
  return (
    <fieldset>
      <legend>Draft instructions and sources</legend>
      <label>
        Load template{" "}
        <select
          defaultValue=""
          onChange={(e) => {
            if (e.target.value)
              set(
                structuredClone(
                  e.target.value === "example"
                    ? dentalExample
                    : businessTemplate,
                ),
              );
          }}
        >
          <option value="">Choose a template</option>
          <option value="business">General business</option>
          <option value="example">Example dental clinic</option>
        </select>
      </label>
      {(
        [
          "name",
          "businessProfile",
          "role",
          "purpose",
          "instructions",
          "policies",
          "tone",
          "language",
          "escalation",
        ] as const
      ).map((key) => (
        <label key={key}>
          {key === "businessProfile" ? "Business profile" : key}
          <textarea
            required
            maxLength={2000}
            value={config[key]}
            onChange={(e) => set({ ...config, [key]: e.target.value })}
          />
        </label>
      ))}
      <p>Approved model · {config.model}</p>
      <label>
        <input
          type="checkbox"
          checked={config.allowHandoff}
          onChange={(e) => set({ ...config, allowHandoff: e.target.checked })}
        />{" "}
        Allow the assistant to request staff handoff
      </label>
      {config.knowledge.map((source, index) => (
        <fieldset key={index}>
          <legend>Assigned source {index + 1}</legend>
          {(["title", "text"] as const).map((key) => (
            <label key={key}>
              {key}
              <textarea
                required
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
