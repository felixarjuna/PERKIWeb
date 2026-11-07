import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import LibraryCatalog from "~/components/library/library-catalog";
import Loader from "~/components/loader";
import Template from "~/components/template";
import {
  authPageUrl,
  type PageSearchParams,
  requestedPath,
} from "~/lib/auth-redirect";
import { auth } from "~/server/auth";

export const metadata: Metadata = { title: "Library" };

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const session = await auth();
  if (!session) {
    redirect(
      authPageUrl("signin", requestedPath("/library", await searchParams))
    );
  }
  return (
    <Template
      subtitle="Books from PERKI and its members, to borrow and pass on."
      title="Library"
    >
      {/* The list reads its filters from the URL, which needs a boundary. */}
      <Suspense fallback={<Loader message="Loading the library…" />}>
        <LibraryCatalog />
      </Suspense>
    </Template>
  );
}
