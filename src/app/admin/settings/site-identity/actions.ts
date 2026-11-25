"use server";

import { notFound, redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { getConnection } from "@/db/connection";
import { verifiedSession } from "@/lib/workspace";
import { defaultIdentity, type Identity } from "@/lib/platform-identity";

const fields = z.object({
  name: z.string().trim().min(1).max(80),
  tagline: z.string().trim().min(1).max(160),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(320),
});

export async function saveIdentity(expectedVersion: number, form: FormData) {
  const session = await verifiedSession();
  if (!session) notFound();
  const outcome = await getConnection().begin(async tx => {
    // A concurrent revocation must either precede or follow this entire edit.
    const [admin] = await tx`select user_id from platform_admins where user_id=${session.user.id} for share`;
    if (!admin) return "denied";
    const parsed = fields.safeParse(Object.fromEntries(form));
    if (!parsed.success) return "invalid";
    await tx`lock table site_identity_versions in share row exclusive mode`;
    const [row] = await tx<(Identity & { version: number })[]>`
      select version,name,tagline,title,description from site_identity_versions order by version desc limit 1`;
    const version = row?.version ?? 0;
    if (version !== expectedVersion) return "stale";
    const prior = row ?? defaultIdentity;
    const next = parsed.data;
    if (next.name === prior.name && next.tagline === prior.tagline && next.title === prior.title && next.description === prior.description) return "same";
    await tx`insert into site_identity_versions(version,actor_id,name,tagline,title,description)
      values(${version+1},${session.user.id},${next.name},${next.tagline},${next.title},${next.description})`;
    return "saved";
  });
  if (outcome === "denied") notFound();
  if (outcome === "saved") {
    updateTag("platform-site-identity");
    revalidatePath("/", "layout");
  }
  redirect("/admin/settings/site-identity?notice=" + outcome);
}
