"use client";

import { DateTime } from "luxon";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { buttonVariants } from "~/components/ui/button";
import { api, type RouterOutputs } from "~/trpc/react";
import { QueryMessage } from "../admin-controls";
import { TakeawayStatusBadge } from "./takeaway-status-badge";

type Item = RouterOutputs["writerAssignments"]["mine"]["items"][number];
const GROUPS = [
  { label: "To write", status: "not_started" },
  { label: "Drafts", status: "draft" },
  { label: "In review", status: "in_review" },
  { label: "Published", status: "published" },
] as const;
const REFRESH_INTERVAL = 60_000;
export const assignmentQueryOptions = {
  refetchInterval: REFRESH_INTERVAL,
  refetchOnMount: "always",
  staleTime: 0,
} as const;

function AssignmentCard({ item, staff }: { item: Item; staff: boolean }) {
  const existingLabel =
    item.status === "draft" ? "Continue draft" : "Open takeaway";
  const actionLabel =
    item.takeawayId === null ? "Write takeaway" : existingLabel;
  const date = (value: Date) =>
    DateTime.fromJSDate(value, { zone: "Europe/Berlin" }).toFormat(
      "d LLL yyyy"
    );
  return (
    <li className="rounded-xl bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="type-caption text-muted-foreground">{date(item.date)}</p>
        <div className="ms-auto flex flex-wrap justify-end gap-2">
          {item.status === "not_started" ? (
            <Badge variant="secondary">Not started</Badge>
          ) : (
            <TakeawayStatusBadge value={item.status} />
          )}
          {item.overdue ? <Badge variant="destructive">Overdue</Badge> : null}
        </div>
      </div>
      <h3 className="type-subheading mt-2 break-words">{item.title}</h3>
      {staff ? (
        <p className="type-body-sm mt-1">
          {item.writerName}
          {item.linked ? "" : " · Not linked to an account"}
        </p>
      ) : null}
      <p className="type-caption mt-2 text-muted-foreground">
        Due {date(item.dueAt)} · end of day in Aachen
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Link
          className={buttonVariants({ size: "sm", variant: "secondary" })}
          href={
            item.takeawayId === null
              ? "/admin/takeaways/new"
              : `/admin/takeaways/${item.takeawayId}${item.status === "draft" ? "/edit" : ""}`
          }
        >
          {actionLabel}
        </Link>
      </div>
      {item.takeawayId === null ? (
        <p className="type-caption mt-2 text-muted-foreground">
          Choose this gathering in the takeaway form.
        </p>
      ) : null}
    </li>
  );
}

export function WriterAssignments({ staff = false }: { staff?: boolean }) {
  const mine = api.writerAssignments.mine.useQuery(undefined, {
    ...assignmentQueryOptions,
    enabled: !staff,
  });
  const all = api.writerAssignments.all.useQuery(undefined, {
    ...assignmentQueryOptions,
    enabled: staff,
  });
  const query = staff ? all : mine;
  if (query.isLoading) {
    return <QueryMessage>Loading assignments…</QueryMessage>;
  }
  if (query.isError) {
    return (
      <QueryMessage
        error
        onRetry={() => {
          query.refetch();
        }}
      />
    );
  }
  const items = query.data?.items ?? [];
  if (!items.length) {
    return (
      <QueryMessage>
        {staff
          ? "No writer assignments yet."
          : "You have no assigned gatherings or takeaways yet."}
      </QueryMessage>
    );
  }
  return (
    <div className="space-y-6">
      {GROUPS.map((group) => {
        const rows = items.filter((item) => item.status === group.status);
        return rows.length ? (
          <section aria-label={group.label} key={group.status}>
            <h2 className="type-heading mb-3">
              {group.label}{" "}
              <span className="type-caption text-muted-foreground">
                ({rows.length})
              </span>
            </h2>
            <ul className="grid gap-3">
              {rows.map((item) => (
                <AssignmentCard item={item} key={item.key} staff={staff} />
              ))}
            </ul>
          </section>
        ) : null;
      })}
    </div>
  );
}
