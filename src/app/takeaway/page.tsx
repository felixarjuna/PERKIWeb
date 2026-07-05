import { Plus } from "lucide-react";
import Link from "next/link";
import Template from "~/components/template";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import TakeawayList from "./takeaway-list";

export default function TakeawayPage() {
  return (
    <Template
      subtitle={
        <div className="flex flex-col gap-y-1">
          <p>“Your word is a lamp to my feet and a light to my path”</p>
          <p>– Psalm 119:105</p>
        </div>
      }
      title="Takeaways"
    >
      <p className="text-sm sm:text-base">
        Let&apos;s share what you have learned, keep burning each other and grow
        together 🔥
      </p>

      <Link
        className={cn(
          buttonVariants({ variant: "secondary", size: "sm" }),
          "mt-6 gap-1 self-end"
        )}
        href={"/create-takeaway"}
      >
        <Plus className="size-4" />
        Add takeaway
      </Link>

      <div className="mt-4">
        <TakeawayList />
      </div>
    </Template>
  );
}
