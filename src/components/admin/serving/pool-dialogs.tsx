"use client";

import { format } from "date-fns";
import { Check } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import { PersonAvatar } from "~/components/person-avatar";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  LITUR_PA_PARTS,
  POOL_GROUPS,
  POOL_STATUSES,
  type PoolScope,
  type PoolStatus,
  poolEntriesFor,
  scopeLabels,
  scopesFor,
  statusLabels,
} from "~/lib/serving-pool";
import { servingRoleLabels } from "~/lib/serving-roles";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { AdminSegmented, AdminSelect } from "../admin-controls";
import { entryName, type PoolEntry } from "./pool-columns";

const MAX_NOTE = 500;
const groupOptions = POOL_GROUPS.map(({ label, value }) => ({ label, value }));
const scopeOptions = (scopes: readonly PoolScope[]) =>
  scopes.map((scope) => ({ label: scopeLabels[scope], value: scope }));
const statusOptions = POOL_STATUSES.map((status) => ({
  label: statusLabels[status],
  value: status,
}));

function Field({
  label,
  id,
  hint,
  children,
}: {
  label: string;
  id?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      {id ? (
        <Label htmlFor={id}>{label}</Label>
      ) : (
        <p className="type-body-sm font-medium">{label}</p>
      )}
      {children}
      {hint ? (
        <p className="type-caption text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

const useRefresh = () => {
  const utils = api.useUtils();
  return () => utils.servingPool.list.invalidate();
};

/** Adds a member from the directory to a role, or to Litur/PA Besar. */
export function AddDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const accounts = api.people.accounts.useQuery(undefined, { enabled: open });
  const refresh = useRefresh();
  const [userId, setUserId] = useState("");
  const [group, setGroup] = useState("litur_pa");
  /** Which Litur/PA Besar roles: both, or just one of them. */
  const [part, setPart] = useState<string>("litur_pa");
  const [scope, setScope] = useState<PoolScope>("both");
  useEffect(() => {
    if (open) {
      setUserId("");
      setGroup("litur_pa");
      setPart("litur_pa");
      setScope("both");
    }
  }, [open]);
  const target = group === "litur_pa" ? part : group;
  const entries = poolEntriesFor(target);
  const single = entries?.length === 1 ? entries[0] : undefined;
  const scopes = single ? scopesFor(single.role) : [];
  const add = api.servingPool.add.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      toast.success("Added to the serving pool.");
      await refresh();
      onOpenChange(false);
    },
  });
  const picked = accounts.data?.find((account) => account.id === userId);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to the serving pool</DialogTitle>
          <DialogDescription>
            Pick a member and the role they can serve in.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            add.mutate({
              group: target,
              scope: scopes.length > 1 ? scope : undefined,
              userId,
            });
          }}
        >
          <Field label={picked ? `Member: ${picked.name ?? ""}` : "Member"}>
            <Command className="rounded-md bg-secondary">
              <CommandInput placeholder="Search members…" />
              <CommandList className="max-h-48">
                <CommandEmpty>
                  {accounts.isPending ? "Loading members…" : "No member found."}
                </CommandEmpty>
                <CommandGroup>
                  {accounts.data?.map((account) => (
                    <CommandItem
                      aria-selected={account.id === userId}
                      key={account.id}
                      onSelect={() => setUserId(account.id)}
                      value={`${account.name ?? ""} ${account.id}`}
                    >
                      <PersonAvatar
                        person={{
                          image: account.image,
                          name: account.name ?? "Unnamed account",
                        }}
                        size="sm"
                      />
                      <span className="truncate">
                        {account.name ?? "Unnamed account"}
                      </span>
                      <Check
                        aria-hidden="true"
                        className={cn(
                          "ml-auto size-4",
                          account.id !== userId && "invisible"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </Field>
          <AdminSelect
            id="pool-group"
            label="Role"
            onChange={setGroup}
            options={groupOptions}
            value={group}
          />
          {group === "litur_pa" ? (
            <Field
              hint="Liturgists lead the service; leaders lead PA Besar."
              label="Serves as"
            >
              <AdminSegmented
                label="Serves as"
                onChange={setPart}
                options={LITUR_PA_PARTS}
                value={part}
              />
            </Field>
          ) : null}
          {scopes.length > 1 ? (
            <Field label="Serves at">
              <AdminSegmented
                label="Serves at"
                onChange={(value) => setScope(value as PoolScope)}
                options={scopeOptions(scopes)}
                value={scope}
              />
            </Field>
          ) : null}
          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button disabled={!userId || add.isPending} type="submit">
              {add.isPending ? "Adding…" : "Add to pool"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Changes an entry's stored status (active or backup) and scope. */
export function EditDialog({
  entry,
  onOpenChange,
}: {
  entry: PoolEntry | undefined;
  onOpenChange: (open: boolean) => void;
}) {
  const refresh = useRefresh();
  const [status, setStatus] = useState<PoolStatus>("active");
  const [scope, setScope] = useState<PoolScope>("both");
  useEffect(() => {
    if (entry) {
      setStatus(entry.storedStatus);
      setScope(entry.scope);
    }
  }, [entry]);
  const update = api.servingPool.update.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      toast.success("Saved.");
      await refresh();
      onOpenChange(false);
    },
  });
  const scopes = entry ? scopesFor(entry.role) : [];

  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(entry)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {entry
              ? `${entryName(entry)}, ${servingRoleLabels[entry.role]}`
              : "Edit"}
          </DialogTitle>
          <DialogDescription>
            Backups are asked when no active member can serve.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (entry) {
              update.mutate({ id: entry.id, scope, status });
            }
          }}
        >
          <Field label="Status">
            <AdminSegmented
              label="Status"
              onChange={(value) => setStatus(value as PoolStatus)}
              options={statusOptions}
              value={status}
            />
          </Field>
          {scopes.length > 1 ? (
            <Field label="Serves at">
              <AdminSegmented
                label="Serves at"
                onChange={(value) => setScope(value as PoolScope)}
                options={scopeOptions(scopes)}
                value={scope}
              />
            </Field>
          ) : null}
          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button disabled={update.isPending} type="submit">
              {update.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Pauses an entry through a day, with a note only staff see. When the person
 * has other roles, they're paused too unless unticked.
 */
export function PauseDialog({
  entry,
  others,
  onOpenChange,
}: {
  entry: PoolEntry | undefined;
  /** The person's other pool entries that aren't paused yet. */
  others: PoolEntry[];
  onOpenChange: (open: boolean) => void;
}) {
  const refresh = useRefresh();
  const [until, setUntil] = useState<Date | undefined>();
  const [note, setNote] = useState("");
  const [everyRole, setEveryRole] = useState(true);
  useEffect(() => {
    if (entry) {
      setUntil(undefined);
      setNote("");
      setEveryRole(true);
    }
  }, [entry]);
  const pause = api.servingPool.pause.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      toast.success("Paused.");
      await refresh();
      onOpenChange(false);
    },
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const name = entry ? entryName(entry) : "";

  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(entry)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pause {name}</DialogTitle>
          <DialogDescription>
            {entry ? servingRoleLabels[entry.role] : ""}. They show as available
            again the day after the pause ends.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (entry && until) {
              pause.mutate({
                ids: [
                  entry.id,
                  ...(everyRole ? others.map((other) => other.id) : []),
                ],
                note: note.trim() || undefined,
                until: format(until, "yyyy-MM-dd"),
              });
            }
          }}
        >
          <Field
            hint={until ? `Until ${format(until, "PPP")}` : "Pick the last day"}
            label="Paused until"
          >
            <Calendar
              className="w-fit rounded-md bg-secondary"
              disabled={{ before: today }}
              mode="single"
              onSelect={setUntil}
              selected={until}
            />
          </Field>
          <Field
            hint="Only staff see this note."
            id="pause-note"
            label="Reason"
          >
            <Textarea
              id="pause-note"
              maxLength={MAX_NOTE}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. Exams until the end of term"
              value={note}
            />
          </Field>
          {others.length ? (
            <div className="flex items-start gap-3">
              <Checkbox
                checked={everyRole}
                id="pause-every-role"
                onCheckedChange={(checked) => setEveryRole(checked === true)}
              />
              <Label
                className="type-body-sm leading-snug"
                htmlFor="pause-every-role"
              >
                Also pause{" "}
                {others
                  .map((other) => servingRoleLabels[other.role])
                  .join(", ")}
              </Label>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button disabled={!until || pause.isPending} type="submit">
              {pause.isPending ? "Pausing…" : "Pause"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
