import localFont from 'next/font/local';
import Script from 'next/script';
import './globals.css';

const myFont = localFont({
  src: [
    {
      path: '../../public/fonts/SukhumvitSet-Medium.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/SukhumvitSet-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/SukhumvitSet-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
  ],
  display: 'swap',
});

export const metadata = {
  title: 'กันสาดพับเก็บได้ กันสาดอัตโนมัติ กันสาดผ้าใบ | by Siamrooftech',
  description:
    'บริการติดตั้งกันสาดพับเก็บได้ ระบบมือหมุนและระบบมอเตอร์ไฟฟ้าคุณภาพสูงจาก Siamrooftech. ด้วยประสบการณ์และเทคนิคการติดตั้งระบบมือหมุนและมอเตอร์ไฟฟ้ากับโครงสร้างหน้างานต่างๆ ทำให้แน่ใจว่าคุณได้รับการปกป้องที่ดีที่สุดสำหรับบ้านของคุณ.',
  openGraph: {
    title: 'กันสาดพับเก็บได้ กันสาดอัตโนมัติ กันสาดผ้าใบ | by Siamrooftech',
    description:
      'บริการติดตั้งกันสาดพับเก็บได้ ระบบมือหมุนและระบบมอเตอร์ไฟฟ้าคุณภาพสูงจาก Siamrooftech. ด้วยประสบการณ์และเทคนิคการติดตั้งระบบมือหมุนและมอเตอร์ไฟฟ้ากับโครงสร้างหน้างานต่างๆ ทำให้แน่ใจว่าคุณได้รับการปกป้องที่ดีที่สุดสำหรับบ้านของคุณ.',
    url: 'https://www.siamroofproject.com/',
    siteName: 'Siamrooftech',
    images: [
      {
        url: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/medium/46570',
        width: 800,
        height: 600,
      },
      {
        url: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/46570',
        width: 1800,
        height: 1600,
        alt: 'กันสาดพับเก็บได้ Siamrooftech',
      },
    ],
    locale: 'th_TH',
    type: 'website',
  },
};
<link rel="icon" href="/favicon.ico" sizes="any" />;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('GA4_TRACKING_ID', process.env.GA4_TRACKING_ID);
  return (
    <html lang="th" className={myFont.className}>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.GA4_TRACKING_ID}`}
          strategy="afterInteractive"
        />
        {/* Google Tag  */}

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-8FQYR14N3D"
          strategy="afterInteractive"
          async
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-8FQYR14N3D');
    `}
        </Script>
        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-M2SNHNR5');
          `,
          }}
        />
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
    (function(w,d,s,l,i){
      w[l] = w[l] || [];
      w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
      var f = d.getElementsByTagName(s)[0],
          j = d.createElement(s), dl = l !== 'dataLayer' ? '&l=' + l : '';
      j.async = true;
      j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
      f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer', 'GTM-TQCXNS3H');
  `}
        </Script>

        {/* End Google Tag Manager */}

        <Script id="gtag-init" strategy="afterInteractive">
          {`
window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-FQJ3EZXFW9');
`}
        </Script>
      </head>
      <body className={`bg-white`}>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-M2SNHNR5"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          ></iframe>
        </noscript>
        {children}
      </body>
    </html>
  );
}
