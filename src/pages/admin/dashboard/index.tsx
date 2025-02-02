import { DateTime } from "luxon";
import { AppSidebar } from "~/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "~/components/ui/breadcrumb";
import { Separator } from "~/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { api } from "~/utils/api";

export default function Page() {
  const { data } = api.profiles.getUserProfiles.useQuery();

  return (
    <div className="dark">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">Members</BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

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
                    <TableCell className="min-w-52">
                      {data.user?.name}
                    </TableCell>
                    <TableCell className="min-w-52">
                      {DateTime.fromJSDate(
                        data.profiles.birthday ?? new Date(),
                      ).toFormat("MMMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="min-w-fit">
                      {data.profiles.major}
                    </TableCell>
                    <TableCell>{data.profiles.phoneNumber}</TableCell>
                    <TableCell>{data.profiles.location}</TableCell>
                    <TableCell>{data.profiles.address}</TableCell>
                    <TableCell>{data.profiles.bio}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
