"use client";

import { Ellipsis, Plus } from "lucide-react";
import { DateTime } from "luxon";
import React from "react";
import { toast } from "sonner";
import { AdminSelect, QueryMessage } from "~/components/admin/admin-controls";
import { AvatarStack, PersonAvatar } from "~/components/person-avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import type { TermStatus } from "~/lib/group-terms";
import { api, type RouterOutputs } from "~/trpc/react";
import { NewTermDialog } from "./new-term-dialog";

type Term = RouterOutputs["groups"]["terms"]["terms"][number];
type Group = Term["groups"][number];
type Member = Group["members"][number];

const day = (iso: string) => DateTime.fromISO(iso).toFormat("d LLL yyyy");

const statusLabels: Record<TermStatus, string> = {
  current: "Current",
  past: "Past",
  upcoming: "Upcoming",
};

/** "Since 1 Apr 2026", "From 1 Nov 2026", or the dates a past term ran. */
function termDates(term: Term, later: Term | undefined) {
  if (term.status === "current") {
    return `since ${day(term.startsOn)}`;
  }
  if (term.status === "upcoming" || !later) {
    return `from ${day(term.startsOn)}`;
  }
  const end = DateTime.fromISO(later.startsOn).minus({ days: 1 }).toISODate();
  return `${day(term.startsOn)} – ${day(end ?? later.startsOn)}`;
}

function termNote(term: Term) {
  switch (term.status) {
    case "current":
      return "Shown on the Groups page now. Changes apply right away.";
    case "upcoming":
      return `The Groups page and My duties switch to this term on ${day(term.startsOn)}. Move people before then.`;
    default:
      return "This term has ended and can't be changed.";
  }
}

/** Refreshes the admin list and the public groups after a change. */
function useGroupMutationOptions(success: string) {
  const utils = api.useUtils();
  return {
    onError: (error: { message: string }) => toast.error(error.message),
    onSuccess: async () => {
      await utils.groups.invalidate();
      toast.success(success);
    },
  };
}

function MemberRow({
  member,
  group,
  groups,
  editable,
}: {
  member: Member;
  group: Group;
  groups: Group[];
  editable: boolean;
}) {
  const move = api.groups.moveMember.useMutation(
    useGroupMutationOptions(`${member.name} moved`)
  );
  const remove = api.groups.removeMember.useMutation(
    useGroupMutationOptions(`${member.name} removed from ${group.name}`)
  );
  const others = groups.filter((other) => other.id !== group.id);
  return (
    <li className="flex items-center gap-3 py-1.5">
      <PersonAvatar person={member} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="type-body-sm break-words">{member.name}</p>
        {member.linked ? null : (
          <p className="type-caption text-muted-foreground">
            No account linked
          </p>
        )}
      </div>
      {editable ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={`Move or remove ${member.name}`}
              disabled={move.isPending || remove.isPending}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <Ellipsis aria-hidden="true" className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Move to</DropdownMenuLabel>
            {others.map((other) => (
              <DropdownMenuItem
                key={other.id}
                onSelect={() =>
                  move.mutate({ groupId: other.id, memberId: member.id })
                }
              >
                {other.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive-text focus:text-destructive-text"
              onSelect={() => remove.mutate({ memberId: member.id })}
            >
              Remove from {group.name}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </li>
  );
}

function AddMember({ group }: { group: Group }) {
  const [name, setName] = React.useState("");
  const utils = api.useUtils();
  const add = api.groups.addMember.useMutation({
    onError: (error) => toast.error(error.message),
  });
  const id = `add-${group.id}`;
  return (
    <form
      className="mt-3 flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!name.trim()) {
          return;
        }
        add.mutate(
          { groupId: group.id, name },
          {
            onSuccess: async () => {
              await utils.groups.invalidate();
              toast.success(`${name.trim()} added to ${group.name}`);
              setName("");
            },
          }
        );
      }}
    >
      <label className="sr-only" htmlFor={id}>
        Add a person to {group.name}
      </label>
      <Input
        autoComplete="off"
        id={id}
        maxLength={100}
        onChange={(event) => setName(event.target.value)}
        placeholder="Add a person"
        value={name}
      />
      <Button
        aria-label={`Add to ${group.name}`}
        disabled={add.isPending || !name.trim()}
        size="icon"
        type="submit"
        variant="secondary"
      >
        <Plus aria-hidden="true" className="size-4" />
      </Button>
    </form>
  );
}

function GroupCard({
  group,
  groups,
  editable,
}: {
  group: Group;
  groups: Group[];
  editable: boolean;
}) {
  return (
    <section
      aria-labelledby={`group-${group.id}`}
      className="rounded-xl bg-card p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="type-body" id={`group-${group.id}`}>
          {group.name}
        </h3>
        <div className="flex items-center gap-2">
          <AvatarStack people={group.members} />
          <p className="type-caption text-muted-foreground">
            {group.members.length === 1
              ? "1 person"
              : `${group.members.length} people`}
          </p>
        </div>
      </div>
      {group.members.length > 0 ? (
        <ul className="mt-2">
          {group.members.map((member) => (
            <MemberRow
              editable={editable}
              group={group}
              groups={groups}
              key={member.id}
              member={member}
            />
          ))}
        </ul>
      ) : (
        <p className="type-body-sm mt-2 text-muted-foreground">No one yet.</p>
      )}
      {editable ? <AddMember group={group} /> : null}
    </section>
  );
}

function DeleteTerm({
  term,
  onDeleted,
}: {
  term: Term;
  onDeleted: () => void;
}) {
  const utils = api.useUtils();
  const remove = api.groups.deleteTerm.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      await utils.groups.invalidate();
      onDeleted();
      toast.success("Term deleted");
    },
  });
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button disabled={remove.isPending} type="button" variant="ghost">
          Delete term
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete the term from {day(term.startsOn)}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Its groups and everyone in them are removed. The current term stays
            as it is.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep term</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            onClick={() => remove.mutate({ termId: term.id })}
          >
            Delete term
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** The default term to show: the current one, else the newest. */
const defaultTerm = (terms: Term[]) =>
  (terms.find((term) => term.status === "current") ?? terms[0])?.id ?? null;

/** Every cooking and cleaning group term; current and upcoming ones are editable. */
export default function GroupManager() {
  const query = api.groups.terms.useQuery();
  const [selected, setSelected] = React.useState<number | null>(null);
  const [starting, setStarting] = React.useState(false);

  if (query.isError) {
    return <QueryMessage error onRetry={() => query.refetch()} />;
  }
  if (query.isPending) {
    return <QueryMessage>Loading groups…</QueryMessage>;
  }

  const { terms, today } = query.data;
  const term =
    terms.find((candidate) => candidate.id === selected) ??
    terms.find((candidate) => candidate.id === defaultTerm(terms));
  const later = (of: Term) => terms[terms.indexOf(of) - 1];
  const editable = term !== undefined && term.status !== "past";

  return (
    <div className="@container space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        {term ? (
          <AdminSelect
            className="@md:w-80 w-full"
            id="group-term"
            label="Term"
            onChange={(value) => setSelected(Number(value))}
            options={terms.map((candidate) => ({
              label: `${statusLabels[candidate.status]} · ${termDates(candidate, later(candidate))}`,
              value: String(candidate.id),
            }))}
            value={String(term.id)}
          />
        ) : null}
        <Button onClick={() => setStarting(true)} type="button">
          <Plus aria-hidden="true" className="size-4" />
          Start a new term
        </Button>
      </div>

      {term ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <Badge variant="secondary">{statusLabels[term.status]}</Badge>
              <p className="type-body-sm text-muted-foreground">
                {termNote(term)}
              </p>
            </div>
            {term.status === "upcoming" ? (
              <DeleteTerm onDeleted={() => setSelected(null)} term={term} />
            ) : null}
          </div>
          <h2 className="sr-only">Groups</h2>
          <div className="grid @2xl:grid-cols-2 @5xl:grid-cols-3 gap-2">
            {term.groups.map((group) => (
              <GroupCard
                editable={editable}
                group={group}
                groups={term.groups}
                key={group.id}
              />
            ))}
          </div>
        </>
      ) : (
        <QueryMessage>
          No groups yet. Start a term to set up the six cooking and cleaning
          groups.
        </QueryMessage>
      )}

      <NewTermDialog
        onOpenChange={setStarting}
        onStarted={setSelected}
        open={starting}
        terms={terms}
        today={today}
      />
    </div>
  );
}
