import { LinkIcon } from "lucide-react";
import Link from "next/link";
import Navigation from "~/components/navigation";
import TakeawayList from "~/components/takeaway/takeaway-list";

const tabs = [
  { id: "church-service", label: "Church service" },
  { id: "bg-bible-study", label: "Big group bible study" },
  { id: "sg-bible-study", label: "Small group bible study" },
  { id: "all", label: "All services" },
];

export default function Takeaway() {
  return (
    <section className="min-h-screen bg-dark-green-default pb-40 text-cream-default">
      <Navigation showNav={true} />

      <div className="flex flex-col items-center px-10 pt-20 xs:px-12">
        <div className="flex max-w-5xl flex-col items-center justify-center gap-8 px-14 py-16 xs:w-full xs:px-0 xs:py-8">
          <h1 className="font-reimbrandt text-9xl xs:text-4xl">Takeaways</h1>
          <div className="flex flex-col gap-y-2 text-2xl xs:text-base">
            <p>“Your word is a lamp to my feet and a light to my path”</p>
            <p>– Psalm 119:105</p>
          </div>
        </div>

        <div className="mx-auto mt-4 w-full max-w-5xl px-14 xs:px-0">
          <h3 className="mb-8 font-reimbrandt text-2xl xs:mb-4 xs:text-base">
            Let&apos;s share what you have learned, keep burning each other and
            grow together 🔥
          </h3>

          <div className="my-8 w-fit rounded-lg bg-green-default/60 p-3 px-6 xs:px-4 xs:py-2 xs:text-sm">
            <h3>
              Let&apos;s share what you have learned{" "}
              <Link href="/create-takeaway" className="">
                <span className="inline-flex items-center gap-x-1 underline underline-offset-2">
                  <p>here</p>
                  <LinkIcon className="h-4 w-4 xs:h-3 xs:w-3" />
                </span>
              </Link>
            </h3>
          </div>

          <TakeawayList tabs={tabs} />
        </div>
      </div>
    </section>
  );
}
