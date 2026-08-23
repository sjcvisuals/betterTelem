import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { RaceProvider } from "@/components/race-provider";
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
            <nav
              aria-label="Main navigation"
              className="mb-4 flex items-center gap-4 text-sm"
            >
              <Link href="/live" className="text-lg font-black tracking-tight">
                better<span className="text-accent">Telem</span>
              </Link>
              <Link href="/live" className="text-muted hover:text-foreground">
                Live
              </Link>
              <span className="ml-auto text-xs text-muted">
                ELMS race companion • data by OpenWEC
              </span>
            </nav>
            {children}
          </div>
        </RaceProvider>
      </body>
    </html>
  );
}
