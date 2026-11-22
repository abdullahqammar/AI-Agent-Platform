"use client";
import { useActionState } from "react";
import { invite } from "./actions";
export function InviteForm({ business }: { business: string }) {
  const [result, action, busy] = useActionState((_previous: { message: string; link: string }, form: FormData) => invite(business, form), {
    message: "",
    link: "",
  });
  return (
    <form action={action}>
      <label>
        Recipient email
        <input name="email" type="email" required />
      </label>
      <label>
        Invitation role
        <select name="role">
          <option>Viewer</option>
          <option>Assistant manager</option>
        </select>
      </label>
      <button disabled={busy}>
        {busy ? "Creating…" : "Create invitation link"}
      </button>
      <p role="status">{result.message}</p>
      {result.link && (
        <label>
          Private invitation link
          <input
            readOnly
            value={window.location.origin + result.link}
            onFocus={(e) => e.target.select()}
          />
        </label>
      )}
    </form>
  );
}
