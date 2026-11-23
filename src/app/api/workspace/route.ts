import { NextResponse } from "next/server";
import { z } from "zod";
import { onboarding } from "@/lib/validation";
import { verifiedSession, workspaceStore, readWorkspace } from "@/lib/workspace";
import { TenantAccessDenied } from "@/db";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(process.env.BETTER_AUTH_URL!).origin) {
    return NextResponse.json({ error: "Request origin rejected." }, { status: 403 });
  }
  const session = await verifiedSession();
  if (!session) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  let input;
  try { input = onboarding.safeParse(await request.json()); }
  catch { return NextResponse.json({ error: "Send a valid workspace form." }, { status: 400 }); }
  if (!input.success) return NextResponse.json({ error: input.error.issues[0].message }, { status: 400 });
  const key = request.headers.get("Idempotency-Key");
  if (key !== null && !z.uuid().safeParse(key).success) {
    return NextResponse.json({ error: "Invalid creation request." }, { status: 400 });
  }
  try {
    const store = workspaceStore();
    const businessId = key ? await store.create(session.user.id, input.data, key)
      : await store.onboard(session.user.id, input.data);
    return NextResponse.json({ businessId });
  } catch (error) {
    // Log only the database status code. Driver messages can contain form values.
    const sqlState = z.object({ code: z.string().regex(/^[0-9A-Z]{5}$/) });
    const code = sqlState.safeParse(error instanceof Error ? error.cause : undefined);
    const direct = sqlState.safeParse(error);
    console.error("Workspace creation failed", code.data?.code ?? direct.data?.code ?? "unclassified");
    return NextResponse.json({ error: "Workspace creation failed on the server. Check the AgentFlow server terminal for the diagnostic." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await verifiedSession();
  if (!session) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  const id = z.uuid().safeParse(new URL(request.url).searchParams.get("businessId"));
  if (!id.success) return NextResponse.json({ error: "Invalid workspace." }, { status: 400 });
  try { return NextResponse.json(await readWorkspace(session.user.id, id.data)); }
  catch (error) {
    if (error instanceof TenantAccessDenied) return NextResponse.json({ error: "Workspace unavailable." }, { status: 403 });
    return NextResponse.json({ error: "Unable to load workspace." }, { status: 500 });
  }
}
