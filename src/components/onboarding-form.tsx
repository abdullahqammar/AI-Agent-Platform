"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onboarding } from "@/lib/validation";
export function OnboardingForm({ timezones, additional = false }: { timezones: string[], additional?: boolean }) {
  const key = useRef<string | null>(null);
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
      if (additional) key.current ??= crypto.randomUUID();
      const response = await fetch("/api/workspace", { method: "POST", headers: { "Content-Type": "application/json", ...(key.current ? { "Idempotency-Key": key.current } : {}) }, body: JSON.stringify(input.data) });
      if (response.status === 401) { router.replace("/login"); router.refresh(); return; }
      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        const reason = response.status === 403
          ? "Open AgentFlow at the address configured in BETTER_AUTH_URL and try again."
          : detail?.error;
        setMessage(typeof reason === "string" ? reason : `Workspace creation failed (HTTP ${response.status}).`);
        setBusy(false);
        return;
      }
      setMessage("Workspace created. Opening your dashboard…");
      const { businessId } = await response.json();
      router.replace(additional ? `/dashboard?businessId=${encodeURIComponent(businessId)}` : "/dashboard");
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
