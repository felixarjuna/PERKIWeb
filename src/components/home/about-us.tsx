import Image from "next/image";
import Section from "./section";

const pillars = [
  {
    body: "Become a church based on the Full Gospel that takes root, grows and bears fruit for Christ.",
    title: "Vision",
  },
  {
    body: "Build a Christian family that loves and serves God and people.",
    title: "Mission",
  },
] as const;

export default function AboutUs() {
  return (
    <Section
      eyebrow="Who we are"
      id="about"
      title="About us"
      tone="transparent"
    >
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12">
        <div className="type-body space-y-5">
          <p>
            <span className="type-heading">Perki</span> stands for Persekutuan
            Kristen Indonesia. We are a Christian fellowship that bases its
            beliefs, teaching and life on the whole Bible, Old and New
            Testament, as the inspired Word of God.
          </p>
          <p>
            We are not affiliated with any particular church group. Everything
            we do serves the Great Commission of the Lord Jesus Christ.
          </p>
          <p>
            Through regular gatherings, prayer meetings and outreach we grow in
            community and in faith lived out authentically, and we share the
            message of God&apos;s love and salvation with the people around us.
            And still, we are just sinners who want to grow together.
          </p>
        </div>

        <figure className="space-y-3">
          <Image
            alt="Members of PERKI Aachen gathered for a group photo after a service"
            className="aspect-[3/2] w-full rounded-xl object-cover"
            height={1333}
            sizes="(min-width: 1024px) 40rem, 100vw"
            src="/images/perki-aachen.jpg"
            width={2000}
          />
          <figcaption className="type-caption text-muted-foreground">
            The fellowship after a Saturday service in Aachen.
          </figcaption>
        </figure>
      </div>

      <div className="mt-14 sm:mt-20">
        <h3 className="type-heading text-center">
          Make disciples of all nations
        </h3>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          {pillars.map((pillar) => (
            <div className="rounded-xl bg-card p-4 sm:p-6" key={pillar.title}>
              <dt className="type-subheading">{pillar.title}</dt>
              <dd className="type-body mt-2">{pillar.body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}
