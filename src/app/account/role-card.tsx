"use client";

import { LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { toast } from "sonner";
import { navigationFor } from "~/components/admin/admin-navigation";
import { Button, buttonVariants } from "~/components/ui/button";
import { roleBadgeStyles } from "~/lib/role-badge-styles";
import { historyDate, joinedLine, roleChangeLine } from "~/lib/role-history";
import {
  canWriteTakeaways,
  normalizeRole,
  type Role,
  roleLabels,
} from "~/lib/roles";
import { cn } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";

/** Anchor the takeaway page's "Ask to become a writer" hint links to. */
export const ROLE_CARD_ID = "your-role";

const allows: Record<Role, string> = {
  member: "Want to write the takeaways from our services?",
  mita: "You can manage the website and write takeaways",
  owner: "Full access",
  writer: "You can write takeaways",
};

/** What the card says under the role, given the member's latest request. */
function statusLine(role: Role, status: string | undefined) {
  if (role === "member" && status === "pending") {
    return "Request sent, waiting for a mita";
  }
  if (role === "member" && status === "declined") {
    return "Your request to become a writer was declined";
  }
  if (role === "writer" && status === "approved") {
    return "Your request was approved. You can write takeaways";
  }
  return allows[role];
}

type History = RouterOutputs["roles"]["myHistory"];

/** One step of the history: a dot on the line, what happened and when. */
function HistoryItem({ detail, title }: { detail: string; title: string }) {
  return (
    <li className="group relative flex gap-3 pb-4 last:pb-0">
      {/* The line runs from this dot down to the next one. */}
      <span
        aria-hidden="true"
        className="relative flex w-10 shrink-0 justify-center before:absolute before:top-3 before:bottom-[-1rem] before:w-px before:bg-secondary group-last:before:hidden"
      >
        <span className="relative mt-1.5 size-2.5 rounded-full bg-muted-foreground" />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="type-body-sm">{title}</span>
        <span className="type-caption text-muted-foreground">{detail}</span>
      </div>
    </li>
  );
}

/** The member's time in the fellowship, newest first, ending with joining. */
function HistoryList({ history }: { history: History }) {
  if (!(history.joined || history.changes.length)) {
    return null;
  }
  const joined = history.joined ? joinedLine(history.joined) : null;
  return (
    <ol aria-label="Your history" className="flex flex-col">
      {history.changes.map((change) => {
        const line = roleChangeLine(change);
        const date = historyDate(change.createdAt);
        return (
          <HistoryItem
            detail={line.detail ? `${line.detail} · ${date}` : date}
            key={change.id}
            title={line.title}
          />
        );
      })}
      {joined ? (
        <HistoryItem detail={joined.date} title={joined.title} />
      ) : null}
    </ol>
  );
}

/**
 * The signed-in person's role and what it allows, and their history: when
 * they joined and every change of their role. Members can ask to become
 * a writer here; the card then shows the request until a mita answers it.
 * Everyone with admin access gets a link into the workspace.
 */
export default function RoleCard() {
  const utils = api.useUtils();
  const statusRef = useRef<HTMLParagraphElement>(null);
  const { data: stored } = api.roles.myRole.useQuery();
  const { data: myRequest } = api.access.myRequest.useQuery();
  const { data: history } = api.roles.myHistory.useQuery();
  const request = api.access.request.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      await utils.access.myRequest.invalidate();
      // The button is gone now; keep keyboard focus on the new status.
      statusRef.current?.focus();
    },
  });
  if (stored === undefined || myRequest === undefined) {
    return null;
  }
  const role = normalizeRole(stored);
  const status = myRequest?.status;
  const canAsk = role === "member" && status !== "pending";
  const Icon = roleBadgeStyles[role].icon;

  return (
    <section
      className="flex scroll-mt-28 flex-col gap-5 rounded-xl bg-card p-4 sm:p-6"
      id={ROLE_CARD_ID}
    >
      {/* Wraps on phones, so the workspace link sits under the text. */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <div className="flex min-w-0 flex-1 basis-48 flex-col">
          <h2 className="type-body">Your role: {roleLabels[role]}</h2>
          <p
            className="type-body-sm text-muted-foreground outline-none"
            ref={statusRef}
            tabIndex={-1}
          >
            {statusLine(role, status)}
          </p>
        </div>
        {canAsk ? (
          <Button
            aria-label={
              status === "declined"
                ? "Ask again to become a writer"
                : "Ask to become a writer"
            }
            className="shrink-0"
            disabled={request.isPending}
            onClick={() => request.mutate({ role: "writer" })}
            size="sm"
            type="button"
            variant={status === "declined" ? "secondary" : "default"}
          >
            {status === "declined" ? "Ask again" : "Ask"}
          </Button>
        ) : null}
        {canWriteTakeaways(role) ? (
          <Link
            className={cn(
              buttonVariants({ size: "sm", variant: "secondary" }),
              "shrink-0 max-sm:ml-13"
            )}
            href={navigationFor(role)[0].url}
          >
            <LayoutDashboard aria-hidden="true" className="size-4" />
            Open workspace
          </Link>
        ) : null}
      </div>
      {history ? <HistoryList history={history} /> : null}
    </section>
  );
}
