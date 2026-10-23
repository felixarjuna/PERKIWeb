import { CopyTldrButton } from "~/components/copy-tldr-button";
import { TakeawayMarkdown } from "~/components/takeaway-markdown";
import { cn } from "~/lib/utils";

/** A takeaway's TL;DR as a card above its notes, with a copy action. */
export function TakeawayTldr({
  className,
  markdown,
}: {
  readonly className?: string;
  readonly markdown: string;
}) {
  return (
    <section
      aria-labelledby="takeaway-tldr"
      className={cn("rounded-xl bg-card p-4 sm:p-6", className)}
      data-slot="takeaway-tldr"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="type-eyebrow text-muted-foreground" id="takeaway-tldr">
          TL;DR
        </h2>
        <CopyTldrButton markdown={markdown} />
      </div>
      <TakeawayMarkdown className="mt-3" markdown={markdown} />
    </section>
  );
}
