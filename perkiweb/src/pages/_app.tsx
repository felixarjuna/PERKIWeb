import { type AppType } from "next/app";

import localFont from "next/font/local";
import MouseTrackingLayout from "~/components/mouse-tracking-layout";
import { Toaster } from "~/components/ui/toaster";
import { cn } from "~/lib/utils";
import "~/styles/globals.css";
import { api } from "~/utils/api";

const satoshi = localFont({
  src: "./../fonts/Satoshi-Medium.woff2",
  variable: "--font-satoshi",
});

const reimbrandt = localFont({
  src: "./../fonts/Reimbrandt-Regular.otf",
  variable: "--font-reimbrandt",
});

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <main className={cn(reimbrandt.variable, satoshi.variable)}>
      <MouseTrackingLayout>
        <Component {...pageProps} />
      </MouseTrackingLayout>
      <Toaster />
    </main>
  );
};

export default api.withTRPC(MyApp);
