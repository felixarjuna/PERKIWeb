import { Suspense } from "react";
import Loader from "~/components/loader";
import Template from "~/components/template";
import TakeawayList from "./takeaway-list";

export default function TakeawayPage() {
  return (
    <Template
      subtitle={
        <div className="flex flex-col gap-y-1">
          <p>“Your word is a lamp to my feet and a light to my path”</p>
          <p>— Psalm 119:105</p>
        </div>
      }
      title="Takeaways"
    >
      {/* The list reads the search from the URL, which needs a boundary. */}
      <Suspense fallback={<Loader message="Loading takeaways ..." />}>
        <TakeawayList />
      </Suspense>
    </Template>
  );
}
