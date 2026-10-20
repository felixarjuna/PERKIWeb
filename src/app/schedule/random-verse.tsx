"use client";

import { Shuffle } from "lucide-react";
import React from "react";
import { Button } from "~/components/ui/button";

export default function RandomVerse({ items }: { items: readonly string[] }) {
  const [verse, setVerse] = React.useState<string>();

  const pickRandomItem = React.useCallback(() => {
    if (items.length === 0) {
      setVerse(undefined);
      return;
    }
    const randomIndex = Math.floor(Math.random() * items.length);
    setVerse(items?.[randomIndex]);
  }, [items]);

  React.useEffect(() => {
    pickRandomItem();
  }, [pickRandomItem]);

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        className="w-fit"
        onClick={pickRandomItem}
        type="button"
        variant="secondary"
      >
        <Shuffle className="size-4" />
        Randomize me!
      </Button>
      {verse ? (
        <p className="type-quote px-4 text-foreground">{verse}</p>
      ) : null}
    </div>
  );
}
