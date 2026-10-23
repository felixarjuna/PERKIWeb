"use client";

import { RefreshCw } from "lucide-react";
import { DateTime } from "luxon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { toast } from "sonner";
import { QueryMessage } from "~/components/admin/admin-controls";
import { Button } from "~/components/ui/button";
import { markdownToPlainText } from "~/lib/markdown";
import { cn } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";

type Entry = RouterOutputs["takeawayImport"]["preview"]["entries"][number];

const CHANGE_LABELS: Record<Entry["changes"][number], string> = {
  notes: "notes",
  tldr: "TL;DR",
};

const BLOCK_BREAK = "\n\n";

/** The TL;DR as text, without the dated heading it starts with. */
const summaryText = (tldr: string) =>
  markdownToPlainText(tldr.split(BLOCK_BREAK).slice(1).join("\n\n"));

const formatDay = (day: string) =>
  DateTime.fromISO(day).toFormat("ccc d LLL yyyy");

function Row({
  entry,
  children,
}: {
  entry: Entry;
  children?: React.ReactNode;
}) {
  return (
    <li className="min-w-0 rounded-xl bg-card p-4">
      <p className="type-caption text-muted-foreground tabular-nums">
        {formatDay(entry.day)}
        {entry.gathering ? ` · ${entry.gathering.title}` : ""}
      </p>
      <p className="type-body mt-0.5 break-words">{entry.heading}</p>
      {children}
    </li>
  );
}

function Detail({ children }: { children: React.ReactNode }) {
  return (
    <p className="type-body-sm mt-1.5 line-clamp-3 break-words text-muted-foreground">
      {children}
    </p>
  );
}

function Group({
  title,
  description,
  entries,
  children,
}: {
  title: string;
  description?: string;
  entries: Entry[];
  children: (entry: Entry) => React.ReactNode;
}) {
  if (entries.length === 0) {
    return null;
  }
  return (
    <section className="space-y-3">
      <div>
        <h2 className="type-subheading">
          {title}{" "}
          <span className="text-muted-foreground">{entries.length}</span>
        </h2>
        {description ? (
          <p className="type-body-sm mt-1 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <ul className="grid @2xl:grid-cols-2 gap-2">
        {entries.map((entry) => (
          <Row entry={entry} key={entry.day}>
            {children(entry)}
          </Row>
        ))}
      </ul>
    </section>
  );
}

const importLabel = (count: number) => {
  if (count === 0) {
    return "Everything is up to date";
  }
  return `Import ${count} ${count === 1 ? "takeaway" : "takeaways"}`;
};

const byStatus = (entries: Entry[], status: Entry["status"]) =>
  entries.filter((entry) => entry.status === status);

/**
 * Imports the notes and TL;DR documents. The preview shows what would be
 * added and changed; nothing is written until the import is confirmed, and
 * running it again with the same documents changes nothing.
 */
export default function DocsImport() {
  const router = useRouter();
  const utils = api.useUtils();
  const status = api.takeawayImport.status.useQuery();
  const preview = api.takeawayImport.preview.useQuery(undefined, {
    enabled: status.data?.configured === true,
    retry: false,
  });
  const run = api.takeawayImport.run.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async (result) => {
      await Promise.all([
        utils.takeaways.invalidate(),
        utils.schedules.invalidate(),
        utils.takeawayImport.preview.invalidate(),
      ]);
      toast.success("Takeaways imported", {
        description: `${result.added} added as drafts, ${result.updated} updated.`,
      });
      router.push("/admin/takeaways");
    },
  });

  if (status.isError) {
    return <QueryMessage error onRetry={() => status.refetch()} />;
  }
  if (status.data && !status.data.configured) {
    return (
      <QueryMessage>
        The notes and TL;DR documents aren't set yet. Add their links on the{" "}
        <Link
          className="underline underline-offset-4"
          href="/admin/settings/integrations"
        >
          Settings
        </Link>{" "}
        page.
      </QueryMessage>
    );
  }

  const entries = preview.data?.entries ?? [];
  const added = byStatus(entries, "new");
  const changed = byStatus(entries, "changed");
  const published = byStatus(entries, "published");
  const skipped = byStatus(entries, "skipped");
  const unchanged = byStatus(entries, "unchanged").length;
  const toImport = added.length + changed.length;

  return (
    <div className="@container space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="type-body-sm min-w-0 flex-1 text-muted-foreground">
          Reads both documents and matches each dated entry to the gathering
          held that day.
        </p>
        <Button
          disabled={preview.isFetching}
          onClick={() => preview.refetch()}
          type="button"
          variant="ghost"
        >
          <RefreshCw
            aria-hidden="true"
            className={cn(
              "size-4",
              preview.isFetching && "animate-spin motion-reduce:animate-none"
            )}
          />
          Read again
        </Button>
      </div>

      {preview.isError ? (
        <div
          className="flex flex-col items-start gap-3 rounded-xl bg-card p-6"
          role="alert"
        >
          <p className="type-body-sm break-words">{preview.error.message}</p>
          <Button
            onClick={() => preview.refetch()}
            type="button"
            variant="secondary"
          >
            Try again
          </Button>
        </div>
      ) : null}
      {preview.isPending && status.data?.configured ? (
        <QueryMessage>Reading the documents…</QueryMessage>
      ) : null}

      {preview.data ? (
        <>
          <p className="type-body-sm text-muted-foreground" role="status">
            {added.length} new · {changed.length} changed · {unchanged} already
            up to date · {published.length} published, left alone ·{" "}
            {skipped.length} skipped
          </p>

          <Group
            description="Added as drafts without an author, ready for review."
            entries={added}
            title="New"
          >
            {(entry) => (
              <Detail>
                {entry.tldr
                  ? summaryText(entry.tldr)
                  : "No TL;DR in the document yet."}
              </Detail>
            )}
          </Group>

          <Group
            description="Not published yet, so the documents' text replaces it."
            entries={changed}
            title="Changed"
          >
            {(entry) => (
              <Detail>
                Updates{" "}
                {entry.changes
                  .map((change) => CHANGE_LABELS[change])
                  .join(" and ")}
              </Detail>
            )}
          </Group>

          <Group
            description="The documents differ, but published takeaways are never overwritten. Unpublish one to update it."
            entries={published}
            title="Published, left alone"
          >
            {() => null}
          </Group>

          <Group
            description="Dates are never guessed: fix the date in the document heading, or add the gathering first."
            entries={skipped}
            title="Skipped"
          >
            {(entry) => <Detail>{entry.reason}</Detail>}
          </Group>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              disabled={toImport === 0 || run.isPending}
              onClick={() => run.mutate()}
              type="button"
            >
              {importLabel(toImport)}
            </Button>
            <p className="type-caption text-muted-foreground">
              Nothing is deleted or published.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
