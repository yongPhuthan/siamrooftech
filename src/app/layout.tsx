import { GoogleTagManager } from "@next/third-parties/google";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "./providers";
import Navigation from "./components/ui/Navigation";
import LineButtonsLayout from "./components/LineButtonsLayout";

const myFont = localFont({
  src: [
    {
      path: "../../public/fonts/SukhumvitSet-Medium.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/SukhumvitSet-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/SukhumvitSet-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
  ],
  display: "swap",
});
export const metadata: Metadata = {
  metadataBase: new URL("https://www.siamrooftech.com/"),
  title: "กันสาดพับได้ ระบบมือหมุน-มอเตอร์ไฟฟ้า คุณภาพยุโรป | Siamrooftech",
  description:
    "ผู้เชี่ยวชาญกันสาดพับได้ ระบบมือหมุน-มอเตอร์ไฟฟ้า คุณภาพยุโรป ราคาไทย ประสบการณ์ 10+ ปี ครอบคลุมทั่วกรุงเทพฯ-ปริมณฑล บริการครบวงจร ใบเสนอราคาฟรี",
  keywords: "กันสาดพับได้, กันสาดพับเก็บได้, กันสาดอัตโนมัติ, กันสาดมือหมุน, กันสาดมอเตอร์ไฟฟ้า, ติดตั้งกันสาดพับได้, ราคากันสาดพับได้, Siamrooftech, กันสาดคุณภาพ",
  authors: [{ name: "Siamrooftech" }],
  creator: "Siamrooftech",
  publisher: "Siamrooftech",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://www.siamrooftech.com/",
  },
  openGraph: {
    title: "กันสาดพับได้ ระบบมือหมุน-มอเตอร์ไฟฟ้า คุณภาพยุโรป | Siamrooftech",
    description:
      "ผู้เชี่ยวชาญกันสาดพับได้ ระบบมือหมุน-มอเตอร์ไฟฟ้า คุณภาพยุโรป ราคาไทย ประสบการณ์ 10+ ปี ครอบคลุมทั่วกรุงเทพฯ-ปริมณฑล บริการครบวงจร",
    url: "https://www.siamrooftech.com/",
    siteName: "Siamrooftech",
    images: [
      {
        url: "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/medium/46570",
        width: 800,
        height: 600,
        alt: "กันสาดพับได้ Siamrooftech - ผู้เชี่ยวชาญด้านกันสาดพับได้คุณภาพสูง",
      },
      {
        url: "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/46570",
        width: 1200,
        height: 630,
        alt: "กันสาดพับได้ Siamrooftech - ผลงานการติดตั้งกันสาดพับได้คุณภาพ",
      },
    ],
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "กันสาดพับได้ ระบบมือหมุน-มอเตอร์ไฟฟ้า คุณภาพยุโรป | Siamrooftech",
    description: "ผู้เชี่ยวชาญกันสาดพับได้ ระบบมือหมุน-มอเตอร์ไฟฟ้า คุณภาพยุโรป ประสบการณ์ 10+ ปี บริการครบวงจร",
    images: ["https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/medium/46570"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={myFont.className}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      </head>
      {process.env.NODE_ENV === "production" ? (
        <>
          <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID || "GTM-MT74ZP2P"} />
        </>
      ) : null}
      <body className={`bg-white`}>
        <Providers>
          <Navigation />
          <Suspense>{children}</Suspense>
          <LineButtonsLayout />
        </Providers>
      </body>
    </html>
  );
}
