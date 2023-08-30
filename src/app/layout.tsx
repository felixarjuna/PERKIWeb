import { MouseTrackingLayout } from "@/components/mouse-tracking-layout";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import localFont from "@next/font/local";
import type { Metadata } from "next";
import Provider from "./_trpc/Provider";
import "./globals.css";

const satoshi = localFont({
  src: "./../fonts/Satoshi-Medium.woff2",
  variable: "--font-satoshi",
});

const reimbrandt = localFont({
  src: "./../fonts/Reimbrandt-Regular.otf",
  variable: "--font-reimbrandt",
});

export const metadata: Metadata = {
  title: "Perki Aachen",
  description: "Perki Aachen Website",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={cn(satoshi.variable, reimbrandt.variable)} suppressHydrationWarning>
        <Provider>
          <MouseTrackingLayout>{children}</MouseTrackingLayout>
          <Toaster />
        </Provider>
      </body>
    </html>
  );
}
