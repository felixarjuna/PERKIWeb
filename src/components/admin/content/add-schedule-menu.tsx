"use client";

import {
  CalendarPlus,
  ChevronDown,
  FileSpreadsheet,
  Table2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

/**
 * "Add schedule" on the schedules page: plan months in the grid, add one
 * gathering with the form, or import the sheet.
 */
export default function AddScheduleMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button">
          Add schedule
          <ChevronDown aria-hidden="true" className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem asChild>
          <Link className="items-start gap-3 py-2" href="/admin/schedules/plan">
            <Table2 aria-hidden="true" className="mt-0.5 size-4" />
            <span className="flex flex-col">
              <span>Plan months</span>
              <span className="type-caption text-muted-foreground">
                Fill the coming Saturdays in one grid
              </span>
            </span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link className="items-start gap-3 py-2" href="/admin/schedules/new">
            <CalendarPlus aria-hidden="true" className="mt-0.5 size-4" />
            <span className="flex flex-col">
              <span>One gathering</span>
              <span className="type-caption text-muted-foreground">
                A special date, with every detail
              </span>
            </span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            className="items-start gap-3 py-2"
            href="/admin/schedules/new?tab=import"
          >
            <FileSpreadsheet aria-hidden="true" className="mt-0.5 size-4" />
            <span className="flex flex-col">
              <span>Import from sheet</span>
              <span className="type-caption text-muted-foreground">
                Bring in dates from the schedule sheet
              </span>
            </span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
