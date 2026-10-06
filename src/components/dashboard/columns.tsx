import type { ColumnDef, SortingFn } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { DateTime } from "luxon";
import { Button } from "~/components/ui/button";
import type { RouterOutputs } from "~/trpc/react";

type UserProfile = RouterOutputs["profiles"]["getUserProfiles"][number];
const sortByMonth: SortingFn<UserProfile> = (profileA, profileB, columnId) => {
  const dateA = DateTime.fromJSDate(profileA.getValue(columnId));
  const dateB = DateTime.fromJSDate(profileB.getValue(columnId));

  /** handle null/undefine cases.  */
  if (!(dateA.isValid || dateB.isValid)) {
    return 0;
  }
  if (!dateA.isValid) {
    return 1;
  }
  if (!dateB.isValid) {
    return -1;
  }

  /** compare months. */
  const monthA = dateA.month;
  const monthB = dateB.month;

  /** compare days. */
  const dayA = dateA.day;
  const dayB = dateB.day;

  /** return in ascending order. */
  return monthA === monthB ? dayA - dayB : monthA - monthB;
};

export const columns: ColumnDef<UserProfile>[] = [
  {
    accessorFn: (row) => row.user?.name,
    accessorKey: "name",
    cell: ({ row }) => row.original.user?.name,
    header: ({ column }) => (
      <Button
        onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc");
        }}
        variant={column.getIsSorted() === "asc" ? "default" : "ghost"}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    size: 200,
  },
  {
    accessorFn: (row) => row.profiles.birthday,
    accessorKey: "birthday",
    cell: ({ row }) =>
      row.original.profiles.birthday
        ? DateTime.fromJSDate(row.original.profiles.birthday).toLocaleString(
            DateTime.DATE_FULL,
            { locale: "id" }
          )
        : "N/A",
    header: ({ column }) => (
      <Button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        variant={column.getIsSorted() === "asc" ? "default" : "ghost"}
      >
        Birthday
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    size: 200, // Fixed width in pixels
    sortingFn: sortByMonth,
  },
  {
    accessorKey: "major",
    cell: ({ row }) => row.original.profiles.major,
    header: "Major",
    size: 400,
  },
  {
    accessorKey: "phoneNumber",
    cell: ({ row }) => row.original.profiles.phoneNumber,
    header: "Phone Number",
  },
  {
    accessorKey: "location",
    cell: ({ row }) => row.original.profiles.location,
    header: "Location",
  },
  {
    accessorKey: "address",
    cell: ({ row }) => row.original.profiles.address,
    header: "Address",
    size: 400,
  },
  {
    accessorKey: "bio",
    cell: ({ row }) => row.original.profiles.bio,
    header: "Bio",
    size: 300,
  },
];
