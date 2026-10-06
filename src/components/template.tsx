import type React from "react";
import Navigation from "./home/navigation";

interface ITemplateProps {
  readonly children?: React.ReactNode;
  readonly subtitle?: string | React.ReactNode;
  readonly title: string;
}

/**
 * Shared page shell — the single source of page rhythm.
 *
 * Design system recap (see CLAUDE.md):
 * - content column: max-w-2xl, px-4, pt-28/sm:pt-36, pb-24
 * - page title: font-reimbrandt text-4xl sm:text-6xl
 * - page subtitle: text-base sm:text-xl, muted
 * - title -> content gap: mt-8 sm:mt-10
 */
export default function Template(props: ITemplateProps) {
  return (
    <div className="min-h-screen bg-background pb-24 text-foreground">
      <Navigation showNav={true} />
      <main className="mx-auto flex w-full max-w-2xl flex-col px-4 pt-28 sm:px-6 sm:pt-36">
        <header className="flex flex-col items-center gap-3 text-center">
          <h1 className="font-reimbrandt text-4xl sm:text-6xl">
            {props.title}
          </h1>
          {props.subtitle ? (
            <div className="text-balance text-base text-muted-foreground sm:text-xl">
              {props.subtitle}
            </div>
          ) : null}
        </header>

        <div className="mt-8 flex w-full flex-col sm:mt-10">
          {props.children}
        </div>
      </main>
    </div>
  );
}
