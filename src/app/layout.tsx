import "~/styles/globals.css";

import { Analytics } from "@vercel/analytics/react";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "~/components/ui/sonner";
import { cn } from "~/lib/utils";
import { TRPCReactProvider } from "~/trpc/react";

const satoshi = localFont({
  display: "swap",
  src: "../fonts/Satoshi-Medium.woff2",
  variable: "--font-satoshi",
});

const reimbrandt = localFont({
  display: "swap",
  src: "../fonts/Reimbrandt-Regular.otf",
  variable: "--font-reimbrandt",
});

const SITE_DESCRIPTION =
  "PERKI Aachen is an Indonesian Christian fellowship in Aachen. We meet every Saturday at 15:30 at Roermonderstraße 110 for worship, Bible study and a shared meal.";

export const metadata: Metadata = {
  description: SITE_DESCRIPTION,
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  metadataBase: new URL("https://perkiaachen.de"),
  openGraph: {
    description: SITE_DESCRIPTION,
    images: [
      { alt: "Members of PERKI Aachen", url: "/images/perki-aachen.jpg" },
    ],
    locale: "en",
    siteName: "PERKI Aachen",
    title: "PERKI Aachen",
    type: "website",
  },
  title: {
    default: "PERKI Aachen",
    template: "%s · PERKI Aachen",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#031f1c",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={cn(reimbrandt.variable, satoshi.variable, "font-satoshi")}
      >
        <SessionProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </SessionProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
