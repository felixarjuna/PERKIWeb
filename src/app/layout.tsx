import "~/styles/globals.css";

import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "~/components/ui/sonner";
import { cn } from "~/lib/utils";
import { TRPCReactProvider } from "~/trpc/react";

const satoshi = localFont({
  src: "../fonts/Satoshi-Medium.woff2",
  variable: "--font-satoshi",
});

const reimbrandt = localFont({
  src: "../fonts/Reimbrandt-Regular.otf",
  variable: "--font-reimbrandt",
});

export const metadata: Metadata = {
  description: "Website from Perki Aachen",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  title: "PerkiWEB",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={cn(reimbrandt.variable, satoshi.variable)}>
        <div className="relative overflow-hidden">
          <SessionProvider>
            <TRPCReactProvider>{children}</TRPCReactProvider>
          </SessionProvider>
          <Toaster />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
