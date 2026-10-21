"use client";

import { Pencil, Plus } from "lucide-react";
import { DateTime } from "luxon";
import React from "react";
import { toast } from "sonner";
import { AdminSelect, QueryMessage } from "~/components/admin/admin-controls";
import { PersonAvatar } from "~/components/person-avatar";
import { Button } from "~/components/ui/button";
import { api, type RouterOutputs } from "~/trpc/react";
import { SpeakerDialog } from "./speaker-dialog";

type Speaker = RouterOutputs["speakers"]["all"][number];
type Unmatched = RouterOutputs["speakers"]["unmatched"][number];

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

function UnmatchedRow({
  entry,
  speakers,
  onCreate,
}: {
  entry: Unmatched;
  speakers: Speaker[];
  onCreate: (name: string) => void;
}) {
  const utils = api.useUtils();
  const addSpelling = api.speakers.addSpelling.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async (_, input) => {
      await Promise.all([
        utils.speakers.invalidate(),
        utils.schedules.invalidate(),
      ]);
      const speaker = speakers.find((candidate) => candidate.id === input.id);
      toast.success(
        `“${entry.name}” now points to ${speaker?.name ?? "the speaker"}`
      );
    },
  });
  const id = `unmatched-${entry.name}`;
  return (
    <li className="flex flex-col gap-3 rounded-xl bg-card p-4 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1">
        <p className="type-body break-words">{entry.name}</p>
        <p className="type-caption text-muted-foreground">
          {plural(entry.count, "sermon")} · last on{" "}
          {DateTime.fromJSDate(entry.last).toFormat("d LLL yyyy")}
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <AdminSelect
          className="w-56"
          id={id}
          label="Same person as"
          onChange={(value) => {
            if (value) {
              addSpelling.mutate({ id: Number(value), name: entry.name });
            }
          }}
          options={[
            { label: "Choose a speaker", value: "" },
            ...speakers.map((speaker) => ({
              label: speaker.name,
              value: String(speaker.id),
            })),
          ]}
          value=""
        />
        <Button
          onClick={() => onCreate(entry.name)}
          type="button"
          variant="secondary"
        >
          New speaker
        </Button>
      </div>
    </li>
  );
}

/** Guest speakers, and preacher names on schedules that match none of them yet. */
export default function SpeakerManager() {
  const all = api.speakers.all.useQuery();
  const unmatched = api.speakers.unmatched.useQuery();
  const [dialog, setDialog] = React.useState<{
    name?: string;
    open: boolean;
    speaker?: Speaker;
  }>({ open: false });

  if (all.isError || unmatched.isError) {
    return (
      <QueryMessage
        error
        onRetry={() => Promise.all([all.refetch(), unmatched.refetch()])}
      />
    );
  }
  if (all.isPending || unmatched.isPending) {
    return <QueryMessage>Loading speakers…</QueryMessage>;
  }

  return (
    <div className="@container space-y-10">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="type-subheading">
            Speakers{" "}
            <span className="text-muted-foreground">{all.data.length}</span>
          </h2>
          <Button onClick={() => setDialog({ open: true })} type="button">
            <Plus aria-hidden="true" />
            Add speaker
          </Button>
        </div>
        <ul className="grid @3xl:grid-cols-2 gap-2">
          {all.data.map((speaker) => (
            <li
              className="flex items-start gap-4 rounded-xl bg-card p-4"
              key={speaker.id}
            >
              <PersonAvatar
                person={{ image: speaker.photoUrl, name: speaker.name }}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <p className="type-body break-words">{speaker.name}</p>
                <p className="type-caption text-muted-foreground">
                  {speaker.active ? "Active" : "Inactive"} ·{" "}
                  {plural(speaker.sermons, "sermon")}
                </p>
                {speaker.aliases.length > 0 ? (
                  <p className="type-caption mt-1 break-words text-muted-foreground">
                    Also written as {speaker.aliases.join(", ")}
                  </p>
                ) : null}
              </div>
              <Button
                aria-label={`Edit ${speaker.name}`}
                onClick={() => setDialog({ open: true, speaker })}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <Pencil aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      </section>

      {unmatched.data.length > 0 ? (
        <section className="space-y-3">
          <h2 className="type-subheading">
            Not matched yet{" "}
            <span className="text-muted-foreground">
              {unmatched.data.length}
            </span>
          </h2>
          <p className="type-body-sm text-muted-foreground">
            Preacher names on the schedule that match no speaker. Point one at
            an existing speaker if it's another spelling, or add them.
          </p>
          <ul className="grid gap-2">
            {unmatched.data.map((entry) => (
              <UnmatchedRow
                entry={entry}
                key={entry.name}
                onCreate={(name) => setDialog({ name, open: true })}
                speakers={all.data}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <SpeakerDialog
        name={dialog.name}
        onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
        open={dialog.open}
        speaker={dialog.speaker}
      />
    </div>
  );
}
