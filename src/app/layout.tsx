import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { RaceProvider } from "@/components/race-provider";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "betterTelem — ELMS race companion",
  description:
    "A beginner-friendly live race dashboard for the European Le Mans Series, powered by OpenWEC data.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <RaceProvider>
          <div className="mx-auto w-full max-w-6xl flex-1 px-3 pb-10 pt-4 sm:px-5">
            <SiteNav />
            {children}
          </div>
        </RaceProvider>
      </body>
    </html>
  );
}
