"use client";

import { CalendarPlus, Copy, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useSyncExternalStore } from "react";
import { toast } from "sonner";
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
import { Button, buttonVariants } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api, type RouterOutputs } from "~/trpc/react";

type Feed = NonNullable<RouterOutputs["calendarFeed"]["mine"]>;

const HTTP = /^https?:/;

/** The same link for calendar apps, which subscribe to `webcal:` addresses. */
const webcal = (url: string) => url.replace(HTTP, "webcal:");

/** Google Calendar subscribes to a feed it's given as a webcal address. */
export const googleCalendarUrl = (url: string) =>
  `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(
    webcal(url)
  )}`;

const noSubscription = () => () => undefined;

/** The site's origin in the browser; empty while rendering on the server. */
const useOrigin = () =>
  useSyncExternalStore(
    noSubscription,
    () => window.location.origin,
    () => ""
  );

async function copy(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied", {
      description: "Add it to your calendar app as a subscription.",
    });
  } catch {
    toast.error("Couldn't copy the link. Select it and copy it yourself.");
  }
}

/**
 * The member's private calendar link (#105): their duties as a feed that
 * Google Calendar or a phone keeps up to date. A new link ends the old one.
 */
export default function CalendarLink({ feed }: { feed: Feed | null }) {
  const id = useId();
  const linkId = useId();
  const router = useRouter();
  const origin = useOrigin();
  const regenerate = api.calendarFeed.regenerate.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: () => {
      toast.success(
        feed
          ? "New link made. The old one no longer works."
          : "Your calendar link is ready."
      );
      router.refresh();
    },
  });
  const url = feed ? `${origin}${feed.path}` : "";
  return (
    <section aria-labelledby={id} className="space-y-4">
      <div className="space-y-1">
        <h2 className="type-heading" id={id}>
          Add to your calendar
        </h2>
        <p className="type-body-sm text-pretty text-muted-foreground">
          Your duties appear in Google Calendar or on your phone, and update
          when the schedule changes.
        </p>
      </div>
      {feed ? (
        <div className="space-y-4 rounded-xl bg-card p-4 sm:p-6">
          <div className="grid gap-2">
            <Label htmlFor={linkId}>Your calendar link</Label>
            <div className="flex gap-2">
              <Input
                className="min-w-0 font-mono text-xs"
                id={linkId}
                onFocus={(event) => event.target.select()}
                readOnly
                value={url}
              />
              <Button
                aria-label="Copy link"
                className="shrink-0"
                disabled={!url}
                onClick={() => copy(url)}
                size="icon"
                type="button"
                variant="secondary"
              >
                <Copy aria-hidden="true" className="size-4" />
              </Button>
            </div>
            <p className="type-caption text-pretty text-muted-foreground">
              Keep it to yourself: anyone with this link sees your duties.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              className={buttonVariants({ variant: "default" })}
              href={url ? googleCalendarUrl(url) : undefined}
              rel="noopener noreferrer"
              target="_blank"
            >
              <CalendarPlus aria-hidden="true" className="size-4" />
              Add to Google Calendar
            </a>
            <a
              className={buttonVariants({ variant: "secondary" })}
              href={url ? webcal(url) : undefined}
            >
              Open in calendar app
            </a>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={regenerate.isPending}
                  type="button"
                  variant="ghost"
                >
                  <RefreshCw aria-hidden="true" className="size-4" />
                  New link
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Make a new calendar link?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The old link stops working right away, so calendars that use
                    it stop showing your duties. Add the new link to them
                    afterwards.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep this link</AlertDialogCancel>
                  <AlertDialogAction onClick={() => regenerate.mutate()}>
                    Make a new link
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ) : (
        <Button
          className="w-fit"
          disabled={regenerate.isPending}
          onClick={() => regenerate.mutate()}
          type="button"
          variant="secondary"
        >
          <CalendarPlus aria-hidden="true" className="size-4" />
          {regenerate.isPending ? "Making your link…" : "Get calendar link"}
        </Button>
      )}
    </section>
  );
}
