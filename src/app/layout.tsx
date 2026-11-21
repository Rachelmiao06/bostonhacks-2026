import type { Metadata } from "next";
import { Fraunces, Fredoka, Geist, Geist_Mono, Press_Start_2P } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/shared/site-nav";
import { SiteFooter } from "@/components/shared/site-footer";
import { site } from "@/lib/config";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  subsets: ["latin"],
  weight: "400",
});

// Atlas look: editorial serif headings and a quiet sans for interface text.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: site.name,
  description: site.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${pressStart.variable} ${geistMono.variable} ${fraunces.variable} ${geist.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteNav />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
