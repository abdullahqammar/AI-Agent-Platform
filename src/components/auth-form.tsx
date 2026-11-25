"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { credentials, registration } from "@/lib/validation";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const registering = mode === "register";
  return <>
    <h1>{registering ? "Create your account" : "Welcome back"}</h1>
    <p className="intro">{registering ? "Start with your account. Set up your business next." : "Sign in to your business workspace."}</p>
    <form onSubmit={async (event) => {
      event.preventDefault();
      if (busy) return;
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const parsed = (registering ? registration : credentials).safeParse(values);
      if (!parsed.success) { setMessage(parsed.error.issues[0].message); return; }
      setBusy(true); setMessage("");
      try {
        const response = await fetch("/api/auth/" + (registering ? "sign-up/email" : "sign-in/email"), {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data),
        });
        if (!response.ok) {
          setMessage(response.status === 429 ? "Too many attempts. Please wait and try again." : registering
            ? "Unable to register. Check your details or sign in if you already have an account."
            : "Unable to sign in. Check your email and password.");
          setBusy(false); return;
        }
        setSuccess(true);
        router.replace("/dashboard");
        router.refresh();
      } catch { setMessage("Unable to connect. Please try again."); setBusy(false); }
    }}>
      {registering && <label>Your name<input name="name" autoComplete="name" required maxLength={100} /></label>}
      <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
      <label>Password<input name="password" type="password" autoComplete={registering ? "new-password" : "current-password"} required minLength={8} maxLength={128} />{registering && <span className="hint">Use at least 8 characters.</span>}</label>
      {message && <p role="alert" className="form-error">{message}</p>}
      {success && <p role="status">Signed in. Opening your workspace…</p>}
      <button className="primary" disabled={busy}>{busy ? "Please wait…" : registering ? "Create account" : "Sign in"}</button>
    </form>
    <p className="form-switch">{registering ? "Already have an account? " : "Need an account? "}<Link href={registering ? "/login" : "/register"}>{registering ? "Sign in" : "Create an account"}</Link></p>
  </>;
}
