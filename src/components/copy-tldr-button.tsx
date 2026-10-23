"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { tidyMarkdown } from "~/lib/markdown";

/** Copies the TL;DR as written, ready to paste into a broadcast or a post. */
export async function copyTldr(markdown: string) {
  try {
    await navigator.clipboard.writeText(tidyMarkdown(markdown));
    toast.success("TL;DR copied");
  } catch {
    toast.error("Could not copy the TL;DR. Select the text and copy it.");
  }
}

export function CopyTldrButton({ markdown }: { readonly markdown: string }) {
  return (
    <Button
      onClick={() => copyTldr(markdown)}
      size="sm"
      type="button"
      variant="secondary"
    >
      <Copy aria-hidden="true" className="size-4" />
      Copy TL;DR
    </Button>
  );
}
