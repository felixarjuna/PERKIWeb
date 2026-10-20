import { ArrowUpRight, Cake } from "lucide-react";
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
    <section className="flex flex-col gap-5 rounded-xl bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="type-subheading">Time to celebrate</h2>
          <p className="type-caption mt-1 text-muted-foreground">
            Birthdays in {month}
          </p>
        </div>
        <Cake className="mt-1 size-5 text-muted-foreground">
          <title>Birthdays</title>
        </Cake>
      </div>
      {members.length ? (
        <ul className="flex flex-col divide-y divide-border/40">
          {members.map((member) => (
            <li
              className="flex items-center gap-3 py-3"
              key={member.profiles.id}
            >
              <span className="type-caption flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                {memberName(member).slice(0, 2).toUpperCase()}
              </span>
              <Link
                className="min-w-0 flex-1 rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
                href={`/admin/members?member=${encodeURIComponent(member.profiles.id)}`}
              >
                <span className="type-body-sm block break-words hover:underline">
                  {memberName(member)}
                </span>
                <span className="type-caption text-muted-foreground">
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
        <p className="type-body-sm py-6 text-muted-foreground">
          No recorded birthdays for this month and location.
        </p>
      )}
      <Link
        className={buttonVariants({
          className: "mt-auto self-start",
          size: "sm",
          variant: "ghost",
        })}
        href="/admin/members"
      >
        Explore members
        <ArrowUpRight className="size-4">
          <title>Member directory</title>
        </ArrowUpRight>
      </Link>
    </section>
  );
}
