import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "XO Arena | เกม XO เล่นกับเพื่อนหรือบอท",
  description:
    "เล่นเกม XO ออนไลน์ UI สวย เล่นกับเพื่อนหรือบอทอัจฉริยะได้ทันที รองรับหลายระดับความยากและบันทึกคะแนน.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
