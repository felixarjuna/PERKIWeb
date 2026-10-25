"use client";

import { Check } from "lucide-react";
import { PersonAvatar } from "~/components/person-avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { cn } from "~/lib/utils";
import type { RouterOutputs } from "~/trpc/react";

export type Account = RouterOutputs["people"]["accounts"][number];

export const accountName = (account: Account) =>
  account.name ?? "Unnamed account";

/**
 * Searches registered members by name, with their photo or initials. An
 * account `unavailable` returns a reason for is shown but can't be picked.
 */
export function MemberPicker({
  accounts,
  pending,
  value,
  onChange,
  unavailable,
}: {
  accounts: Account[] | undefined;
  pending: boolean;
  value: string;
  onChange: (userId: string) => void;
  unavailable?: (account: Account) => string | null;
}) {
  return (
    <Command className="rounded-md bg-secondary">
      <CommandInput placeholder="Search members…" />
      <CommandList className="max-h-48">
        <CommandEmpty>
          {pending ? "Loading members…" : "No member found."}
        </CommandEmpty>
        <CommandGroup>
          {accounts?.map((account) => {
            const reason = unavailable?.(account) ?? null;
            return (
              <CommandItem
                aria-selected={account.id === value}
                disabled={reason !== null}
                key={account.id}
                onSelect={() => onChange(account.id)}
                value={`${account.name ?? ""} ${account.id}`}
              >
                <PersonAvatar
                  person={{ image: account.image, name: accountName(account) }}
                  size="sm"
                />
                <span className="truncate">{accountName(account)}</span>
                {reason ? (
                  <span className="type-caption ml-auto shrink-0 text-muted-foreground">
                    {reason}
                  </span>
                ) : (
                  <Check
                    aria-hidden="true"
                    className={cn(
                      "ml-auto size-4",
                      account.id !== value && "invisible"
                    )}
                  />
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
