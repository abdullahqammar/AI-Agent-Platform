import { createHash, randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import type { createConnection } from "./connection.ts";
import { permissions } from "./permissions.ts";
import { users, businesses, roles, memberships, rolePermissions, locations, auditEvents } from "./schema.ts";
import { onboarding } from "../lib/validation.ts";
import type { z } from "zod";

export const identityIssuer = "agentflow:better-auth";
type Transaction = Parameters<Parameters<ReturnType<typeof drizzle>["transaction"]>[0]>[0];

// Internal database primitive. Callers must obtain subject from a verified session.
// No client-provided issuer, user, role or business identifiers are accepted.
export async function ensureIdentity(tx: Transaction, subject: string) {
  await tx.execute(sql`select set_config('agentflow.identity_issuer', ${identityIssuer}, true),
    set_config('agentflow.identity_subject', ${subject}, true)`);
  await tx.insert(users).values({ identityIssuer, identitySubject: subject })
    .onConflictDoNothing({ target: [users.identityIssuer, users.identitySubject] });
  const [user] = await tx.select().from(users).where(and(
    eq(users.identityIssuer, identityIssuer), eq(users.identitySubject, subject),
  ));
  return user;
}

async function createWorkspace(tx: Transaction, subject: string, input: z.input<typeof onboarding>, requestId?: string) {
  const data = onboarding.parse(input);
  // Transaction-level lock serializes concurrent requests for this verified identity.
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${identityIssuer + ":" + subject}, 0))`);
  const user = await ensureIdentity(tx, subject);
  if (!requestId && user.homeBusinessId) return user.homeBusinessId;
  // Scope retry identifiers to the verified user. An input UUID cannot select an existing business.
  let businessId = randomUUID().toString();
  if (requestId) {
    const digest = createHash("sha256").update(JSON.stringify([user.id, requestId])).digest("hex");
    businessId = [digest.slice(0,8), digest.slice(8,12), "8" + digest.slice(13,16),
      "8" + digest.slice(17,20), digest.slice(20,32)].join("-");
  }
  await tx.execute(sql`select set_config('agentflow.business_id', ${businessId}, true)`);
  if (requestId) {
    const [existing] = await tx.select({ id: memberships.id }).from(memberships).where(and(
      eq(memberships.businessId, businessId), eq(memberships.userId, user.id), eq(memberships.active, true)));
    if (existing) return businessId;
  }
  await tx.insert(businesses).values({ id: businessId, name: data.businessName, timezone: data.timezone });
  const [role] = await tx.insert(roles).values({ businessId, name: "Owner" }).returning();
  await tx.insert(rolePermissions).values(Object.values(permissions).map((permissionKey) => ({
    businessId, roleId: role.id, permissionKey,
  })));
  await tx.insert(locations).values({
    businessId, name: data.locationName, timezone: data.timezone, address: data.address || null,
  });
  const [member] = await tx.insert(memberships).values({ businessId, userId: user.id, roleId: role.id }).returning();
  await tx.insert(auditEvents).values({ businessId, membershipId: member.id, action: "workspace.created", targetId: businessId });
  if (!user.homeBusinessId) await tx.update(users).set({ homeBusinessId: businessId }).where(eq(users.id, user.id));
  return businessId;
}

export function createFirstWorkspace(tx: Transaction, subject: string, input: z.input<typeof onboarding>) {
  return createWorkspace(tx, subject, input);
}

export function workspaceDatabase(connection: ReturnType<typeof createConnection>) {
  const db = drizzle(connection);
  return {
    identity: (subject: string) => db.transaction((tx) => ensureIdentity(tx, subject)),
    listMemberships: (subject: string) => db.transaction(async tx => {
      const user = await ensureIdentity(tx, subject);
      return tx.select({ businessId: memberships.businessId }).from(memberships)
        .where(and(eq(memberships.userId, user.id), eq(memberships.active, true))).orderBy(memberships.createdAt);
    }),
    create: (subject: string, input: z.input<typeof onboarding>, requestId: string) =>
      db.transaction(tx => createWorkspace(tx, subject, input, requestId)),
    onboard: (subject: string, input: z.input<typeof onboarding>) =>
      db.transaction((tx) => createFirstWorkspace(tx, subject, input)),
  };
}
