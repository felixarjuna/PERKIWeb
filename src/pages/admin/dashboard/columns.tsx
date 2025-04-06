import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "~/components/ui/button";
import { type RouterOutputs } from "~/utils/api";

type UserProfile = RouterOutputs["profiles"]["getUserProfiles"][number];

export const columns: ColumnDef<UserProfile>[] = [
  {
    accessorKey: "name",
    accessorFn: (row) => row.user?.name,
    header: ({ column }) => {
      return (
        <Button
          variant={"ghost"}
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
  },
  {
    accessorKey: "birthday",
    accessorFn: (row) => row.profiles.birthday,
    header: ({ column }) => {
      return (
        <Button
          variant={"ghost"}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Birthday
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) =>
      row.original.profiles.birthday
        ? new Date(row.original.profiles.birthday).toLocaleDateString()
        : "N/A",
  },
  {
    accessorKey: "major",
    header: "Major",
    cell: ({ row }) => row.original.profiles.major,
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
  },
  {
    accessorKey: "bio",
    header: "Bio",
    cell: ({ row }) => row.original.profiles.bio,
  },
];
