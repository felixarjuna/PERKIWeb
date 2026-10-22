import { ArrowUpRight, NotebookPen, Plug, UserRound } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

/**
 * Settings sections, grouped like the sidebar. Add a section here and as a
 * page under /admin/settings; sections without settings yet stay out.
 */
const SECTIONS = [
  {
    group: "Workspace",
    items: [
      {
        icon: Plug,
        id: "integrations",
        title: "Integrations",
        url: "/admin/settings/integrations",
      },
      {
        icon: NotebookPen,
        id: "takeaways",
        title: "Takeaways",
        url: "/admin/settings/takeaways",
      },
    ],
  },
  {
    group: "Personal",
    items: [
      {
        external: true,
        icon: UserRound,
        id: "account",
        title: "Account",
        url: "/account",
      },
    ],
  },
] as const;

export type SettingsSection = "integrations" | "takeaways";

function SectionNav({ active }: { active: SettingsSection }) {
  return (
    <nav aria-label="Settings sections">
      <ul className="flex @3xl:flex-col @3xl:gap-4 gap-1 @3xl:overflow-visible overflow-x-auto @3xl:pb-0 pb-1">
        {SECTIONS.map((section) => (
          <li className="@3xl:block contents" key={section.group}>
            <p className="type-eyebrow mb-1 @3xl:block hidden px-2 text-muted-foreground">
              {section.group}
            </p>
            <ul className="@3xl:flex contents @3xl:flex-col @3xl:gap-0.5">
              {section.items.map((item) => {
                const current = item.id === active;
                return (
                  <li className="shrink-0" key={item.id}>
                    <Link
                      aria-current={current ? "page" : undefined}
                      className={cn(
                        "type-body-sm flex items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                        current && "bg-secondary text-foreground"
                      )}
                      href={item.url}
                    >
                      <item.icon aria-hidden="true" className="size-4" />
                      {item.title}
                      {"external" in item ? (
                        <ArrowUpRight
                          aria-hidden="true"
                          className="size-3.5 opacity-60"
                        />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Section list beside the content on wider screens, above it on phones. */
export function SettingsLayout({
  active,
  title,
  description,
  children,
}: {
  active: SettingsSection;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="@container">
      <div className="grid @3xl:grid-cols-[11rem_minmax(0,1fr)] @3xl:gap-10 gap-6">
        <SectionNav active={active} />
        <section
          aria-labelledby="settings-section-title"
          className="@container/section max-w-3xl"
        >
          <h2 className="type-subheading" id="settings-section-title">
            {title}
          </h2>
          <p className="type-body-sm mt-1 text-muted-foreground">
            {description}
          </p>
          <div className="mt-6">{children}</div>
        </section>
      </div>
    </div>
  );
}

/** A group of rows under a small heading, divided by lines. */
export function SettingsGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-8">
      <h3 className="type-body border-b pb-2">{title}</h3>
      <div className="divide-y">{children}</div>
    </div>
  );
}

/** One setting: what it is on the left, its value and actions on the right. */
export function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex @xl/section:flex-row flex-col @xl/section:items-center @xl/section:justify-between @xl/section:gap-8 gap-3 py-4">
      <div className="min-w-0 flex-1">
        <p className="type-body-sm">{title}</p>
        <div className="type-caption mt-0.5 text-muted-foreground">
          {description}
        </div>
      </div>
      <div className="flex min-w-0 @xl/section:max-w-[55%] flex-wrap items-center @xl/section:justify-end gap-2">
        {children}
      </div>
    </div>
  );
}
