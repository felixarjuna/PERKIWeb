"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Circle, CircleCheck, CircleDashed } from "lucide-react";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import type { DataTableFeatures } from "~/components/data-table/data-table-features";
import { Badge } from "~/components/ui/badge";
import type { ProfileState } from "~/lib/profile-completion";
import { roleBadgeStyles } from "~/lib/role-badge-styles";
import { ROLES, type Role, roleLabels } from "~/lib/roles";
import { cn } from "~/lib/utils";
import {
  birthdayMonth,
  birthdayOrder,
  type Member,
  memberCompletion,
  memberDate,
  memberName,
  memberRole,
  memberSearchText,
  normalizeLocation,
  profileLabel,
  registeredTime,
} from "./member-model";

const MISSING = normalizeLocation(null);
/** Done, partly filled in, not started: readable at a glance in the table. */
const PROFILE_ICONS: Record<ProfileState, typeof Circle> = {
  complete: CircleCheck,
  incomplete: CircleDashed,
  "not-started": Circle,
};

export type MemberColumn = ColumnDef<DataTableFeatures, Member>;

function Missing() {
  return <span className="text-muted-foreground">Not provided</span>;
}

/**
 * Long free text stays on one line at a capped width (unpinned columns would
 * otherwise grow to fit it); hovering shows all of it.
 */
function Truncated({
  className,
  value,
}: {
  className: string;
  value: string | undefined;
}) {
  return value ? (
    <span className={cn("block truncate", className)} title={value}>
      {value}
    </span>
  ) : (
    <Missing />
  );
}

/**
 * Column definitions for the member directory. `onOpen` receives the member
 * and the button that opened the profile, so focus can return to it.
 */
export function createMemberColumns(
  onOpen: (member: Member, origin: HTMLElement) => void
): MemberColumn[] {
  return [
    {
      // Hidden column that carries the free-text search.
      accessorFn: memberSearchText,
      enableHiding: false,
      enableSorting: false,
      filterFn: "includesString",
      id: "search",
    },
    {
      // Hidden column behind the birthday-month facet filter.
      accessorFn: birthdayMonth,
      enableHiding: false,
      enableSorting: false,
      filterFn: "arrHas",
      id: "birthdayMonth",
    },
    {
      accessorFn: memberName,
      cell: ({ row }) => {
        const member = row.original;
        return (
          // w-44 = column size 200 minus the cell's horizontal padding.
          <div className="flex w-44 min-w-0 flex-col">
            <button
              className="type-body-sm -mx-1 truncate rounded-sm px-1 text-left text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={(event) => onOpen(member, event.currentTarget)}
              type="button"
            >
              {memberName(member)}
            </button>
            <span className="type-caption truncate text-muted-foreground">
              {member.user.email ?? "No email"}
            </span>
          </div>
        );
      },
      enableHiding: false,
      header: ({ column }) => (
        <DataTableColumnHeader
          ascLabel="A–Z"
          column={column}
          descLabel="Z–A"
          label="Member"
        />
      ),
      id: "name",
      meta: { label: "Member" },
      size: 200,
      sortFn: "text",
    },
    {
      accessorFn: memberRole,
      cell: ({ getValue }) => (
        <Badge size="status" {...roleBadgeStyles[getValue<Role>()]}>
          {roleLabels[getValue<Role>()]}
        </Badge>
      ),
      filterFn: "arrHas",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Role" />
      ),
      id: "role",
      meta: { label: "Role" },
      size: 110,
      sortFn: (left, right, id) =>
        ROLES.indexOf(left.getValue<Role>(id)) -
        ROLES.indexOf(right.getValue<Role>(id)),
    },
    {
      accessorFn: (member) => memberCompletion(member).state,
      cell: ({ row }) => {
        const Icon = PROFILE_ICONS[memberCompletion(row.original).state];
        return (
          <Badge icon={Icon} size="status" variant="published">
            {profileLabel(row.original)}
          </Badge>
        );
      },
      filterFn: "arrHas",
      header: ({ column }) => (
        <DataTableColumnHeader
          ascLabel="Least first"
          column={column}
          descLabel="Most first"
          label="Profile"
        />
      ),
      id: "profile",
      meta: { label: "Profile" },
      size: 120,
      sortFn: (left, right) =>
        memberCompletion(left.original).filled -
          memberCompletion(right.original).filled ||
        Number(left.original.profiles !== null) -
          Number(right.original.profiles !== null),
    },
    {
      accessorFn: (member) => member.profiles?.phoneNumber?.trim() || undefined,
      cell: ({ getValue }) => getValue<string | undefined>() ?? <Missing />,
      enableSorting: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Phone" />
      ),
      id: "phone",
      meta: { className: "tabular-nums", label: "Phone" },
      size: 160,
    },
    {
      accessorFn: (member) =>
        normalizeLocation(member.profiles?.location ?? null),
      cell: ({ row }) => row.original.profiles?.location?.trim() || <Missing />,
      filterFn: "arrHas",
      header: ({ column }) => (
        <DataTableColumnHeader
          ascLabel="A–Z"
          column={column}
          descLabel="Z–A"
          label="Location"
        />
      ),
      id: "location",
      meta: { label: "Location" },
      size: 150,
      sortFn: (left, right, id) => {
        const a = left.getValue<string>(id);
        const b = right.getValue<string>(id);
        if (a === MISSING || b === MISSING) {
          return Number(a === MISSING) - Number(b === MISSING);
        }
        return a.localeCompare(b);
      },
    },
    {
      accessorFn: birthdayOrder,
      cell: ({ row }) => {
        const birthday = row.original.profiles?.birthday ?? null;
        return birthdayOrder(row.original) ? (
          memberDate(birthday, true)
        ) : (
          <Missing />
        );
      },
      header: ({ column }) => (
        <DataTableColumnHeader
          ascLabel="January first"
          column={column}
          descLabel="December first"
          label="Birthday"
        />
      ),
      id: "birthday",
      meta: { className: "tabular-nums", label: "Birthday" },
      size: 130,
      sortFn: "basic",
      sortUndefined: "last",
    },
    {
      accessorFn: registeredTime,
      cell: ({ row }) =>
        registeredTime(row.original) ? (
          memberDate(row.original.profiles?.createdAt ?? null)
        ) : (
          <Missing />
        ),
      header: ({ column }) => (
        <DataTableColumnHeader
          ascLabel="Oldest first"
          column={column}
          descLabel="Newest first"
          label="Registered"
        />
      ),
      id: "registered",
      meta: { className: "tabular-nums", label: "Registered" },
      size: 140,
      sortDescFirst: true,
      sortFn: "basic",
      sortUndefined: "last",
    },
    {
      accessorFn: (member) => member.profiles?.major?.trim() || undefined,
      cell: ({ getValue }) => getValue<string | undefined>() ?? <Missing />,
      header: ({ column }) => (
        <DataTableColumnHeader
          ascLabel="A–Z"
          column={column}
          descLabel="Z–A"
          label="Major"
        />
      ),
      id: "major",
      meta: { label: "Major" },
      size: 200,
      sortFn: "text",
      sortUndefined: "last",
    },
    {
      accessorFn: (member) => member.profiles?.address?.trim() || undefined,
      cell: ({ getValue }) => (
        <Truncated
          className="max-w-56"
          value={getValue<string | undefined>()}
        />
      ),
      enableSorting: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Address" />
      ),
      id: "address",
      meta: { label: "Address" },
      size: 240,
    },
    {
      accessorFn: (member) => member.profiles?.bio?.trim() || undefined,
      cell: ({ getValue }) => (
        <Truncated
          className="max-w-64"
          value={getValue<string | undefined>()}
        />
      ),
      enableSorting: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Bio" />
      ),
      id: "bio",
      meta: { label: "Bio" },
      size: 280,
    },
  ];
}
