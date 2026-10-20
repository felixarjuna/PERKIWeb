import Image from "next/image";
import { pastors } from "~/lib/data";
import { buttonVariants } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import Section from "./section";

export default function OurPastors() {
  return (
    <Section eyebrow="Who serves us" id="pastors" title="Our pastors">
      <ul className="grid gap-4 sm:grid-cols-3">
        {pastors.map((pastor) => (
          <li
            className="flex flex-col items-center rounded-xl bg-card p-4 text-center sm:p-6"
            key={pastor.name}
          >
            <Image
              alt={`Portrait of ${pastor.name}`}
              className="size-32 rounded-full object-cover object-top sm:size-36"
              height={288}
              sizes="9rem"
              src={pastor.img}
              width={288}
            />
            <h3 className="mt-5 font-reimbrandt text-lg tracking-wide sm:text-xl">
              {pastor.name}
            </h3>
            <p className="mt-2 text-balance text-muted-foreground text-sm sm:text-base">
              {pastor.favoriteVerse}
            </p>

            <Dialog>
              <DialogTrigger
                className={buttonVariants({
                  className: "mt-auto pt-4",
                  size: "sm",
                  variant: "ghost",
                })}
              >
                Read their story
              </DialogTrigger>
              <DialogContent className="max-h-[85dvh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-reimbrandt text-xl tracking-wide">
                    {pastor.name}
                  </DialogTitle>
                  <DialogDescription className="text-left text-sm sm:text-base">
                    {pastor.story}
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </li>
        ))}
      </ul>
    </Section>
  );
}
