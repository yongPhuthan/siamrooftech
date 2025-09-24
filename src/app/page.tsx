import Main from './components/Main';
import { projectsAdminService } from '@/lib/firestore-admin';
import { Project } from '@/lib/firestore';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': ['LocalBusiness', 'Organization'],
  name: 'Siamrooftech - กันสาดพับได้ คุณภาพสูง',
  description: 'ผู้เชี่ยวชาญด้านกันสาดพับเก็บได้ ระบบมือหมุนและมอเตอร์ไฟฟ้า บริการติดตั้งครบวงจร มากกว่า 10 ปีประสบการณ์',
  url: 'https://www.siamrooftech.com',
  telephone: '+66-98-454-2455',
  email: 'contact@siamrooftech.com',
  logo: 'https://www.siamrooftech.com/logo.png',
  image: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/medium/46570',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'TH',
    addressLocality: 'กรุงเทพมหานคร',
    addressRegion: 'กรุงเทพมหานคร',
  },
  openingHours: 'Mo-Sa 08:00-18:00',
  priceRange: '฿฿',
  serviceArea: {
    '@type': 'Country',
    name: 'Thailand',
  },
  makesOffer: [
    {
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: 'กันสาดพับเก็บได้ระบบมือหมุน',
        description: 'ติดตั้งกันสาดพับเก็บได้ระบบมือหมุน เหมาะสำหรับร้านอาหาร คาเฟ่ บ้านพักอาศัย คุณภาพยุโรป ทนทาน',
        category: 'กันสาดพับได้',
      },
    },
    {
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: 'กันสาดพับเก็บได้ระบบมอเตอร์ไฟฟ้า',
        description: 'ติดตั้งกันสาดพับเก็บได้ระบบมอเตอร์ไฟฟ้า พร้อมรีโมทคอนโทรล เหมาะสำหรับอาคารสูง โรงแรม อาคารสำนักงาน',
        category: 'กันสาดพับได้',
      },
    },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '127',
    bestRating: '5',
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
      reviewBody: 'บริการกันสาดพับได้ดีมาก ช่างมีความเชี่ยวชาญ งานเสร็จตรงเวลา คุณภาพดีเยี่ยม แนะนำเลย',
    },
  ],
  foundingDate: '2014',
  numberOfEmployees: '15-20',
  slogan: 'กันสาดพับได้ คุณภาพยุโรป ราคาไทย',
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

// Enable ISR with 60 seconds revalidation (เหมือนหน้า "ผลงานทั้งหมด")
export const revalidate = 60;

async function fetchProjects(): Promise<Project[]> {
  try {
    console.log('🔍 [Homepage] Fetching projects using projectsAdminService.getAll()...');
    
    // ใช้ projectsAdminService.getAll() ตรงๆ เหมือนหน้า "ผลงานทั้งหมด"
    const projects = await projectsAdminService.getAll();
    
    console.log('📊 [Homepage] Projects loaded:', {
      count: projects?.length || 0,
      source: 'Firebase Admin SDK',
      hasData: projects && projects.length > 0
    });
    
    if (!projects || projects.length === 0) {
      console.warn('⚠️ [Homepage] No projects loaded from Firebase Admin SDK');
    }
    
    return projects || [];
  } catch (error) {
    console.error('❌ [Homepage] Error fetching projects:', error);
    return [];
  }
}

export default async function Home() {
// const keyword = props.searchParams.kw;
const keyword  = 'กันสาดพับได้'
const projects = await fetchProjects();
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
          <Main keyword={keyword ?  keyword :'กันสาดพับได้'} projects={projects}/>
         {/* <Main projects={projectsByTag} /> */}
        </div>
    </>
  );
}
