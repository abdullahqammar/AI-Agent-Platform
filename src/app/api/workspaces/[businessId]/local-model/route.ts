import { NextRequest } from "next/server";
import { TenantAccessDenied } from "@/db";
import { asAssistantManager } from "@/app/workspaces/[businessId]/assistant/store";
import { approvedModel, modelCatalog } from "@/lib/assistant/config";
import { checkLocalModel } from "@/lib/assistant/provider";

export async function GET(request: NextRequest, context: RouteContext<"/api/workspaces/[businessId]/local-model">) {
  const { businessId } = await context.params;
  const headers = { "Cache-Control": "private, no-store" };
  try {
    await asAssistantManager(businessId, async () => undefined);
  } catch (error) {
    if (error instanceof TenantAccessDenied) return new Response(null, { status: 404, headers });
    throw error;
  }
  const model = approvedModel.safeParse(request.nextUrl.searchParams.get("model"));
  if (!model.success || modelCatalog[model.data].provider !== "ollama") {
    return new Response(null, { status: 400, headers });
  }
  return Response.json({ status: await checkLocalModel(model.data) }, { headers });
}
