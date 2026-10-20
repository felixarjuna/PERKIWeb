"use client";

import { SidebarMenuButton, SidebarMenuItem } from "~/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn, timeAgo } from "~/lib/utils";
import { api } from "~/trpc/react";

const REFRESH_MS = 60_000;

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
  const online = query.data?.online;
  let label = "Checking…";
  let detail = "Checking whether perki.bot responds.";
  if (query.data) {
    const checked = timeAgo(query.data.checkedAt);
    label = online ? "Online" : "Offline";
    detail = online
      ? `Responded in ${query.data.latencyMs} ms, checked ${checked}.`
      : `No response, checked ${checked}. Birthday messages may not be sent.`;
  } else if (query.isError) {
    label = "Unknown";
    detail = "The status check itself failed.";
  }
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
            {/* ml-1 centres the 8px dot under the 16px nav icons above it. */}
            <span className="relative ml-1 flex size-2 shrink-0 items-center justify-center">
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
