"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function Logout() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <div><button className="secondary" disabled={busy} onClick={async () => {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/sign-out", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!response.ok) throw new Error();
      router.replace("/login");
      router.refresh();
    } catch { setError("Sign out failed. Please retry."); setBusy(false); }
  }}>{busy ? "Signing out…" : "Sign out"}</button>{error && <p role="alert" className="form-error">{error}</p>}</div>;
}
