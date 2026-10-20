import type { Metadata } from "next";
import Template from "~/components/template";

export const metadata: Metadata = {
  description: "Datenschutzerklärung der PERKI Aachen Website.",
  title: "Datenschutz",
};

const sections = [
  {
    body: [
      "PERKI Aachen (Persekutuan Kristen Indonesia Aachen), Roermonderstraße 110, 52072 Aachen. E-Mail: perkiaachen18@gmail.com.",
    ],
    title: "Verantwortlicher",
  },
  {
    body: [
      "Diese Website wird bei Vercel Inc. gehostet. Beim Aufruf werden technisch notwendige Daten (IP-Adresse, Zeitpunkt, aufgerufene Seite, Browser) in Server-Logs verarbeitet, um die Website sicher auszuliefern (Art. 6 Abs. 1 lit. f DSGVO).",
      "Zur Reichweitenmessung nutzen wir Vercel Web Analytics. Es werden keine Cookies gesetzt und keine personenbezogenen Profile erstellt.",
    ],
    title: "Hosting und Reichweitenmessung",
  },
  {
    body: [
      "Wer ein Konto anlegt, kann sich mit E-Mail und Passwort oder über Google anmelden. Wir speichern Name, E-Mail-Adresse und ein gehashtes Passwort beziehungsweise die von Google übermittelte Konto-ID. Die Anmeldung wird über ein Sitzungs-Cookie aufrechterhalten (Art. 6 Abs. 1 lit. b DSGVO).",
      "Bei der Registrierung als Mitglied werden zusätzlich die im Formular angegebenen Daten (z. B. Geburtstag, Adresse, Telefonnummer) gespeichert, um die Gemeinschaft zu organisieren. Die Angabe ist freiwillig.",
      "Gebetsanliegen und Mitschriften, die angemeldete Mitglieder veröffentlichen, sind für andere angemeldete Mitglieder sichtbar.",
    ],
    title: "Konto, Mitgliedschaft und Gebetsanliegen",
  },
  {
    body: [
      "Die Daten werden in einer Datenbank bei Supabase gespeichert. Sie werden gelöscht, sobald das Konto gelöscht wird oder der Zweck entfällt.",
    ],
    title: "Speicherung",
  },
  {
    body: [
      "Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie das Recht, sich bei einer Aufsichtsbehörde zu beschweren. Wenden Sie sich dazu an perkiaachen18@gmail.com.",
    ],
    title: "Ihre Rechte",
  },
] as const;

export default function DatenschutzPage() {
  return (
    <Template subtitle="Wie wir mit Ihren Daten umgehen" title="Datenschutz">
      <div className="space-y-8 text-sm sm:text-base">
        {sections.map((section) => (
          <section className="space-y-2" key={section.title}>
            <h2 className="font-reimbrandt text-2xl tracking-wide sm:text-3xl">
              {section.title}
            </h2>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
    </Template>
  );
}
