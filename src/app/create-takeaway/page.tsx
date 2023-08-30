import Navigation from "@/components/navigation";
import AddTakeawayForm from "./add-takeaway-form";

export default function AddTakeawayPage() {
  return (
    <section className="bg-dark-green-default text-cream-default pb-40 min-h-screen">
      <Navigation showNav={true} />

      <div className="pt-20 px-24 flex flex-col items-center xs:px-12">
        <div className="flex max-w-5xl px-14 items-center justify-center gap-8 py-16 flex-col xs:w-full xs:py-8 xs:px-0">
          <h1 className="text-9xl font-reimbrandt xs:text-4xl">Takeaways</h1>
          <div className="text-2xl flex flex-col gap-y-2 xs:text-base">
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
