import Main from './components/Main';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Siamrooftech',
  description: 'บริการติดตั้งกันสาดพับเก็บได้ ระบบมือหมุนและระบบมอเตอร์ไฟฟ้าคุณภาพสูง',
  url: 'https://www.siamrooftech.com',
  telephone: '+66-98-454-2455',
  email: 'contact@siamrooftech.com',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'TH',
    addressLocality: 'กรุงเทพมหานคร',
    addressRegion: 'กรุงเทพมหานคร',
  },
  // geo: {
  //   '@type': 'GeoCoordinates',
  //   latitude: 13.7563,
  //   longitude: 100.5018,
  // },
  openingHours: 'Mo-Sa 08:00-18:00',
  priceRange: '฿฿',
  serviceArea: {
    '@type': 'Country',
    name: 'Thailand',
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'กันสาดพับเก็บได้',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'กันสาดพับเก็บได้ระบบมือหมุน',
          description: 'ติดตั้งกันสาดพับเก็บได้ระบบมือหมุน เหมาะสำหรับร้านอาหาร คาเฟ่ บ้านพักอาศัย',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'กันสาดพับเก็บได้ระบบมอเตอร์ไฟฟ้า',
          description: 'ติดตั้งกันสาดพับเก็บได้ระบบมอเตอร์ไฟฟ้า เหมาะสำหรับอาคารสูง โรงแรม อาคารสำนักงาน',
        },
      },
    ],
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '127',
  },
  review: [
    {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '5',
        bestRating: '5',
      },
      author: {
        '@type': 'Person',
        name: 'คุณสมชาย',
      },
      reviewBody: 'บริการดีมาก ช่างมีความเชี่ยวชาญ งานเสร็จตรงเวลา คุณภาพดีเยี่ยม',
    },
  ],
  sameAs: [
    'https://www.facebook.com/siamrooftech',
    'https://line.me/R/ti/p/@siamrooftech',
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'กันสาดพับเก็บได้คืออะไร?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'กันสาดพับเก็บได้ คือ ระบบกันแสงแดดและฝนที่สามารถพับเก็บได้เมื่อไม่ใช้งาน ช่วยให้สามารถควบคุมแสงแดดและสร้างพื้นที่ใช้สอยเพิ่มเติมได้ตามต้องการ',
      },
    },
    {
      '@type': 'Question',
      name: 'ระบบมือหมุนและมอเตอร์ไฟฟ้าต่างกันอย่างไร?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'ระบบมือหมุนเป็นการควบคุมแบบแมนนวล เหมาะกับงานขนาดเล็กถึงกลาง ส่วนระบบมอเตอร์ไฟฟ้าควบคุมด้วยรีโมท เหมาะกับงานขนาดใหญ่และต้องการความสะดวกสบาย',
      },
    },
    {
      '@type': 'Question',
      name: 'ราคาการติดตั้งเป็นอย่างไร?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'ราคาขึ้นอยู่กับขนาด วัสดุ และระบบที่เลือก โดยเริ่มต้นที่ประมาณ 15,000-50,000 บาท สามารถขอใบเสนอราคาฟรีได้',
      },
    },
    {
      '@type': 'Question',
      name: 'มีการรับประกันหรือไม่?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'มีการรับประกันคุณภาพงานติดตั้ง 1 ปี และรับประกันอะไหล่ตามเงื่อนไขของผู้ผลิต พร้อมบริการหลังการขาย',
      },
    },
  ],
};

export default async function Home() {
// const keyword = props.searchParams.kw;
const keyword  = 'กันสาดพับได้'
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="bg-white ">
          <Main  keyword={keyword ?  keyword :'กันสาดพับได้'}/>
         {/* <Main projects={projectsByTag} /> */}
        </div>
    </>
  );
}
