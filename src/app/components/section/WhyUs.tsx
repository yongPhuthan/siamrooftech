import React, { useState } from 'react';
import Image from 'next/image';

function WhyUs({keyword}: {keyword: string}) {
  return (
    <>
<div className="mt-10 md:px-12 lg:px-24 mx-auto">
    <div className="md:flex md:justify-center md:items-center mb-5 md:space-x-4">
        <h1 className="text-3xl text-[#427ed2ff] md:text-4xl font_page font-bold text-center">
            {keyword}
        </h1>
        <h1 className="text-3xl md:text-4xl font_page font-bold text-center ">
            ไว้ใจสยามรูฟเทค
        </h1>
    </div>
    {/* description */}
    <div className=" md:px-24 rounded-lg ">
        <p className="text-center font-sans text-[16px] px-5 md:text-lg leading-relaxed">
            เราผ่านประสบการณ์ติดตั้งกันสาดมานาน ทำให้เราเข้าใจถึงปัญหาและความเสี่ยงที่ลูกค้าอาจจะได้เจอจากการติดตั้งกันสาดที่ไม่มีคุณภาพ 

        </p>
        <p className="text-center font-sans text-[16px] px-5 md:text-lg leading-relaxed">
            ดังนั้นงานติดตั้งทุกงานของเราจึงคำนึงถึงความปลอดภัยในเคสการใช้งานกับพื้นผิวและวัสดุของพื้นที่หน้างานต่างๆ 
        </p>
        <p className="text-center font-sans text-[16px] px-5 md:text-lg leading-relaxed">
            รวมถึงการออกแบบอุปกรณ์เสริมสำหรับหน้างานทั้งกันสาดพับเก็บได้แบบManualและกันสาดพับเก็บได้แบบมอเตอร์ไฟฟ้า
        </p>
    </div>
</div>


      <div
        className={`flex flex-wrap justify-center md:px-12 lg:px-24 mt-5 md:mt-8 items-center mb-5 `}
      >
        <Image
          className={`w-full md:w-4/5 lg:w-4/5 mb-4 md:mb-0`}
          src="https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/20140"
          alt="Group"
          sizes="(max-width: 400px) 400px, (max-width: 900px) 900px, 1000px"
          width={500}
          height={500}
          loading='lazy'
        />
        <Image
          className={`w-full md:w-4/5 lg:w-4/5 mb-4 md:mb-0 `}
          src="https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/78421"
          alt="Group"
          sizes="(max-width: 400px) 400px, (max-width: 900px) 900px, 1000px"
          width={500}
          height={500}
          
          loading='lazy'

        />
      </div>
    </>
  );
}

export default WhyUs;
