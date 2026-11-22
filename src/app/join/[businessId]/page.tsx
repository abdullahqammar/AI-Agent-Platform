import { Suspense } from "react";
import Link from "next/link";
import { verifiedSession } from "@/lib/workspace";
import { RespondForm } from "./form";
async function Join({ params }: PageProps<"/join/[businessId]">) {
  const { businessId } = await params;
  const session = await verifiedSession();
  return (
    <main className="assistant-studio">
      <h1>Workspace invitation</h1>
      {session ? (
        <>
          <p>Respond as {session.user.email}</p>
          <RespondForm business={businessId} />
        </>
      ) : (
        <>
          <p>
            Sign in or register using the invited email, then return to this tab
            and refresh it.
          </p>
          <Link href="/login" target="_blank">
            Sign in
          </Link>{" "}
          ·{" "}
          <Link href="/register" target="_blank">
            Register
          </Link>
        </>
      )}
    </main>
  );
}
export default function Page(props: PageProps<"/join/[businessId]">) {
  return (
    <Suspense fallback={<p>Loading invitation…</p>}>
      <Join {...props} />
    </Suspense>
  );
}
