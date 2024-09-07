import Template from "~/components/template";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";

export const groups = [
  {
    name: "Group 1",
    members: ["Danny", "Shane", "Wisnu", "Ruth", "Dian", "Gerry"],
  },
  { name: "Group 2", members: ["Reggy", "Felix", "Jason", "Erico", "Gaby"] },
  {
    name: "Group 3",
    members: ["Toni", "Victor", "Angel", "Ricky", "Deronn", "Trevor"],
  },
  {
    name: "Group 4",
    members: ["Aldi", "Billy", "Andrew", "Mary", "Winston S.", "Randy"],
  },
  {
    name: "Group 5",
    members: ["Winston Y.", "Steffen", "Karyn", "Jco", "Grace", "Vincent"],
  },
  { name: "Group 6", members: ["Chen", "Ido", "Wynnona", "Tius", "Daven"] },
];

export default function Group() {
  return (
    <Template title="Groups" subtitle="Cleaning and cooking groups">
      <div className="mt-8 w-full sm:w-1/2">
        <Accordion type="single" collapsible className="grid gap-2">
          {groups.map((group, i) => (
            <AccordionItem
              key={i}
              value={group.name}
              className="rounded-lg bg-primary px-4 text-primary-foreground hover:bg-accent"
            >
              <AccordionTrigger>{group.name}</AccordionTrigger>
              <AccordionContent className="flex flex-wrap gap-2">
                {group.members.map((member, i) => (
                  <div
                    className="w-fit rounded-full bg-primary-foreground px-3 py-1 text-xs text-secondary-foreground"
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
