"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { onboarding } from "@/lib/validation";
export function OnboardingForm({ timezones }: { timezones: string[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return <form onSubmit={async (event) => {
    event.preventDefault();
    if (busy) return;
    const input = onboarding.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!input.success) { setMessage(input.error.issues[0].message); return; }
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/workspace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input.data) });
      if (response.status === 401) { router.replace("/login"); router.refresh(); return; }
      if (!response.ok) { setMessage("Unable to create your workspace. Check your details and try again."); setBusy(false); return; }
      setMessage("Workspace created. Opening your dashboard…");
      router.replace("/dashboard");
      router.refresh();
    } catch { setMessage("Unable to connect. Please try again."); setBusy(false); }
  }}>
    <label>Business name<input name="businessName" required maxLength={160} placeholder="Your business name" /></label>
    <label>Business timezone<select name="timezone" required defaultValue=""><option value="" disabled>Select a timezone</option>{timezones.map(zone => <option key={zone} value={zone}>{zone}</option>)}</select><span className="hint">Used for your business and its first location.</span></label>
    <label>Location name<input name="locationName" required maxLength={160} placeholder="e.g. Main office" /></label>
    <label>Address <span className="optional">(optional)</span><textarea name="address" maxLength={500} rows={2} autoComplete="street-address" /></label>
    {message && <p role={busy ? "status" : "alert"} className={busy ? "" : "form-error"}>{message}</p>}
    <button className="primary" disabled={busy}>{busy ? "Creating workspace…" : "Create workspace"}</button>
  </form>;
}
