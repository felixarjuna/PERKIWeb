"use client";

import { ArrowRight, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import React from "react";
import { toast } from "sonner";
import { AccountPicker } from "~/components/admin/people/name-links";
import { OpenLink } from "~/components/admin/settings/open-link";
import { BookByline, LanguageChip } from "~/components/library/language";
import { PersonAvatar } from "~/components/person-avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { languageLabel } from "~/lib/library";
import type { ImportedField } from "~/lib/library-import";
import { cn } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";
import { QueryMessage } from "../admin-controls";

type Preview = RouterOutputs["libraryImport"]["preview"];
type Copy = Preview["added"][number];

const FIELD_LABELS: Record<ImportedField, string> = {
  category: "Category",
  description: "Description",
  language: "Language",
  publisher: "Publisher",
};

const fieldValue = (field: ImportedField, value: string | null) => {
  if (value === null) {
    return "empty";
  }
  return field === "language" ? (languageLabel(value)?.name ?? value) : value;
};

const rowsLabel = (rows: number[]) =>
  `${rows.length === 1 ? "row" : "rows"} ${rows.join(", ")}`;

function Group({
  title,
  count,
  description,
  children,
}: {
  title: string;
  count: number;
  description?: string;
  children: ReactNode;
}) {
  if (count === 0) {
    return null;
  }
  return (
    <section aria-label={title} className="space-y-3">
      <div className="space-y-1">
        <h2 className="type-subheading">
          {title} <span className="text-muted-foreground">{count}</span>
        </h2>
        {description ? (
          <p className="type-body-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <ul className="grid @2xl:grid-cols-2 gap-2">{children}</ul>
    </section>
  );
}

/** Who the copy belongs to and who has it, as the import will store it. */
function whose(copy: Pick<Copy, "borrower" | "format" | "owner">) {
  const owner = copy.owner ? `Lent by ${copy.owner.name}` : "PERKI's";
  const format = copy.format === "ebook" ? "Ebook" : "Physical";
  return [format, owner, copy.borrower ? `with ${copy.borrower.name}` : null]
    .filter(Boolean)
    .join(" · ");
}

function CopyCard({ copy, children }: { copy: Copy; children?: ReactNode }) {
  return (
    <li className="rounded-xl bg-card p-4">
      <p className="type-body break-words">{copy.title}</p>
      <BookByline
        author={copy.author}
        category={copy.category}
        language={copy.language}
        publisher={copy.publisher}
      />
      <p className="type-caption mt-2 text-muted-foreground">
        {whose(copy)} · row {copy.row}
      </p>
      {children}
    </li>
  );
}

function UnmatchedCard({
  item,
  onLink,
  pending,
}: {
  item: Preview["unmatched"][number];
  onLink: (name: string, account: { id: string; name: string | null }) => void;
  pending: boolean;
}) {
  const uses = item.as.map((as) => (as === "owner" ? "Owner" : "Lent to"));
  return (
    <li className="flex flex-col gap-3 rounded-xl bg-card p-4">
      <div className="flex min-w-0 items-center gap-3">
        <PersonAvatar person={{ image: null, name: item.name }} />
        <div className="min-w-0">
          <p className="type-body break-words">{item.name}</p>
          <p className="type-caption text-muted-foreground">
            {uses.join(" · ")} · {rowsLabel(item.rows)}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {item.suggestion ? (
          <Button
            disabled={pending}
            onClick={() => {
              if (item.suggestion) {
                onLink(item.name, item.suggestion);
              }
            }}
            size="sm"
            type="button"
          >
            <PersonAvatar
              className="-ms-1"
              person={{
                image: item.suggestion.image,
                name: item.suggestion.name ?? "Unnamed account",
              }}
              size="sm"
            />
            Link to {item.suggestion.name}
          </Button>
        ) : null}
        <AccountPicker
          disabled={pending}
          label={`Choose the account for ${item.name}`}
          onPick={(account) => onLink(item.name, account)}
        />
      </div>
    </li>
  );
}

function PreviewLists({
  preview,
  onLink,
  linking,
}: {
  preview: Preview;
  onLink: (name: string, account: { id: string; name: string | null }) => void;
  linking: boolean;
}) {
  return (
    <>
      <Group
        count={preview.unmatched.length}
        description="These names match no account yet. A book whose owner isn't linked waits, so no book loses its lender; a book lent to someone without an account comes in without its loan. Linking a name also links it on schedules and later imports."
        title="Names to link"
      >
        {preview.unmatched.map((item) => (
          <UnmatchedCard
            item={item}
            key={item.name}
            onLink={onLink}
            pending={linking}
          />
        ))}
      </Group>

      <Group count={preview.added.length} title="New">
        {preview.added.map((copy) => (
          <CopyCard
            copy={copy}
            key={`${copy.row} ${copy.owner?.id ?? "perki"} ${copy.format} ${copy.language}`}
          />
        ))}
      </Group>

      <Group
        count={preview.changed.length}
        description="Books already in the library that the sheet adds details or a loan to. Nothing is cleared."
        title="Changed"
      >
        {preview.changed.map((copy) => (
          <CopyCard copy={copy} key={copy.id}>
            <dl className="type-body-sm mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 border-t pt-3">
              {copy.changes.map((change) => (
                <div className="contents" key={change.field}>
                  <dt className="text-muted-foreground">
                    {FIELD_LABELS[change.field]}
                  </dt>
                  <dd className="flex flex-wrap items-center gap-1.5 break-words">
                    <span className="text-muted-foreground line-through">
                      {fieldValue(change.field, change.from)}
                    </span>
                    <ArrowRight
                      aria-label="becomes"
                      className="size-3.5 shrink-0"
                    />
                    <span className="line-clamp-2">
                      {fieldValue(change.field, change.to)}
                    </span>
                  </dd>
                </div>
              ))}
              {copy.borrower ? (
                <div className="contents">
                  <dt className="text-muted-foreground">Loan</dt>
                  <dd>Starts for {copy.borrower.name}</dd>
                </div>
              ) : null}
            </dl>
          </CopyCard>
        ))}
      </Group>

      <Group
        count={preview.ownerUnlinked.length}
        description="Imported once their owner's name is linked above."
        title="Waiting for their owner"
      >
        {preview.ownerUnlinked.map((copy) => (
          <li
            className="type-body-sm rounded-xl bg-card p-4"
            key={`${copy.row} ${copy.owner} ${copy.format} ${copy.language}`}
          >
            <span className="break-words">{copy.title}</span>
            <span className="text-muted-foreground">
              {" "}
              · {copy.format === "ebook" ? "Ebook" : "Physical"} · {copy.owner}{" "}
              · row {copy.row}
            </span>{" "}
            <LanguageChip language={copy.language} />
          </li>
        ))}
      </Group>

      <Group
        count={preview.unlinkedLoans.length}
        description="Imported without their loan until the name is linked."
        title="Lent to someone without an account"
      >
        {preview.unlinkedLoans.map((item) => (
          <li
            className="type-body-sm rounded-xl bg-card p-4"
            key={`${item.row} ${item.lentTo}`}
          >
            {item.title}
            <span className="text-muted-foreground">
              {" "}
              · lent to {item.lentTo} · row {item.row}
            </span>
          </li>
        ))}
      </Group>

      <Group
        count={preview.unknownLanguages.length}
        description="Not English, German or Indonesian, so these come in without a language. Pick one on the shelf afterwards."
        title="Unknown languages"
      >
        {preview.unknownLanguages.map((item) => (
          <li
            className="type-body-sm rounded-xl bg-card p-4"
            key={`${item.row} ${item.value}`}
          >
            {item.title}
            <span className="text-muted-foreground">
              {" "}
              · “{item.value}” · row {item.row}
            </span>
          </li>
        ))}
      </Group>

      <Group count={preview.skipped.length} title="Skipped">
        {preview.skipped.map((item) => (
          <li className="type-body-sm rounded-xl bg-card p-4" key={item.row}>
            {item.title}
            <span className="text-muted-foreground">
              {" "}
              · {item.reason} · row {item.row}
            </span>
          </li>
        ))}
      </Group>
    </>
  );
}

/** The "Sheet" field: paste the book list's link; saved once Google opens it. */
function SheetForm({
  current,
  onCancel,
}: {
  current: boolean;
  onCancel?: () => void;
}) {
  const [link, setLink] = React.useState("");
  const utils = api.useUtils();
  const save = api.settings.setLibrarySheet.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async (result) => {
      await Promise.all([
        utils.libraryImport.invalidate(),
        utils.settings.invalidate(),
      ]);
      toast.success(`Connected “${result.title ?? "the sheet"}”`);
      setLink("");
      onCancel?.();
    },
  });
  return (
    <form
      className="flex flex-col gap-2 rounded-xl bg-card p-4 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate({ link });
      }}
    >
      <Label htmlFor="library-sheet">Sheet</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          aria-describedby="library-sheet-hint"
          className="sm:flex-1"
          id="library-sheet"
          onChange={(event) => setLink(event.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/…"
          required
          value={link}
        />
        <div className="flex gap-2">
          <Button disabled={save.isPending} type="submit">
            {save.isPending ? "Checking…" : "Save"}
          </Button>
          {current && onCancel ? (
            <Button onClick={onCancel} type="button" variant="ghost">
              Cancel
            </Button>
          ) : null}
        </div>
      </div>
      <p className="type-caption text-muted-foreground" id="library-sheet-hint">
        The book list's link. Its first tab is read, so it must be shared with
        “Anyone with the link”. Also on Settings → Integrations.
      </p>
    </form>
  );
}

const importLabel = (count: number) => {
  if (count === 0) {
    return "Everything is up to date";
  }
  return `Import ${count} ${count === 1 ? "book" : "books"}`;
};

/**
 * Imports the library's book list. The preview shows the copies it would add,
 * the details it would fill in and the names without an account; nothing is
 * written until the import is confirmed, and nothing is deleted.
 */
export default function LibraryImport() {
  const router = useRouter();
  const utils = api.useUtils();
  const status = api.libraryImport.status.useQuery();
  const [changing, setChanging] = React.useState(false);
  const sheet = status.data?.sheet ?? null;
  const preview = api.libraryImport.preview.useQuery(undefined, {
    enabled: Boolean(sheet),
    retry: false,
  });
  const link = api.people.link.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async (_, input) => {
      await Promise.all([
        utils.libraryImport.preview.invalidate(),
        utils.people.invalidate(),
      ]);
      toast.success(`Linked “${input.name}”`);
    },
  });
  const run = api.libraryImport.run.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async (result) => {
      await utils.library.invalidate();
      await utils.libraryImport.preview.invalidate();
      toast.success("Books imported", {
        description: `${result.added} added, ${result.updated} updated, ${result.loans} ${result.loans === 1 ? "loan" : "loans"} started.`,
      });
      router.push("/admin/library");
    },
  });

  if (status.isError) {
    return <QueryMessage error onRetry={() => status.refetch()} />;
  }
  if (status.isPending) {
    return <QueryMessage>Loading…</QueryMessage>;
  }
  if (!sheet || changing) {
    return (
      <SheetForm current={Boolean(sheet)} onCancel={() => setChanging(false)} />
    );
  }

  const { data } = preview;
  const toImport = data ? data.added.length + data.changed.length : 0;

  return (
    <div className="@container space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="type-body-sm text-muted-foreground">Sheet</span>
        <OpenLink
          href={sheet.url}
          label={sheet.title ?? "Sheet can't be opened right now"}
        />
        <Button
          aria-label="Change the library sheet"
          onClick={() => setChanging(true)}
          size="sm"
          type="button"
          variant="secondary"
        >
          Change
        </Button>
        <Button
          className="sm:ml-auto"
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
          <p className="type-body-sm">{preview.error.message}</p>
          <Button
            onClick={() => preview.refetch()}
            type="button"
            variant="secondary"
          >
            Try again
          </Button>
        </div>
      ) : null}
      {preview.isPending && !preview.isError ? (
        <QueryMessage>Reading the book list…</QueryMessage>
      ) : null}

      {data ? (
        <>
          <p className="type-body-sm text-muted-foreground" role="status">
            {data.copies} {data.copies === 1 ? "copy" : "copies"} in the sheet ·{" "}
            {data.added.length} new · {data.changed.length} changed ·{" "}
            {data.unchanged} up to date · {data.ownerUnlinked.length} waiting
            for their owner · {data.skipped.length} skipped
          </p>

          <PreviewLists
            linking={link.isPending}
            onLink={(name, account) =>
              link.mutate({ name, userId: account.id })
            }
            preview={data}
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button
              disabled={toImport === 0 || run.isPending}
              onClick={() => run.mutate()}
              type="button"
            >
              {run.isPending ? "Importing…" : importLabel(toImport)}
            </Button>
            <p className="type-caption text-muted-foreground">
              One book per copy: each owner's, each format and each language.
              Nothing is deleted, and running it again only adds what's new.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
