import Navigation from "~/components/home/navigation";
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
    <section className="min-h-screen bg-dark-green-default pb-40 text-cream-default">
      <Navigation showNav={true} />

      <div className="flex flex-col items-center px-24 pt-20 xs:px-12">
        <div className="flex max-w-5xl flex-col items-center justify-center gap-8 px-14 py-16 xs:w-full xs:px-0 xs:py-8">
          <div className="text-center">
            <h1 className="font-reimbrandt text-9xl xs:text-4xl">Groups</h1>
            <p>Cleaning and cooking groups.</p>
          </div>
          <div className="w-full">
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
        </div>
      </div>
    </section>
  );
}
