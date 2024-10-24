import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import { Suspense } from "react";
import type { Metadata } from "next";
import { GoogleTagManager } from "@next/third-parties/google";

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
  metadataBase: new URL("https://www.siamroofproject.com/"),
  title: "กันสาดพับเก็บได้ กันสาดอัตโนมัติ สวยๆ ทนทาน คุ้มราคา",
  description:
    "บริการติดตั้งกันสาดพับเก็บได้ ระบบมือหมุนและระบบมอเตอร์ไฟฟ้าคุณภาพสูงจาก Siamrooftech. ด้วยประสบการณ์และเทคนิคการติดตั้งระบบมือหมุนและมอเตอร์ไฟฟ้ากับโครงสร้างหน้างานต่างๆมากกว่า10ปี",
  openGraph: {
    title: "กันสาดพับเก็บได้ กันสาดอัตโนมัติ สวยๆ ทนทาน คุ้มราคา",
    description:
      "บริการติดตั้งกันสาดพับเก็บได้ ระบบมือหมุนและระบบมอเตอร์ไฟฟ้าคุณภาพสูงจาก Siamrooftech. ด้วยประสบการณ์และเทคนิคการติดตั้งระบบมือหมุนและมอเตอร์ไฟฟ้ากับโครงสร้างหน้างานต่างๆมากกว่า10ปี",
    url: "https://www.siamroofproject.com/",
    siteName: "Siamrooftech",
    images: [
      {
        url: "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/medium/46570",
        width: 800,
        height: 600,
      },
      {
        url: "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/46570",
        width: 1800,
        height: 1600,
        alt: "กันสาดพับเก็บได้ Siamrooftech",
      },
    ],
    locale: "th_TH",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={myFont.className}>
      {/* โหลด Google Tag Manager */}
      <Script
        strategy="afterInteractive"
        src="https://www.googletagmanager.com/gtag/js?id=AW-11408819333"
      />

      {/* กำหนดค่า gtag */}
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-11408819333');
        `}
      </Script>

      <body className={`bg-white`}>
      {children}
        {/* <Providers>
          <Suspense>{children}</Suspense>
        </Providers> */}
      </body>
    </html>
  );
}
