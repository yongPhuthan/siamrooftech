import { GoogleTagManager, GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "./providers";
import Navigation from "./components/ui/Navigation";

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
  title: "กันสาดพับเก็บได้ กันสาดอัตโนมัติ สวยๆ ทนทาน คุ้มราคา",
  description:
    "บริการติดตั้งกันสาดพับเก็บได้ ระบบมือหมุนและระบบมอเตอร์ไฟฟ้าคุณภาพสูงจาก Siamrooftech. ด้วยประสบการณ์และเทคนิคการติดตั้งระบบมือหมุนและมอเตอร์ไฟฟ้ากับโครงสร้างหน้างานต่างๆมากกว่า10ปี",
  keywords: "กันสาดพับเก็บได้, กันสาดอัตโนมัติ, กันสาดมือหมุน, กันสาดมอเตอร์ไฟฟ้า, ติดตั้งกันสาด, Siamrooftech",
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
    title: "กันสาดพับเก็บได้ กันสาดอัตโนมัติ สวยๆ ทนทาน คุ้มราคา",
    description:
      "บริการติดตั้งกันสาดพับเก็บได้ ระบบมือหมุนและระบบมอเตอร์ไฟฟ้าคุณภาพสูงจาก Siamrooftech. ด้วยประสบการณ์และเทคนิคการติดตั้งระบบมือหมุนและมอเตอร์ไฟฟ้ากับโครงสร้างหน้างานต่างๆมากกว่า10ปี",
    url: "https://www.siamrooftech.com/",
    siteName: "Siamrooftech",
    images: [
      {
        url: "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/medium/46570",
        width: 800,
        height: 600,
        alt: "กันสาดพับเก็บได้ Siamrooftech - บริการติดตั้งกันสาดคุณภาพสูง",
      },
      {
        url: "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/46570",
        width: 1800,
        height: 1600,
        alt: "กันสาดพับเก็บได้ Siamrooftech - ผลงานการติดตั้งคุณภาพ",
      },
    ],
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "กันสาดพับเก็บได้ กันสาดอัตโนมัติ สวยๆ ทนทาน คุ้มราคา",
    description: "บริการติดตั้งกันสาดพับเก็บได้ ระบบมือหมุนและระบบมอเตอร์ไฟฟ้าคุณภาพสูงจาก Siamrooftech",
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
      {process.env.NODE_ENV === "production" ? (
        <>
          <GoogleTagManager gtmId={process.env.G_TAGMANAGER_ID || "GTM-MT74ZP2P"} />
          <GoogleAnalytics gaId="AW-17456457441" />
        </>
      ) : null}
      <body className={`bg-white`}>
        <Providers>
          <Navigation />
          <Suspense>{children}</Suspense>
        </Providers>
      </body>
    </html>
  );
}
