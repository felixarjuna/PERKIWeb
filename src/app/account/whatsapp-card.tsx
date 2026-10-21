"use client";

import { ExternalLink, MessageCircle } from "lucide-react";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

/** The PERKI WhatsApp group, unlocked by a complete profile. */
export default function WhatsappCard() {
  const { data } = api.profiles.whatsappGroup.useQuery();
  if (!data?.configured) {
    return null;
  }
  return (
    <section className="flex items-center gap-3 rounded-xl bg-card p-4 sm:p-6">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
        <MessageCircle aria-hidden="true" className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="type-body">PERKI WhatsApp group</h2>
        {data.url ? (
          <p className="type-body-sm text-muted-foreground">
            News, events and prayer, in one chat.
          </p>
        ) : (
          <p className="type-body-sm text-muted-foreground">
            Unlocks once your profile is complete
          </p>
        )}
      </div>
      {data.url ? (
        <a
          aria-label="Join the WhatsApp group"
          className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
          href={data.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          Join
          <ExternalLink aria-hidden="true" className="size-4" />
        </a>
      ) : null}
    </section>
  );
}
