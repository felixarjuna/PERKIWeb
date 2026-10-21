"use client";

import { ChevronsUpDown, Unlink } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { QueryMessage } from "~/components/admin/admin-controls";
import { PersonAvatar } from "~/components/person-avatar";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { api, type RouterOutputs } from "~/trpc/react";

type Account = RouterOutputs["people"]["accounts"][number];
type UnlinkedName = RouterOutputs["people"]["unlinked"][number];

const accountPerson = (account: Account) => ({
  image: account.image,
  name: account.name ?? "Unnamed account",
});

/** Searchable list of every account, with photos. */
function AccountPicker({
  label,
  onPick,
  disabled,
}: {
  label: string;
  onPick: (account: Account) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const accounts = api.people.accounts.useQuery(undefined, { enabled: open });
  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-label={label}
          disabled={disabled}
          size="sm"
          type="button"
          variant="secondary"
        >
          Choose account
          <ChevronsUpDown aria-hidden="true" className="size-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <Command>
          <CommandInput placeholder="Search members…" />
          <CommandList>
            <CommandEmpty>
              {accounts.isPending ? "Loading members…" : "No member found."}
            </CommandEmpty>
            <CommandGroup>
              {accounts.data?.map((account) => (
                <CommandItem
                  key={account.id}
                  onSelect={() => {
                    setOpen(false);
                    onPick(account);
                  }}
                  value={`${account.name ?? ""} ${account.id}`}
                >
                  <PersonAvatar person={accountPerson(account)} size="sm" />
                  <span className="truncate">
                    {account.name ?? "Unnamed account"}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function usesLine(entry: UnlinkedName) {
  return entry.uses
    .map((use) => (use.count > 1 ? `${use.label} ×${use.count}` : use.label))
    .join(" · ");
}

function UnlinkedRow({
  entry,
  onLink,
  pending,
}: {
  entry: UnlinkedName;
  onLink: (name: string, account: Account) => void;
  pending: boolean;
}) {
  const otherSpellings = entry.spellings.filter((name) => name !== entry.name);
  return (
    <li className="flex flex-col gap-3 rounded-xl bg-card p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <PersonAvatar person={{ image: null, name: entry.name }} />
        <div className="min-w-0">
          <p className="type-body break-words">{entry.name}</p>
          <p className="type-caption text-muted-foreground">
            {usesLine(entry)}
            {otherSpellings.length > 0
              ? ` · also written ${otherSpellings.join(", ")}`
              : ""}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {entry.suggestion ? (
          <Button
            disabled={pending}
            onClick={() => {
              if (entry.suggestion) {
                onLink(entry.name, entry.suggestion);
              }
            }}
            size="sm"
            type="button"
          >
            <PersonAvatar
              className="-ms-1"
              person={accountPerson(entry.suggestion)}
              size="sm"
            />
            Link to {entry.suggestion.name}
          </Button>
        ) : null}
        <AccountPicker
          disabled={pending}
          label={`Choose the account for ${entry.name}`}
          onPick={(account) => onLink(entry.name, account)}
        />
      </div>
    </li>
  );
}

/**
 * Names written on schedules and in groups that aren't linked to an account
 * yet, with a suggested match, and the links already made.
 */
export default function NameLinks() {
  const utils = api.useUtils();
  const unlinked = api.people.unlinked.useQuery();
  const links = api.people.links.useQuery();
  const refresh = () =>
    Promise.all([
      utils.people.invalidate(),
      utils.schedules.invalidate(),
      utils.groups.invalidate(),
    ]);
  const link = api.people.link.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async (result, input) => {
      await refresh();
      toast.success(`Linked “${input.name}”`, {
        description: `${result.slots} schedule slots and ${result.groups} group entries now point to the account.`,
      });
    },
  });
  const unlink = api.people.unlink.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async (_, input) => {
      await refresh();
      toast.success(`Unlinked “${input.name}”`);
    },
  });

  if (unlinked.isError || links.isError) {
    return (
      <QueryMessage
        error
        onRetry={() => Promise.all([unlinked.refetch(), links.refetch()])}
      />
    );
  }
  if (unlinked.isPending || links.isPending) {
    return <QueryMessage>Loading names…</QueryMessage>;
  }

  const members = unlinked.data.filter((entry) => !entry.preacherOnly);
  const preachers = unlinked.data.filter((entry) => entry.preacherOnly);
  const onLink = (name: string, account: Account) =>
    link.mutate({ name, userId: account.id });
  const pending = link.isPending || unlink.isPending;

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h2 className="type-subheading">
          Not linked yet{" "}
          <span className="text-muted-foreground">{members.length}</span>
        </h2>
        {members.length === 0 ? (
          <p className="type-body-sm text-muted-foreground">
            Every member name on the schedules and in the groups points to an
            account.
          </p>
        ) : (
          <>
            <p className="type-body-sm text-muted-foreground">
              Linking a name applies to every schedule and group that uses it,
              and to later imports. Someone without an account stays a plain
              name until they sign up.
            </p>
            <ul className="grid gap-2">
              {members.map((entry) => (
                <UnlinkedRow
                  entry={entry}
                  key={entry.key}
                  onLink={onLink}
                  pending={pending}
                />
              ))}
            </ul>
          </>
        )}
      </section>

      {preachers.length > 0 ? (
        <section className="space-y-3">
          <h2 className="type-subheading">
            Preachers{" "}
            <span className="text-muted-foreground">{preachers.length}</span>
          </h2>
          <p className="type-body-sm text-muted-foreground">
            Only ever written as preacher, so most are guest pastors. Link the
            ones who are members.
          </p>
          <ul className="grid gap-2">
            {preachers.map((entry) => (
              <UnlinkedRow
                entry={entry}
                key={entry.key}
                onLink={onLink}
                pending={pending}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="type-subheading">
          Linked{" "}
          <span className="text-muted-foreground">{links.data.length}</span>
        </h2>
        {links.data.length === 0 ? (
          <p className="type-body-sm text-muted-foreground">
            Names you link appear here. Names spelled exactly like an account
            are linked automatically.
          </p>
        ) : (
          <ul className="@container grid gap-2">
            {links.data.map((entry) => (
              <li
                className="flex items-center gap-3 rounded-xl bg-card p-3 ps-4"
                key={entry.name}
              >
                <span className="type-body-sm min-w-0 flex-1 break-words">
                  <span className="text-muted-foreground">{entry.name}</span>
                  <span aria-hidden="true" className="text-muted-foreground">
                    {" → "}
                  </span>
                  <span className="sr-only"> is linked to </span>
                  <span className="inline-flex items-center gap-1.5 align-middle">
                    <PersonAvatar
                      person={accountPerson(entry.account)}
                      size="sm"
                    />
                    {entry.account.name}
                  </span>
                </span>
                <Button
                  aria-label={`Unlink ${entry.name}`}
                  disabled={pending}
                  onClick={() => unlink.mutate({ name: entry.name })}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <Unlink aria-hidden="true" className="size-4" />
                  <span className="hidden sm:inline">Unlink</span>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
