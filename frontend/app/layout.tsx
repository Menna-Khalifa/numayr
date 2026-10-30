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

const numayrFavicon = "https://res.cloudinary.com/deayevwds/image/upload/v1791205176/Numayr_Arch_and_Droplet_Logo_dt4yg5.png?numayr_icon=2";

export const metadata: Metadata = {
  title: "نمير | NUMAYR",
  description: "منصة نمير لإدارة خدمات البرادات والمياه والصيانة",
  icons: {
    icon: [
      { url: numayrFavicon, type: "image/png", sizes: "any" },
    ],
    shortcut: [{ url: numayrFavicon, type: "image/png" }],
    apple: [{ url: numayrFavicon, type: "image/png" }],
  },
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