"use client";
import { useActionState } from "react";
import { respond } from "./actions";
export function RespondForm({ business }: { business: string }) {
  const [message, action, busy] = useActionState(
    async (previous: string, form: FormData) => {
      form.set("token", window.location.hash.slice(1));
      return respond(business, previous, form);
    },
    "",
  );
  return (
    <form action={action}>
      <button name="decision" value="accept" disabled={busy}>
        Accept invitation
      </button>
      <button name="decision" value="decline" disabled={busy}>
        Decline invitation
      </button>
      <p role="status">{message}</p>
    </form>
  );
}
