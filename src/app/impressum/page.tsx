import type { Metadata } from "next";
import Template from "~/components/template";

export const metadata: Metadata = {
  description: "Anbieterkennzeichnung der PERKI Aachen Website.",
  title: "Impressum",
};

export default function ImpressumPage() {
  return (
    <Template subtitle="Angaben gemäß § 5 DDG" title="Impressum">
      <div className="space-y-8 text-sm sm:text-base">
        <section className="space-y-2">
          <h2 className="font-reimbrandt text-2xl tracking-wide sm:text-3xl">
            Anbieter
          </h2>
          <address className="not-italic">
            PERKI Aachen (Persekutuan Kristen Indonesia Aachen)
            <br />
            Roermonderstraße 110
            <br />
            52072 Aachen
          </address>
        </section>

        <section className="space-y-2">
          <h2 className="font-reimbrandt text-2xl tracking-wide sm:text-3xl">
            Kontakt
          </h2>
          <p>
            Telefon:{" "}
            <a
              className="underline underline-offset-4"
              href="tel:+491745277265"
            >
              +49 174 5277265
            </a>
            <br />
            E-Mail:{" "}
            <a
              className="underline underline-offset-4"
              href="mailto:perkiaachen18@gmail.com"
            >
              perkiaachen18@gmail.com
            </a>
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-reimbrandt text-2xl tracking-wide sm:text-3xl">
            Verantwortlich für den Inhalt
          </h2>
          <p className="text-muted-foreground">
            Vorname Nachname, Anschrift wie oben.
          </p>
        </section>
      </div>
    </Template>
  );
}
