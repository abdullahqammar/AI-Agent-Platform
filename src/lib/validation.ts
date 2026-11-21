import { z } from "zod";

export const credentials = z.object({
  email: z.email().max(254),
  password: z.string().min(8, "Use at least 8 characters.").max(128),
});

export const registration = credentials.extend({
  name: z.string().trim().min(1, "Enter your name.").max(100),
});

export const onboarding = z.strictObject({
  businessName: z.string().trim().min(1, "Enter a business name.").max(160),
  timezone: z.string().refine((value) => {
    if (value !== "UTC" && (!value.includes("/") || /^(posix|right)\//.test(value))) return false;
    try { new Intl.DateTimeFormat("en", { timeZone: value }); return true; }
    catch { return false; }
  }, "Select a valid IANA timezone."),
  locationName: z.string().trim().min(1, "Enter a location name.").max(160),
  address: z.string().trim().max(500).optional(),
});
