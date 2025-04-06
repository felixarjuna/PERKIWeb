import { type ColumnDef, type SortingFn } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { DateTime } from "luxon";
import { Button } from "~/components/ui/button";
import { type RouterOutputs } from "~/utils/api";

type UserProfile = RouterOutputs["profiles"]["getUserProfiles"][number];
const sortByMonth: SortingFn<UserProfile> = (profileA, profileB, columnId) => {
  const dateA = DateTime.fromJSDate(profileA.getValue(columnId));
  const dateB = DateTime.fromJSDate(profileB.getValue(columnId));

  /** handle null/undefine cases.  */
  if (!dateA.isValid && !dateB.isValid) return 0;
  if (!dateA.isValid) return 1;
  if (!dateB.isValid) return -1;

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
    accessorKey: "name",
    accessorFn: (row) => row.user?.name,
    header: ({ column }) => {
      return (
        <Button
          variant={column.getIsSorted() === "asc" ? "default" : "ghost"}
          onClick={() => {
            console.log("sort by name");
            column.toggleSorting(column.getIsSorted() === "asc");
          }}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => row.original.user?.name,
    size: 200,
  },
  {
    accessorKey: "birthday",
    accessorFn: (row) => row.profiles.birthday,
    header: ({ column }) => {
      return (
        <Button
          variant={column.getIsSorted() === "asc" ? "default" : "ghost"}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Birthday
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) =>
      row.original.profiles.birthday
        ? DateTime.fromJSDate(row.original.profiles.birthday).toLocaleString(
            DateTime.DATE_FULL,
            { locale: "id" },
          )
        : "N/A",
    sortingFn: sortByMonth,
    size: 200, // Fixed width in pixels
  },
  {
    accessorKey: "major",
    header: "Major",
    cell: ({ row }) => row.original.profiles.major,
    size: 400,
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone Number",
    cell: ({ row }) => row.original.profiles.phoneNumber,
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => row.original.profiles.location,
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => row.original.profiles.address,
    size: 400,
  },
  {
    accessorKey: "bio",
    header: "Bio",
    cell: ({ row }) => row.original.profiles.bio,
    size: 300,
  },
];
