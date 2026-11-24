import "server-only";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { verifiedSession } from "@/lib/workspace";
import { identityIssuer } from "@/db/workspace";
import { withTenant, TenantAccessDenied } from "@/db";
import { permissions } from "@/db/permissions";

type Context = Parameters<Parameters<typeof withTenant>[2]>[0] & { staffName: string };
export async function withWorkspaceRoles<T>(
  businessId: string,
  roles: string[],
  operation: (ctx: Context) => Promise<T>,
) {
  const session = await verifiedSession();
  if (!session || !z.uuid().safeParse(businessId).success)
    throw new TenantAccessDenied();
  return withTenant(
    {
      businessId,
      identity: { issuer: identityIssuer, subject: session.user.id },
    },
    permissions.workspaceRead,
    async (ctx) => {
      const [owner] = await ctx.tx
        .execute(sql`select 1 from business_memberships m join roles r on r.id=m.role_id and r.business_id=m.business_id
      where m.id=${ctx.membershipId} and m.business_id=${businessId} and m.active and r.name in (${sql.join(
        roles.map((role) => sql`${role}`),
        sql`,`,
      )})`);
      if (!owner) throw new TenantAccessDenied();
      return operation({ ...ctx, staffName: session.user.name });
    },
  );
}

export function asAssistantManager<T>(
  business: string,
  operation: (ctx: Context) => Promise<T>,
) {
  return withWorkspaceRoles(
    business,
    ["Owner", "Assistant manager"],
    operation,
  );
}
