import { Flame } from "lucide-react";
import Template from "~/components/template";
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
      <p className="type-body">
        Let&apos;s share what you have learned, keep burning each other and grow
        together <Flame className="inline size-4" />
      </p>

      <div className="mt-4">
        <TakeawayList />
      </div>
    </Template>
  );
}
