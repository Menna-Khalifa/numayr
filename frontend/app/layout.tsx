import type { Metadata } from "next";
import { Almarai } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const almarai = Almarai({
  subsets: ["arabic"],
  weight: ["400", "700", "800"],
  display: "swap",
  variable: "--font-almarai",
});

export const metadata: Metadata = {
  title: "نمير | NUMAYR",
  description: "منصة نمير لإدارة خدمات البرادات والمياه والصيانة",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={almarai.variable}>{children}</body>
    </html>
  );
}