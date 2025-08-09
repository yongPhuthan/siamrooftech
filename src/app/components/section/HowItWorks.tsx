// components/HowItWorks.js

import Image from "next/image";

function HowItWorks({keyword}: {keyword: string}) {
  return (
    <div className="px-4 md:px-24 sm:pt-5  md:py-10 bg-white">
      <div className="flex flex-col md:flex-row justify-center items-center mx-auto mb-10 text-center">
        <h2 className="text-3xl  mt-2 font_page text-[#4a79d2ff] mb-2">ติดตั้ง{keyword}ง่ายๆ</h2>
        <h3 className="text-4xl ml-3 text-[#4a79d2ff] font_page font-bold">3 ขั้นตอน</h3>
      </div>
  
      <div className="flex flex-col md:flex-row flex-wrap mx-auto">
        {/* Step 1 */}
        <div className="w-full md:w-1/3 px-2 md:px-8 mb-12 flex flex-col items-center">
  <div className="w-32 md:w-40 h-32 md:h-40 mb-4 relative">
    <Image 
      src="https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/medium/62260" 
      alt="Step 1" 
      width={128} // Default to 128px, but adjust based on your actual needs
      height={128} // Default to 128px for square aspect ratio, adjust as necessary
      className="object-contain"
    />
  </div>
  <div>
    <div className="flex items-center">
      <h3 className="md:text-3xl text-2xl my-auto font_page font-bold mb-2">
        <span className="bg-[#4a79d2ff] text-white rounded-full w-10 h-10 flex items-center justify-center">1</span>
      </h3>
      <h3 className="text-2xl my-auto text-[#4a79d2ff] font_page ml-5 font-bold mb-2">แจ้งรายละเอียดหน้างาน</h3>
    </div>
    <p className="text-gray-400">
    แจ้งข้อมูลรายละเอียดพื้นที่ติดตั้ง {keyword} รูปถ่าย และความต้องการพิเศษ (ถ้ามี) เพื่อให้เราเข้าใจหน้างานของคุณมากที่สุด</p>
  </div>
</div>
  
        {/* Step 2 */}
        <div className="w-full md:w-1/3 px-2 md:px-8 mb-12 flex flex-col items-center">
          <Image src="https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/53310" alt="Step 2" width={100} height={100}  className="w-32 md:w-40 h-32 md:h-40 mb-4" />
          <div>
            <div className="flex items-center">
              <h3 className="md:text-3xl text-2xl my-auto font_page font-bold mb-2">
                <span className="bg-[#4a79d2ff] text-white rounded-full w-10 h-10 flex items-center justify-center">2</span>
              </h3>
              <h3 className="text-2xl my-auto text-[#4a79d2ff] font_page ml-5 font-bold mb-2">นัดลงพื้นที่สำรวจ</h3>
            </div>
            <p className="text-gray-400">
            นัดเวลาลงสำรวจพื้นที่สำรวจหน้างานติดตั้ง {keyword} โดยทีมงานของเราจะนำตัวอย่างวัสดุสินค้ามาให้ท่านเปรียบเทียบและเลือกรูปแบบตามความต้องการของท่าน
            </p>
          </div>
        </div>





  
        {/* Step 3 */}
        <div className="w-full md:w-1/3 px-2 md:px-8 mb-12 flex flex-col items-center">
        <div className="w-40 h-70  md:h-40 md:block mb-4 relative">
  <Image 
    src="https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/medium/73539" 
    alt="Step 3" 
    width={160} // Matching w-40
    height={128} // Default h-32, for sm and md breakpoints, the container's height changes
    layout="responsive"
    className="object-contain"
  />
</div>

  <div>
    <div className="flex items-center">
      <h3 className="md:text-3xl text-2xl  my-auto font_page font-bold mb-2">
        <span className="bg-[#4a79d2ff] text-white rounded-full w-10 h-10 flex items-center justify-center">3</span>
      </h3>
      <h3 className="text-2xl my-auto text-[#4a79d2ff] font_page ml-5 font-bold mb-2">นัดติดตั้งกันสาด</h3>
    </div>
    <p className="text-gray-400">
    หลังจากสรุปรายการเรียบร้อยแล้วจะเข้าติดตั้ง {keyword} ตามกำหนดการที่นัดหมายร่วมกัน
    </p>
  </div>
</div>
      </div>
    </div>
  );
  
}

export default HowItWorks;
