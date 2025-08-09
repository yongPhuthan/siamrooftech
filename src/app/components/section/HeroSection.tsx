import React from 'react';
import Image from 'next/image';

type Props = {
  keyword: string;
};

function HeroSection({ keyword }: Props) {
  return (
    <>
 <div className="relative w-full h-full">
      <Image
        src={"/images/bananer-กันสาดพับเก็บได้.webp"}
        fill
        style={{ objectFit: "cover", objectPosition: "center" }}
        priority
        className="opacity-10"
        alt="กันสาดพับเก็บได้ Siamrooftech - ภาพพื้นหลัง"
        sizes="100vw"
      />
      {/* เนื้อหาอื่นๆ ที่คุณต้องการให้อยู่เหนือภาพ background  */}
    </div>
      <section className="bg-white ">
        <div className="grid md:pb-8 mx-auto lg:grid-cols-12">
          <div className="z-10 place-self-center order-2 lg:order-1 lg:col-span-6 text-center py-5 sm:py-12  md:py-6">
            <h1 className="text-4xl text-[#002573] font_page sm:text-5xl md:text-6xl font-bold leading-tight">
              สยามรูฟเทค
            </h1>
            <h1 className="text-2xl text-[#002573] mt-4 font_page sm:text-2xl md:text-5xl font-bold leading-snug">
              {keyword} ที่ลูกค้าไว้วางใจ
            </h1>
          </div>

          <div className="order-1  lg:order-2 lg:mt-0 lg:col-span-6 ml-5 sm:ml-4 lg:flex">
            <div className="relative w-full h-40 pb-[56.25%] lg:pb-[20] lg:h-full">
              <Image
                src={"/images/bananer-กันสาดพับเก็บได้.webp"}
                alt={`${keyword} - ผลงานการติดตั้งโดย Siamrooftech`}
                fill
                style={{ objectFit: "cover" }}
                className="z-10"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default HeroSection;
