import "server-only";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { getConnection } from "@/db/connection";
import { workspaceDatabase, identityIssuer } from "@/db/workspace";
import { withTenant } from "@/db";
import { permissions } from "@/db/permissions";
import { agents, businesses, locations, memberships, roles } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function verifiedSession() {
  return auth.api.getSession({ headers: await headers() });
}

export const workspaceStore = () => workspaceDatabase(getConnection());

export async function readWorkspace(subject: string, businessId: string, includeAssistants = false) {
  return withTenant({ identity: { issuer: identityIssuer, subject }, businessId }, permissions.workspaceRead, async ({ tx, membershipId }) => {
    const [business] = await tx.select().from(businesses).where(eq(businesses.id, businessId));
    const [role] = await tx.select({ name: roles.name }).from(memberships)
      .innerJoin(roles, eq(roles.id, memberships.roleId)).where(eq(memberships.id, membershipId));
    const businessLocations = await tx.select().from(locations).where(eq(locations.businessId, businessId));
    const workforce = includeAssistants && ["Owner", "Assistant manager"].includes(role.name)
      ? await tx.select({ id: agents.id, name: agents.name, active: agents.active, publishedVersion: agents.publishedVersion })
        .from(agents).where(eq(agents.businessId, businessId)).orderBy(asc(agents.name), asc(agents.id))
      : undefined;
    return { business, role: role.name, locations: businessLocations, workforce };
  });
}
