import "server-only";
import { cacheTag } from "next/cache";
import { getConnection } from "@/db/connection";

export const defaultIdentity = {
  name: "AgentFlow",
  tagline: "Built around your business.",
  title: "AgentFlow",
  description: "Your business assistant workspace.",
};
export type Identity = typeof defaultIdentity;

export async function publicIdentity(): Promise<Identity> {
  "use cache";
  cacheTag("platform-site-identity");
  const [row] = await getConnection()<Identity[]>`
    select name,tagline,title,description from site_identity_versions order by version desc limit 1`;
  return row ?? defaultIdentity;
}

export async function isPlatformAdmin(sessionUserId: string) {
  const [row] = await getConnection()`select 1 from platform_admins where user_id=${sessionUserId}`;
  return Boolean(row);
}
