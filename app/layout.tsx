import type { Metadata } from "next";
import { Cinzel, Oswald, Rajdhani } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const rajdhani = Rajdhani({
  subsets: ["latin"],
  variable: "--font-rajdhani",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-condensed",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "We Live for Sundays",
    template: "%s · We Live for Sundays",
  },
  description:
    "The home of the WLFS dynasty league — teams, history, trophies, and records.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${rajdhani.variable} ${cinzel.variable} ${oswald.variable}`}
    >
      <body className="flex min-h-screen flex-col font-sans">
        <Header />
        <main className="mx-auto w-full max-w-[1920px] flex-1 px-4 py-3 sm:px-5 lg:px-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
