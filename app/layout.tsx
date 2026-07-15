import type { Metadata } from "next";
import { Inter, Cinzel } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Cinzel gives the trophy-room / record-book "engraved" display feel.
const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-display",
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
    <html lang="en" className={`${inter.variable} ${cinzel.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-[1920px] flex-1 px-4 py-3 sm:px-6 lg:px-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
