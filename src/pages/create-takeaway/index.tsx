import Navigation from "~/components/navigation";
import AddTakeawayForm from "./add-takeaway-form";

export default function AddTakeawayPage() {
  return (
    <section className="min-h-screen bg-dark-green-default pb-40 text-cream-default">
      <Navigation showNav={true} />

      <div className="flex flex-col items-center px-24 pt-20 xs:px-12">
        <div className="flex max-w-5xl flex-col items-center justify-center gap-8 px-14 py-16 xs:w-full xs:px-0 xs:py-8">
          <h1 className="font-reimbrandt text-9xl xs:text-4xl">Takeaways</h1>
          <div className="flex flex-col gap-y-2 text-2xl xs:text-base">
            <p>“Your word is a lamp to my feet and a light to my path”</p>
            <p>– Psalm 119:105</p>
          </div>
        </div>

        <div className="w-1/2 xs:w-full">
          <AddTakeawayForm />
        </div>
      </div>
    </section>
  );
}
