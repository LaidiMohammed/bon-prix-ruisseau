import type { Metadata } from "next";
import { Anton, Cairo, Inter } from "next/font/google";
import SiteShell from "@/components/SiteShell";
import "./globals.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-arabic" });

export const metadata: Metadata = {
  title: "Bon Prix Ruisseau Sports — Boutique Alger",
  description:
    "Maillots 2027, survêtements premium, sneakers au Ruisseau, Alger. Qualité haute, prix imbattables. بون بري روسو سبور.",
  icons: { icon: "/logo.jpg", apple: "/logo.jpg" },
  openGraph: {
    title: "Bon Prix Ruisseau Sports",
    description: "Habille-toi comme un champion ❤️🖤 — Ruisseau, Alger",
    type: "website",
    images: [{ url: "/logo.jpg", width: 1080, height: 1080 }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${anton.variable} ${inter.variable} ${cairo.variable} h-full`}>
      <body className="min-h-full bg-ink font-body text-cream antialiased">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
