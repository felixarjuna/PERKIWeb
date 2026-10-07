"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";

export default function BackButton() {
  const router = useRouter();

  return (
    <Button
      className="flex w-fit gap-x-2 self-end"
      onClick={() => router.back()}
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </Button>
  );
}
