import type { Metadata } from "next";
import Template from "~/components/template";

export const metadata: Metadata = {
  description: "Privacy policy for the PERKI Aachen website.",
  title: "Privacy policy",
};

const sections = [
  {
    body: [
      "PERKI Aachen (Persekutuan Kristen Indonesia Aachen), Roermonderstraße 110, 52072 Aachen, Germany. Email: perkiaachen18@gmail.com.",
    ],
    title: "Controller",
  },
  {
    body: [
      "This website is hosted by Vercel Inc. When you open a page, the data needed to deliver it (IP address, time, page requested, browser) is processed in server logs to serve the site securely (Art. 6(1)(f) GDPR).",
      "We use Vercel Web Analytics to measure visits. It sets no cookies and builds no personal profiles.",
      "The landing page can load an interactive map from OpenStreetMap (OpenStreetMap Foundation, St John’s Innovation Centre, Cambridge, UK). It is only embedded after you choose “Open interactive map”; at that point the OpenStreetMap Foundation receives your IP address (Art. 6(1)(a) GDPR).",
    ],
    title: "Hosting, analytics and the map",
  },
  {
    body: [
      "If you create an account you can sign in with email and password or with Google. We store your name, email address and a hashed password, or the account ID provided by Google. A session cookie keeps you signed in (Art. 6(1)(b) GDPR).",
      "If you register as a member we also store the details you enter in the member form (for example birthday, address, phone number) to organise the fellowship. Providing them is voluntary.",
      "Prayer requests and takeaways published by signed-in members are visible to other signed-in members.",
    ],
    title: "Account, membership and prayer requests",
  },
  {
    body: [
      "Data is stored in a database hosted by Supabase. It is deleted when the account is deleted or when it is no longer needed for its purpose.",
    ],
    title: "Storage",
  },
  {
    body: [
      "You have the right to access, rectify and erase your data, to restrict processing, to data portability and to object, and the right to lodge a complaint with a supervisory authority. Contact perkiaachen18@gmail.com to exercise these rights.",
    ],
    title: "Your rights",
  },
] as const;

export default function PrivacyPage() {
  return (
    <Template subtitle="How we handle your data" title="Privacy policy">
      <div className="type-body space-y-8">
        {sections.map((section) => (
          <section className="space-y-2" key={section.title}>
            <h2 className="type-heading">{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
    </Template>
  );
}
