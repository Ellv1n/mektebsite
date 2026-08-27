import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { STORE_INFO } from "@/lib/constants";

// latin-ext subset-i Azərbaycan hərflərini (ə, ı, ğ, ş, ç, ö, ü) əhatə edir
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${STORE_INFO.name} — Məktəb ləvazimatları onlayn mağazası`,
    template: `%s | ${STORE_INFO.name}`,
  },
  description:
    "Dəftər, qələm, boya, penal, termos və bütün məktəb ləvazimatları. Çatdırılma zamanı nağd ödəniş.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="az" className={inter.variable}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
