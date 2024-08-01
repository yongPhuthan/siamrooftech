import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import { Suspense } from "react";
import type { Metadata } from "next";

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
      <head>

        {/* Google Tag Manager */}
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-W6SMLDZG');
          `,
          }}
        />
         <Script
        id="google-ads-script"
        strategy="afterInteractive"
      >
        {`
          gtag('event', 'conversion', {
              'send_to': 'AW-16657093744/6dlECJiE_sYZEPCo3IY-',
              'value': 1000.0,
              'currency': 'THB'
          });
        `}
      </Script>
        
        {/* End Google Tag Manager */}
      </head>
      <body className={`bg-white`}>
        {/* Google Tag Manager (noscript) */}
                {/* <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TQCXNS3H"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript> */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-W6SMLDZG"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <Providers>
          <Suspense>{children}</Suspense>
        </Providers>
      </body>
    </html>
  );
}
