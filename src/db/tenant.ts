import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { z } from "zod";
import type { createConnection } from "./connection.ts";
import { memberships, rolePermissions, users } from "./schema.ts";

const tenantRequest = z.object({
  identity: z.object({
    issuer: z.string().min(1),
    subject: z.string().min(1),
  }),
  businessId: z.uuid(),
});

export class TenantAccessDenied extends Error {
  constructor() {
    super("Tenant access denied");
  }
}

export function createTenantAccess(connection: ReturnType<typeof createConnection>) {
  const db = drizzle(connection);

  // Supply identity from a verified session. Permission keys and callbacks come from server code.
  return async function withTenant<T>(
    request: z.input<typeof tenantRequest>,
    permission: string,
    operation: (context: {
      tx: Parameters<Parameters<typeof db.transaction>[0]>[0];
      businessId: string;
      membershipId: string;
    }) => Promise<T>,
  ): Promise<T> {
    const { identity, businessId } = tenantRequest.parse(request);
    return db.transaction(async (tx) => {
      await tx.execute(sql`
        select set_config('agentflow.identity_issuer', ${identity.issuer}, true),
               set_config('agentflow.identity_subject', ${identity.subject}, true),
               set_config('agentflow.business_id', ${businessId}, true)
      `);
      const [member] = await tx.select({ id: memberships.id })
        .from(memberships)
        .innerJoin(users, eq(users.id, memberships.userId))
        .innerJoin(rolePermissions, and(
          eq(rolePermissions.businessId, memberships.businessId),
          eq(rolePermissions.roleId, memberships.roleId),
          eq(rolePermissions.permissionKey, permission),
        ))
        .where(and(
          eq(memberships.businessId, businessId),
          eq(memberships.active, true),
          eq(users.identityIssuer, identity.issuer),
          eq(users.identitySubject, identity.subject),
        ));
      if (!member) throw new TenantAccessDenied();

      return operation({ tx, businessId, membershipId: member.id });
    }, { isolationLevel: "repeatable read" });
  };
}
