import { z } from "zod";

export const approvedModel = z.enum(["gpt-4.1-mini", "qwen2.5:3b"]);

const field = z.string().trim().min(1).max(2000);
export const assistantConfig = z.strictObject({
  name: field,
  businessProfile: field,
  role: field,
  purpose: field,
  instructions: field,
  policies: field,
  tone: field,
  language: field,
  escalation: field,
  knowledge: z
    .array(
      z.strictObject({
        title: field,
        text: z.string().trim().min(1).max(6000),
      }),
    )
    .min(1)
    .max(12),
  allowHandoff: z.boolean(),
  model: approvedModel,
});
export type AssistantConfig = z.infer<typeof assistantConfig>;
export const businessTemplate: AssistantConfig = {
  name: "AI Business Assistant",
  businessProfile: "Describe this business.",
  role: "Customer support",
  purpose: "Answer questions using the assigned sources.",
  instructions: "Ask for clarification when needed.",
  policies: "Only describe services documented by the business.",
  tone: "Friendly and concise",
  language: "English",
  escalation:
    "Refer unsupported requests and requests requiring staff approval to a human.",
  allowHandoff: true,
  model: "gpt-4.1-mini",
  knowledge: [
    {
      title: "Business information",
      text: "Add verified business information before publishing.",
    },
  ],
};
export const dentalExample: AssistantConfig = {
  ...businessTemplate,
  businessProfile: "Example Dental Studio (demonstration)",
  knowledge: [
    { title: "Hours", text: "Open Monday to Friday from 9 am to 5 pm." },
    {
      title: "Services",
      text: "We offer cleanings, checkups and restorative consultations.",
    },
    {
      title: "Appointments",
      text: "Staff handle appointment inquiries. Ask for the preferred day and hand the request to staff. No appointment is confirmed in chat.",
    },
  ],
};
