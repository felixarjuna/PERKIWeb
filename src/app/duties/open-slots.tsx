"use client";

import { CircleAlert, Info } from "lucide-react";
import { DateTime } from "luxon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { servingRoleLabels } from "~/lib/serving-roles";
import { api, type RouterOutputs } from "~/trpc/react";

export type OpenSlot = RouterOutputs["schedules"]["openSlots"]["slots"][number];

/** Gatherings happen in Aachen, so times read in its zone for everyone. */
const ZONE = "Europe/Berlin";
/** How far ahead the list looks; the server's `OPEN_SLOT_WEEKS`. */
const WEEKS = 8;

const when = (date: Date, type: OpenSlot["type"]) =>
  `${DateTime.fromJSDate(date).setZone(ZONE).toFormat("ccc d LLL · HH:mm")} · ${
    type === "church_service" ? "Service" : "Bible study"
  }`;

/** The open slots of one gathering, in the order the server sent them. */
const byGathering = (slots: OpenSlot[]) => {
  const gatherings = new Map<number, OpenSlot[]>();
  for (const slot of slots) {
    gatherings.set(slot.scheduleId, [
      ...(gatherings.get(slot.scheduleId) ?? []),
      slot,
    ]);
  }
  return [...gatherings.values()];
};

/** A note under a slot: why it can't be taken, or a warning that doesn't stop it. */
function SlotNote({
  children,
  refusal,
}: {
  children: string;
  refusal: boolean;
}) {
  const Icon = refusal ? CircleAlert : Info;
  return (
    <p className="type-caption mt-1 flex gap-1.5 text-pretty text-muted-foreground">
      <Icon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
      {children}
    </p>
  );
}

/**
 * Empty slots in the member's roles over the coming weeks. One tap takes a
 * slot; the server checks the rules again and says why when it refuses.
 */
export default function OpenSlots({
  active,
  slots,
}: {
  active: boolean;
  slots: OpenSlot[];
}) {
  const id = useId();
  const router = useRouter();
  const take = api.schedules.takeSlot.useMutation({
    onError: (error) => {
      toast.error(error.message);
      router.refresh();
    },
    onSuccess: (result, input) => {
      const role = servingRoleLabels[input.role];
      toast.success(`You're on the schedule as ${role}.`, {
        description: result.warning ?? undefined,
      });
      router.refresh();
    },
  });
  if (!active) {
    return null;
  }
  return (
    <section aria-labelledby={id} className="space-y-4">
      <div className="space-y-1">
        <h2 className="type-heading" id={id}>
          Open slots
        </h2>
        <p className="type-body-sm text-pretty text-muted-foreground">
          Still empty in your roles. Take one and it's yours straight away.
        </p>
      </div>
      {slots.length === 0 ? (
        <p className="type-body-sm rounded-xl bg-card p-4 text-muted-foreground sm:p-6">
          No open slots in your roles in the next {WEEKS} weeks.
        </p>
      ) : (
        <ul className="space-y-3">
          {byGathering(slots).map((gathering) => {
            const [first] = gathering;
            if (!first) {
              return null;
            }
            return (
              <li
                aria-label={first.title}
                className="rounded-xl bg-card p-4 sm:p-6"
                key={first.scheduleId}
              >
                <p className="type-caption text-muted-foreground tabular-nums">
                  {when(first.date, first.type)}
                </p>
                <Link
                  className="type-body mt-0.5 block break-words rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/schedule/${first.scheduleId}`}
                >
                  {first.title}
                </Link>
                <ul className="mt-3 divide-y divide-border">
                  {gathering.map((slot) => {
                    const label = servingRoleLabels[slot.role];
                    const taking =
                      take.isPending &&
                      take.variables?.scheduleId === slot.scheduleId &&
                      take.variables.role === slot.role;
                    return (
                      <li
                        className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                        key={slot.role}
                      >
                        <div className="min-w-0">
                          <p className="type-body-sm">{label}</p>
                          {slot.refusal ? (
                            <SlotNote refusal>{slot.refusal}</SlotNote>
                          ) : null}
                          {!slot.refusal && slot.warning ? (
                            <SlotNote refusal={false}>{slot.warning}</SlotNote>
                          ) : null}
                        </div>
                        {slot.refusal ? null : (
                          <Button
                            aria-label={`Take ${label}`}
                            disabled={take.isPending}
                            onClick={() =>
                              take.mutate({
                                role: slot.role,
                                scheduleId: slot.scheduleId,
                              })
                            }
                            size="sm"
                            type="button"
                          >
                            {taking ? "Taking…" : "Take"}
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
