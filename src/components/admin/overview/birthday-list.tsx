import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "~/components/ui/button";
import { type Member, memberDate, memberName } from "../members/member-model";

export default function BirthdayList({
  members,
  month,
}: {
  members: Member[];
  month: string;
}) {
  return (
    <section className="flex min-h-0 min-w-0 flex-col gap-3 rounded-xl bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="type-subheading">Time to celebrate</h2>
          <p className="type-caption text-muted-foreground">
            Birthdays in {month}
          </p>
        </div>
        <Link
          className={buttonVariants({
            className: "-mr-2 shrink-0",
            size: "sm",
            variant: "ghost",
          })}
          href="/admin/members?sort=birthday.asc"
        >
          All birthdays
          <ArrowUpRight aria-hidden="true" />
        </Link>
      </div>
      {members.length ? (
        <ul className="-mx-2 flex max-h-80 min-h-0 flex-1 flex-col divide-y divide-border/40 overflow-y-auto px-2 lg:max-h-none">
          {members.map((member) => (
            <li
              className="flex items-center gap-3 py-2"
              key={member.profiles.id}
            >
              <span className="type-caption flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                {memberName(member).slice(0, 2).toUpperCase()}
              </span>
              <Link
                className="min-w-0 flex-1 rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
                href={`/admin/members?member=${encodeURIComponent(member.profiles.id)}`}
              >
                <span className="type-body-sm block truncate hover:underline">
                  {memberName(member)}
                </span>
                <span className="type-caption block truncate text-muted-foreground">
                  {member.profiles.location || "Location not provided"}
                </span>
              </Link>
              <span className="type-caption shrink-0 tabular-nums">
                {memberDate(member.profiles.birthday, true)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="type-body-sm flex flex-1 items-center justify-center text-center text-muted-foreground">
          No recorded birthdays for this month and location.
        </p>
      )}
    </section>
  );
}
