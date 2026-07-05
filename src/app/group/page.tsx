import Template from "~/components/template";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { groups } from "~/lib/data";

export default function Group() {
  return (
    <Template subtitle="Cleaning and cooking groups" title="Groups">
      <div className="mt-8 w-full">
        <Accordion className="grid gap-2" collapsible type="single">
          {groups.map((group, i) => (
            <AccordionItem
              className="rounded-lg bg-primary px-4 text-primary-foreground hover:bg-accent"
              key={i}
              value={group.name}
            >
              <AccordionTrigger>{group.name}</AccordionTrigger>
              <AccordionContent className="flex flex-wrap gap-2">
                {group.members.map((member, i) => (
                  <div
                    className="w-fit rounded-full bg-primary-foreground px-3 py-1 text-secondary-foreground text-xs"
                    key={i}
                  >
                    {member}
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Template>
  );
}
