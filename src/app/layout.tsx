import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans, Caveat } from "next/font/google";
import { SITE } from "@/lib/config";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-hand",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: `${SITE.title} — ${SITE.partnerLine}`, template: `%s · ${SITE.title}` },
  description: SITE.heroSupport,
};

export const viewport: Viewport = {
  themeColor: "#F7F2E8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable} ${caveat.variable}`}>
      <body className="min-h-screen bg-paper text-ink font-sans">
        {children}
        <div aria-hidden className="sr-only">
          {SITE.privacyNote}
        </div>
      </body>
    </html>
  );
}
