"use client";

import { Bot } from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { SidebarMenuButton, SidebarMenuItem } from "~/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn, timeAgo } from "~/lib/utils";
import { api } from "~/trpc/react";

const REFRESH_MS = 60_000;

const clock = (date: Date) =>
  DateTime.fromJSDate(date).setLocale("en").toFormat("HH:mm");

/**
 * Sidebar label and tooltip text. Checks run every minute, so "when was it
 * last checked" is always seconds ago; what's worth showing is the clock time
 * and, when it's down, how long it has been silent.
 */
export function botStatusText({
  status,
  failed,
  lastOnlineAt,
  now = new Date(),
}: {
  status?: { checkedAt: Date; latencyMs: number | null; online: boolean };
  /** The status check itself failed (not the bot). */
  failed: boolean;
  /** Last response seen while this page was open. */
  lastOnlineAt: Date | null;
  now?: Date;
}) {
  if (!status) {
    return failed
      ? { detail: "The status check itself failed.", label: "Unknown" }
      : { detail: "Checking whether perki.bot responds.", label: "Checking…" };
  }
  if (status.online) {
    return {
      detail: `Responding in ${status.latencyMs} ms. Checked every minute, last at ${clock(status.checkedAt)}.`,
      label: "Online",
    };
  }
  const since = lastOnlineAt
    ? `No response since ${clock(lastOnlineAt)} (${timeAgo(lastOnlineAt, now)}).`
    : "Not responding.";
  return {
    detail: `${since} Birthday messages may not be sent.`,
    label: "Offline",
  };
}

/**
 * Live reachability of perki.bot, the Discord birthday worker. The row is a
 * button that checks again; the details live in its tooltip, which Radix
 * also exposes to screen readers as the button's description.
 */
export function BotStatus() {
  const query = api.bot.status.useQuery(undefined, {
    refetchInterval: REFRESH_MS,
    retry: false,
    staleTime: REFRESH_MS / 2,
  });
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(null);
  useEffect(() => {
    if (query.data?.online) {
      setLastOnlineAt(query.data.checkedAt);
    }
  }, [query.data]);
  const online = query.data?.online;
  const { label, detail } = botStatusText({
    failed: query.isError,
    lastOnlineAt,
    status: query.data,
  });
  const shown = query.isFetching ? "Checking…" : label;
  return (
    <SidebarMenuItem>
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarMenuButton
            onClick={() => {
              query.refetch();
            }}
            type="button"
          >
            {/* The status dot sits on the icon's corner, so it stays visible when the sidebar collapses to icons. */}
            <span className="relative flex shrink-0">
              <Bot aria-hidden="true" className="size-4" />
              <span className="absolute -top-1 -right-1 flex size-2">
                {online ? (
                  <span className="absolute size-2 animate-ping rounded-full bg-primary/60 motion-reduce:hidden" />
                ) : null}
                <span
                  className={cn(
                    "relative size-2 rounded-full",
                    online === undefined && "bg-muted-foreground",
                    online === true && "bg-primary",
                    online === false && "bg-destructive"
                  )}
                />
              </span>
            </span>
            <span>
              perki.bot <span className="text-muted-foreground">· {shown}</span>
            </span>
          </SidebarMenuButton>
        </TooltipTrigger>
        <TooltipContent className="max-w-64" side="right">
          <p>{detail}</p>
          <p className="text-background/70">Click to check again.</p>
        </TooltipContent>
      </Tooltip>
    </SidebarMenuItem>
  );
}
