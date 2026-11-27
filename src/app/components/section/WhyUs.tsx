import Image from 'next/image';
import { PublicContainer } from '@/components/ui/public';

function WhyUs({keyword}: {keyword: string}) {
  return (
    <PublicContainer>
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="heading-section text-site-ink">
          {keyword}ที่ออกแบบให้เหมาะกับหน้างาน
        </h2>
        <div className="body-copy mt-6 space-y-4 text-base text-site-muted md:text-lg">
          <p>
            เราผ่านประสบการณ์ติดตั้งกันสาดมานาน ทำให้เราเข้าใจถึงปัญหาและความเสี่ยงที่ลูกค้าอาจจะได้เจอจากการติดตั้งกันสาดที่ไม่มีคุณภาพ
          </p>
          <p>
            ดังนั้นงานติดตั้งทุกงานของเราจึงคำนึงถึงความปลอดภัยในเคสการใช้งานกับพื้นผิวและวัสดุของพื้นที่หน้างานต่างๆ
            รวมถึงการออกแบบอุปกรณ์เสริมสำหรับหน้างาน ทั้งกันสาดพับเก็บได้แบบ Manual และกันสาดพับเก็บได้แบบมอเตอร์ไฟฟ้า
          </p>
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-5xl flex-col gap-6 md:mt-10">
        <Image
          className="h-auto w-full rounded-site-media"
          src="https://assets.siamrooftech.com/site/installed-awnings-collage.webp"
          alt={`${keyword} ตัวอย่างงานติดตั้งหน้างานจริง`}
          sizes="(max-width: 1024px) 100vw, 1024px"
          width={500}
          height={500}
          loading="lazy"
        />
        <Image
          className="h-auto w-full rounded-site-media"
          src="https://assets.siamrooftech.com/site/awning-details-collage.webp"
          alt={`${keyword} อุปกรณ์และรายละเอียดงานติดตั้ง`}
          sizes="(max-width: 1024px) 100vw, 1024px"
          width={500}
          height={500}
          loading="lazy"
        />
      </div>
    </PublicContainer>
  );
}

export default WhyUs;
