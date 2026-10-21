import type React from "react";
import { cn } from "~/lib/utils";
import Navigation from "./home/navigation";
import ProfileReminder from "./profile-reminder";
import WelcomeGate from "./welcome-gate";

interface ITemplateProps {
  readonly children?: React.ReactNode;
  readonly subtitle?: string | React.ReactNode;
  readonly title: string;
  /** `wide` gives long reads (a takeaway) a wider column on desktop. */
  readonly width?: "default" | "wide";
}

/**
 * Shared page shell — the single source of page rhythm.
 *
 * Design system recap (see src/styles/globals.css):
 * - content column: max-w-2xl (wide: lg:max-w-3xl), px-4, pt-28/sm:pt-36, pb-24
 * - page title: type-title; subtitle: type-lead, muted
 * - title -> content gap: mt-8 sm:mt-10
 */
export default function Template(props: ITemplateProps) {
  return (
    <div className="min-h-screen bg-background pb-24 text-foreground">
      <Navigation />
      <WelcomeGate />
      <main
        className={cn(
          "type-body mx-auto flex w-full min-w-0 max-w-2xl flex-col px-4 pt-28 sm:px-6 sm:pt-36",
          props.width === "wide" && "lg:max-w-3xl"
        )}
        id="main-content"
      >
        <header className="flex flex-col items-center gap-3 text-center">
          <h1 className="type-title">{props.title}</h1>
          {props.subtitle ? (
            <div className="type-lead text-balance text-muted-foreground">
              {props.subtitle}
            </div>
          ) : null}
        </header>

        <ProfileReminder />
        <div className="mt-8 flex w-full flex-col sm:mt-10">
          {props.children}
        </div>
      </main>
    </div>
  );
}
