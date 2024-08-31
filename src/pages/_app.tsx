import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";

import localFont from "next/font/local";
import Head from "next/head";

import { Toaster } from "~/components/ui/toaster";
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

// const AnimatedCursor = dynamic(() => import("react-animated-cursor"), {
//   ssr: false,
// });

const App: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  useAsPathInitializer();

  return (
    <main className={cn(reimbrandt.variable, satoshi.variable)}>
      <Head>
        <title>PerkiWEB</title>
        <meta name="description" content="Website from Perki Aachen" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="relative overflow-hidden">
        {/* <AnimatedCursor
          color={"255, 255, 255"}
          innerSize={0}
          outerSize={30}
          outerAlpha={1}
          innerScale={2}
          outerScale={1.5}
          clickables={[
            "a",
            'input[type="text"]',
            'input[type="email"]',
            'input[type="number"]',
            'input[type="submit"]',
            'input[type="image"]',
            "label[for]",
            "select",
            "textarea",
            "button",
            ".link",
          ]}
          outerStyle={{
            mixBlendMode: "difference",
          }}
        /> */}
        <SessionProvider session={session}>
          <Component {...pageProps} />
        </SessionProvider>
        <Toaster />
      </div>
    </main>
  );
};

export default api.withTRPC(App);
