import { Plus } from "lucide-react";
import Link from "next/link";
import Template from "~/components/template";
import TakeawayList from "./takeaway-list";

export default function Takeaway() {
  return (
    <Template
      title="Takeaways"
      subtitle={
        <div className="flex flex-col gap-y-2 text-base sm:text-2xl">
          <p>“Your word is a lamp to my feet and a light to my path”</p>
          <p>– Psalm 119:105</p>
        </div>
      }
    >
      <div className="mx-auto mt-4 grid w-full max-w-5xl gap-4 px-0 sm:px-14">
        <h3 className="mb-4 font-reimbrandt text-base sm:mb-8 sm:text-2xl">
          Let&apos;s share what you have learned, keep burning each other and
          grow together 🔥
        </h3>

        <div className="flex w-full max-w-5xl flex-col px-0 sm:px-14">
          <Link
            href={"/create-takeaway"}
            className="flex w-fit items-center gap-1 self-end rounded-lg bg-green-default/60 p-3 px-4 text-sm"
          >
            <Plus className="aspect-square w-4" />
            <p>Add takeaway</p>
          </Link>
        </div>

        <TakeawayList />
      </div>
    </Template>
  );
}
