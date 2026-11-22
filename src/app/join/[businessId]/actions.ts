"use server";
import { redirect } from "next/navigation";
import { verifiedSession } from "@/lib/workspace";
import { getConnection } from "@/db/connection";
import { respondToInvitation } from "@/db/invitations";
import { z } from "zod";
export async function respond(
  business: string,
  _previous: string,
  form: FormData,
) {
  const session = await verifiedSession();
  if (!session) return "Sign in and reopen your invitation.";
  const token = z
    .string()
    .regex(/^[0-9a-f]{64}$/)
    .safeParse(form.get("token"));
  const choice = z.enum(["accept", "decline"]).safeParse(form.get("decision"));
  if (!token.success || !choice.success)
    return "This invitation is unavailable.";
  const accepted = choice.data === "accept";
  const used = await respondToInvitation(
    getConnection(),
    business,
    token.data,
    session.user,
    accepted,
  );
  if (!used) return "This invitation is unavailable for this account.";
  if (accepted) redirect(`/dashboard?businessId=${business}`);
  return "Invitation declined.";
}
