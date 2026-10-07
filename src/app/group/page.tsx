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
      <div className="w-full">
        <Accordion className="grid gap-2" collapsible type="single">
          {groups.map((group) => (
            <AccordionItem
              className="rounded-xl bg-card px-4 transition duration-300 hover:bg-accent/40"
              key={group.name}
              value={group.name}
            >
              <AccordionTrigger>{group.name}</AccordionTrigger>
              <AccordionContent className="flex flex-wrap gap-2">
                {group.members.map((member) => (
                  <div
                    className="w-fit rounded-full bg-paper px-3 py-1 text-paper-foreground text-xs"
                    key={member}
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
