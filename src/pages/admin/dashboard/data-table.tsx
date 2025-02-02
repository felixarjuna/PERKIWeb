import { DateTime } from "luxon";
import { useRouter } from "next/navigation";
import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import useAuth from "~/hooks/useAuth";
import { api } from "~/utils/api";

export default function DataTable() {
  const router = useRouter();
  const { authorized } = useAuth();

  /** route back to admin page, if not authenticated. */
  React.useEffect(() => {
    if (!authorized) return router.push("/admin");
  }, [authorized, router]);

  const { data } = api.profiles.getUserProfiles.useQuery();

  return (
    <div className="space-y-4 p-4 text-cream-default">
      <div className="item-center flex w-52 flex-col rounded-md border border-cream-default p-4">
        <p className="font-semibold">Members</p>
        <p className="font-mono">{data?.length}</p>
      </div>

      <Table className="text-cream-default">
        <TableCaption>A list of our fellowship members.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Birthday</TableHead>
            <TableHead>Major</TableHead>
            <TableHead>Phone number</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Bio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((data) => (
            <TableRow key={data.profiles.id}>
              <TableCell className="min-w-52">{data.user?.name}</TableCell>
              <TableCell className="min-w-52">
                {DateTime.fromJSDate(
                  data.profiles.birthday ?? new Date(),
                ).toFormat("MMMM dd, yyyy")}
              </TableCell>
              <TableCell className="min-w-fit">{data.profiles.major}</TableCell>
              <TableCell>{data.profiles.phoneNumber}</TableCell>
              <TableCell>{data.profiles.location}</TableCell>
              <TableCell>{data.profiles.address}</TableCell>
              <TableCell>{data.profiles.bio}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
