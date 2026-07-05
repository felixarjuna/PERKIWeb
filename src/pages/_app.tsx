import { Analytics } from "@vercel/analytics/react";
import type { AppType } from "next/app";
import localFont from "next/font/local";
import Head from "next/head";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "~/components/ui/sonner";
import { cn } from "~/lib/utils";
import "~/styles/globals.css";
import { api } from "~/utils/api";
import { useAsPathInitializer } from "~/utils/hooks/usePathStore";

const satoshi = localFont({
  src: "./../fonts/Satoshi-Medium.woff2",
  variable: "--font-satoshi",
});

const reimbrandt = localFont({
  src: "./../fonts/Reimbrandt-Regular.otf",
  variable: "--font-reimbrandt",
});

const App: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  useAsPathInitializer();

  return (
    <main className={cn(reimbrandt.variable, satoshi.variable)}>
      <Head>
        <title>PerkiWEB</title>
        <meta content="Website from Perki Aachen" name="description" />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <div className="relative overflow-hidden">
        <SessionProvider session={session}>
          <Component {...pageProps} />
        </SessionProvider>
        <Toaster />
      </div>

      <Analytics />
    </main>
  );
};

export default api.withTRPC(App);
