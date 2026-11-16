import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Fraunces } from "next/font/google";
import "./globals.css";
import { config } from "@/lib/config";
import { Analytics } from "@/components/Analytics";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["SOFT", "opsz"], display: "swap" });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: {
    default: "REGALUMO · Regalos personalizados que puedes probar gratis",
    template: "%s · REGALUMO",
  },
  description:
    "Crea un periódico personalizado, un escape room imprimible o un libro para colorear con tus fotos. Pruébalo gratis y sin registro antes de pagar.",
  applicationName: "REGALUMO",
  openGraph: { type: "website", locale: "es_ES", siteName: "REGALUMO" },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
};

export const viewport: Viewport = { themeColor: "#FFF8EF", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${bricolage.variable}`}>
      <body className="min-h-screen flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
