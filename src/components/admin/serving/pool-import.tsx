"use client";

import { format } from "date-fns";
import { ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { AccountPicker } from "~/components/admin/people/name-links";
import { PersonAvatar } from "~/components/person-avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  type PoolScope,
  type PoolStatus,
  poolRoleLabels,
  scopeLabels,
  statusLabels,
} from "~/lib/serving-pool";
import type { PoolChange } from "~/lib/serving-pool-sheet";
import { cn } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";
import { AdminSelect, QueryMessage } from "../admin-controls";

type Preview = RouterOutputs["servingPoolImport"]["preview"];
type Added = Preview["added"][number];
type Person = Added["user"];

const STATUS_VARIANT = {
  active: "published",
  backup: "review",
  paused: "draft",
} as const;

/** A `yyyy-MM-dd` day as written for people, e.g. "31 Mar 2027". */
const shownDay = (day: string) =>
  format(new Date(`${day}T12:00:00`), "d MMM yyyy");

const CHANGE_LABELS: Record<PoolChange["field"], string> = {
  note: "Note",
  pause: "Pause",
  scope: "Serves at",
  status: "Status",
};

function changeValue(change: PoolChange, side: "from" | "to") {
  const value = change[side];
  if (value === null) {
    return change.field === "pause" ? "Not paused" : "empty";
  }
  switch (change.field) {
    case "scope":
      return scopeLabels[value as PoolScope];
    case "status":
      return statusLabels[value as PoolStatus];
    case "pause":
      return `Until ${shownDay(value)}`;
    default:
      return value;
  }
}

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

/** A person's card: photo, account name, and how the sheet writes them. */
function PersonCard({
  person,
  written,
  children,
}: {
  person: Person;
  written?: string;
  children: ReactNode;
}) {
  return (
    <li className="rounded-xl bg-card p-4">
      <div className="flex min-w-0 items-center gap-3">
        <PersonAvatar person={person} />
        <div className="min-w-0">
          <p className="type-body break-words">{person.name}</p>
          {written && written !== person.name ? (
            <p className="type-caption text-muted-foreground">
              Written as “{written}”
            </p>
          ) : null}
        </div>
      </div>
      {children}
    </li>
  );
}

/** One person's new roles, with scope, status and any pause. */
function AddedCard({ entries, user }: { entries: Added[]; user: Person }) {
  return (
    <PersonCard person={user} written={entries[0]?.name}>
      <ul className="mt-3 space-y-2 border-t pt-3">
        {entries.map((entry) => (
          <li className="type-body-sm" key={entry.role}>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>{poolRoleLabels[entry.role]}</span>
              <span className="text-muted-foreground">
                {scopeLabels[entry.scope]}
              </span>
              <Badge
                className="ml-auto"
                size="status"
                variant={
                  STATUS_VARIANT[entry.pausedUntil ? "paused" : entry.status]
                }
              >
                <span>
                  {entry.pausedUntil
                    ? `Paused until ${shownDay(entry.pausedUntil)}`
                    : statusLabels[entry.status]}
                </span>
              </Badge>
            </div>
            {entry.pauseNote ? (
              <p className="type-caption mt-0.5 break-words text-muted-foreground">
                Note: {entry.pauseNote}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </PersonCard>
  );
}

/** Groups entries by account, keeping the sheet's order. */
function byPerson<T extends { user: Person }>(entries: T[]) {
  const people = new Map<string, { entries: T[]; user: Person }>();
  for (const entry of entries) {
    const person = people.get(entry.user.id);
    if (person) {
      person.entries.push(entry);
    } else {
      people.set(entry.user.id, { entries: [entry], user: entry.user });
    }
  }
  return [...people.values()];
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
  const roles = [...new Set(item.roles)].map((role) => poolRoleLabels[role]);
  return (
    <li className="flex flex-col gap-3 rounded-xl bg-card p-4">
      <div className="flex min-w-0 items-center gap-3">
        <PersonAvatar person={{ image: null, name: item.name }} />
        <div className="min-w-0">
          <p className="type-body break-words">{item.name}</p>
          <p className="type-caption text-muted-foreground">
            {roles.join(" · ")} · row {[...new Set(item.rows)].join(", ")}
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
  const added = byPerson(preview.added);
  const notInSheet = byPerson(preview.notInSheet);
  return (
    <>
      <Group
        count={preview.unmatched.length}
        description="These names match no account yet, so they aren't imported. Linking a name also links it on schedules and later imports."
        title="Without an account"
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

      <Group count={added.length} title="New">
        {added.map(({ entries, user }) => (
          <AddedCard entries={entries} key={user.id} user={user} />
        ))}
      </Group>

      <Group count={preview.changed.length} title="Changed">
        {preview.changed.map((entry) => (
          <PersonCard key={entry.id} person={entry.user} written={entry.name}>
            <p className="type-body-sm mt-3 border-t pt-3">
              {poolRoleLabels[entry.role]}
            </p>
            <dl className="type-body-sm mt-1.5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5">
              {entry.changes.map((change) => (
                <div className="contents" key={change.field}>
                  <dt className="text-muted-foreground">
                    {CHANGE_LABELS[change.field]}
                  </dt>
                  <dd className="flex flex-wrap items-center gap-1.5 break-words">
                    <span className="text-muted-foreground line-through">
                      {changeValue(change, "from")}
                    </span>
                    <ArrowRight
                      aria-label="becomes"
                      className="size-3.5 shrink-0"
                    />
                    <span>{changeValue(change, "to")}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </PersonCard>
        ))}
      </Group>

      <Group
        count={preview.repeated.length}
        description="Another line already lists the same person in this role, so these are skipped."
        title="Listed twice"
      >
        {preview.repeated.map((entry) => (
          <li
            className="type-body-sm rounded-xl bg-card p-4"
            key={`${entry.row} ${entry.role}`}
          >
            {entry.name} · {poolRoleLabels[entry.role]}
            <span className="text-muted-foreground"> · row {entry.row}</span>
          </li>
        ))}
      </Group>

      <Group
        count={notInSheet.length}
        description="In the pool but not on this tab. The import leaves them as they are; remove them on the pool page if they've stopped."
        title="Not in the sheet"
      >
        {notInSheet.map(({ entries, user }) => (
          <PersonCard key={user.id} person={user}>
            <p className="type-body-sm mt-2 text-muted-foreground">
              {entries.map((entry) => poolRoleLabels[entry.role]).join(" · ")}
            </p>
          </PersonCard>
        ))}
      </Group>
    </>
  );
}

const importLabel = (count: number) => {
  if (count === 0) {
    return "Everything is up to date";
  }
  return `Import ${count} ${count === 1 ? "entry" : "entries"}`;
};

/**
 * Imports the sheet's "List Pelayan" tab into the serving pool. The preview
 * shows what would be added and changed and which names have no account;
 * nothing is written until the import is confirmed, and nobody is removed.
 */
export default function PoolImport() {
  const router = useRouter();
  const utils = api.useUtils();
  const status = api.servingPoolImport.status.useQuery();
  const [tab, setTab] = useState("");
  const selectedTab = tab || status.data?.tabs[0] || "";
  const preview = api.servingPoolImport.preview.useQuery(
    { tab: selectedTab },
    { enabled: selectedTab !== "" }
  );
  const link = api.people.link.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async (_, input) => {
      await Promise.all([
        utils.servingPoolImport.preview.invalidate(),
        utils.people.invalidate(),
        utils.schedules.invalidate(),
      ]);
      toast.success(`Linked “${input.name}”`);
    },
  });
  const run = api.servingPoolImport.run.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async (result) => {
      await Promise.all([
        utils.servingPool.invalidate(),
        utils.servingPoolImport.preview.invalidate(),
      ]);
      toast.success("Serving pool imported", {
        description: `${result.added} added, ${result.updated} updated.`,
      });
      router.push("/admin/serving");
    },
  });

  if (status.isError) {
    return <QueryMessage error onRetry={() => status.refetch()} />;
  }
  if (status.data && !status.data.configured) {
    return (
      <QueryMessage>
        No schedule sheet is set yet. Add its link on the{" "}
        <Link className="underline underline-offset-4" href="/admin/settings">
          Settings
        </Link>{" "}
        page.
      </QueryMessage>
    );
  }
  if (status.data?.tabs.length === 0) {
    return (
      <QueryMessage>
        The schedule sheet has no “List Pelayan” tab to import.
      </QueryMessage>
    );
  }

  const { data } = preview;
  const toImport = data ? data.added.length + data.changed.length : 0;

  return (
    <div className="@container space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <AdminSelect
          className="w-52"
          id="pool-import-tab"
          label="Tab"
          onChange={setTab}
          options={(status.data?.tabs ?? []).map((name) => ({
            label: name,
            value: name,
          }))}
          value={selectedTab}
        />
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
        <QueryMessage error onRetry={() => preview.refetch()} />
      ) : null}
      {preview.isPending && selectedTab ? (
        <QueryMessage>Reading the {selectedTab} tab…</QueryMessage>
      ) : null}

      {data ? (
        <>
          <p className="type-body-sm text-muted-foreground" role="status">
            {data.asOf ? `Sheet as of ${shownDay(data.asOf)} · ` : ""}
            {data.added.length} new · {data.changed.length} changed ·{" "}
            {data.unchanged} up to date · {data.unmatched.length} without an
            account
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
              onClick={() => run.mutate({ tab: selectedTab })}
              type="button"
            >
              {importLabel(toImport)}
            </Button>
            <p className="type-caption text-muted-foreground">
              Nobody is removed. The sheet gives pauses no end, so they run
              until {shownDay(data.pauseEnd)}; change one on the pool page.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
