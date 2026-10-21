"use client";

import { Link2, Share2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";

/** Shared links point at the page itself, without query or fragment. */
const QUERY_OR_HASH = /[?#]/;

/**
 * Opens the device's share sheet (phones, Safari, Edge); where there is none,
 * copies the link instead and says so on the button.
 */
export default function ShareButton({ title }: { title: string }) {
  // Unknown until mounted: the server can't tell which browser will render it.
  const [native, setNative] = React.useState(true);
  React.useEffect(() => {
    setNative(typeof navigator.share === "function");
  }, []);

  async function share() {
    const url =
      window.location.href.split(QUERY_OR_HASH)[0] ?? window.location.href;
    if (native) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        // Closing the share sheet is not a failure.
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy the link. Copy it from the address bar.");
    }
  }

  const Icon = native ? Share2 : Link2;
  return (
    <Button onClick={share} type="button" variant="secondary">
      <Icon aria-hidden="true" className="size-4" />
      {native ? "Share" : "Copy link"}
    </Button>
  );
}
