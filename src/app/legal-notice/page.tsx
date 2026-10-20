import type { Metadata } from "next";
import Template from "~/components/template";

export const metadata: Metadata = {
  description: "Provider identification for the PERKI Aachen website.",
  title: "Legal notice",
};

export default function LegalNoticePage() {
  return (
    <Template
      subtitle="Information under § 5 DDG (German Digital Services Act)"
      title="Legal notice"
    >
      <div className="type-body space-y-8">
        <section className="space-y-2">
          <h2 className="type-heading">Provider</h2>
          <address className="not-italic">
            PERKI Aachen (Persekutuan Kristen Indonesia Aachen)
            <br />
            Roermonderstraße 110
            <br />
            52072 Aachen, Germany
          </address>
        </section>

        <section className="space-y-2">
          <h2 className="type-heading">Contact</h2>
          <p>
            Phone:{" "}
            <a
              className="underline underline-offset-4"
              href="tel:+491745277265"
            >
              +49 174 5277265
            </a>
            <br />
            Email:{" "}
            <a
              className="underline underline-offset-4"
              href="mailto:perkiaachen18@gmail.com"
            >
              perkiaachen18@gmail.com
            </a>
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="type-heading">Responsible for the content</h2>
          <p className="text-muted-foreground">
            First name Last name, address as above.
          </p>
        </section>
      </div>
    </Template>
  );
}
