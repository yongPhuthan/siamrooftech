import LineContactButton from '../LineContactButton';
import { Shield, Stack, Heart } from '@phosphor-icons/react/dist/ssr';
import Image from 'next/image';

type Props = {
  keyword: string;
};

const WhyUs2 = ({ keyword }: Props) => {
  return (
    <>
      {/* Desktop Version - Visible on MD screens and above */}
      <div className="hidden md:block max-w-6xl mx-auto px-6 py-0">
        <div className="flex justify-center items-center gap-3 mb-10">
          <h2 className="text-3xl text-blue-600 font-bold text-center">
            {keyword}
          </h2>
          <h2 className="text-3xl font-bold text-center">
            ไว้ใจสยามรูฟเทค
          </h2>
        </div>

        <div className="space-y-6">
          {/* Card 1: ความแข็งแรงปลอดภัย */}
          <div className="bg-white rounded-md border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
            <div className="grid grid-cols-3 gap-0">
              <div className="col-span-2 p-8 flex flex-col items-center justify-center">
                <div className="w-18 h-18 rounded-full bg-blue-50 flex items-center justify-center mb-6">
                  <Shield className="text-blue-600 w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-center mb-4">
                  วางใจเรื่องความแข็งแรงปลอดภัย
                </h3>
                <p className="text-gray-600 text-center text-sm leading-relaxed mb-6">
                  ทีมงานของเรามีประสบการณ์ติดตั้ง{keyword}มานาน
                  ทำให้เราเข้าใจถึงปัญหาและความเสี่ยงที่ลูกค้าอาจจะได้เจอจากการติดตั้ง
                  {keyword}ที่ไม่มีคุณภาพ ดังนั้นงานติดตั้ง{keyword}
                  ทุกงานของเราคำนึงถึงความปลอดภัยในเคสการใช้งานกับพื้นผิวและวัสดุของพื้นที่หน้างานต่างๆ
                </p>
              </div>
              <div className="col-span-1 relative h-[400px]">
                <Image
                  src="/images/1675672547482.jpg"
                  fill
                  sizes="33vw"
                  className="object-cover"
                  alt="กันสาดพับเก็บได้ ความแข็งแรงปลอดภัย"
                />
              </div>
            </div>
          </div>

          {/* Card 2: การออกแบบที่เข้ากับหน้างาน */}
          <div className="bg-white rounded-md border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
            <div className="grid grid-cols-3 gap-0">
              <div className="col-span-1 relative h-[400px]">
                <Image
                  src="/images/line_oa_chat_230513_163101.jpg"
                  fill
                  sizes="33vw"
                  className="object-cover"
                  alt="กันสาดพับเก็บได้ ดีไซน์เข้ากับหน้างาน"
                />
              </div>
              <div className="col-span-2 p-8 flex flex-col items-center justify-center">
                <div className="w-18 h-18 rounded-full bg-blue-50 flex items-center justify-center mb-6">
                  <Stack className="text-blue-600 w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-center mb-4">
                  การออกแบบที่เข้ากับหน้างาน
                </h3>
                <p className="text-gray-600 text-center text-sm leading-relaxed mb-6">
                  ไม่เพียงแค่เรื่องความแข็งแรงของงานติดตั้งเท่านั้นแต่เรายังคำนึงถึงดีไซน์ของกันสาดที่ต้องเข้ากันได้ดีกับหน้างานของลูกค้าเพราะเราเข้าใจว่า
                  {keyword} คือหน้าตาของบ้านดังนั้นวัสดุและโทนสีของผ้าใบ
                  {keyword}
                  จะต้องเข้ากันได้ดีกับโทนบานของลูกค้าเช่นกัน
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: บริการหลังการขาย */}
          <div className="bg-white rounded-md border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
            <div className="grid grid-cols-3 gap-0">
              <div className="col-span-2 p-8 flex flex-col items-center justify-center">
                <div className="w-18 h-18 rounded-full bg-blue-50 flex items-center justify-center mb-6">
                  <Heart className="text-blue-600 w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-center mb-4">
                  ใส่ใจบริการหลังการขายทุกงานติดตั้ง
                </h3>
                <p className="text-gray-600 text-center text-sm leading-relaxed mb-6">
                  ในกรณีที่เกิดปัญหาจากการใช้งานเรามีบริการหลังการขายที่พร้อมเข้าไปหน้างานโดยใช้เวลาประมาณ
                  2-7 วันหลังรับเรื่องจากลูกค้า และเราเข้าใจว่า{keyword}
                  เป็นงานที่มีความเชี่ยวชาญและวัสดุอุปกรณ์เฉพาะทางที่ต้องมีประสบการณ์ในการติดตั้งดังนั้นในกรณีที่มีปัญหาเล็กๆน้อยๆหลังการใช้งานเป็นเรื่องยุ่งยากที่ลูกค้าจะต้องหาซื้อวัสดุอุปกรณ์มาแก้ไขเอง
                </p>
              </div>
              <div className="col-span-1 relative h-[400px]">
                <Image
                  src="/images/aftersales.jpg"
                  fill
                  sizes="33vw"
                  className="object-cover"
                  alt="กันสาดพับเก็บได้ บริการหลังการขาย"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Version - Visible below MD screens */}
      <div className="block md:hidden px-4 py-8">
        <div className="mb-6 mt-2">
          <h2 className="text-2xl text-blue-600 font-bold text-center mb-1">
            ทำไม{keyword}
          </h2>
          <h2 className="text-2xl font-bold text-center">
            ต้องเลือกสยามรูฟเทค
          </h2>
        </div>

        <div className="flex flex-col gap-6">
          {/* Mobile Card 1 */}
          <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 flex items-center gap-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Shield className="text-blue-600 w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">
                วางใจเรื่องความแข็งแรงปลอดภัย
              </h3>
            </div>
            <div className="relative h-48 w-full bg-gray-100">
              <Image
                src="/images/1675672547482.jpg"
                fill
                sizes="100vw"
                className="object-cover"
                alt="กันสาดพับเก็บได้ ความแข็งแรงปลอดภัย"
              />
            </div>
            <div className="p-4 flex-1">
              <p className="text-sm text-gray-500 leading-relaxed">
                ทีมงานของเรามีประสบการณ์ติดตั้ง{keyword}มานาน
                ทำให้เราเข้าใจถึงปัญหาและความเสี่ยงที่ลูกค้าอาจจะได้เจอจากการติดตั้ง
                {keyword}ที่ไม่มีคุณภาพ ดังนั้นงานติดตั้ง{keyword}
                ทุกงานของเราคำนึงถึงความปลอดภัยในเคสการใช้งานกับพื้นผิวและวัสดุของพื้นที่หน้างานต่างๆ
                ที่จำเป็นต้องออกแบบการติดตั้งให้เหมาะสมกับพื้นที่และการใช้งานของลูกค้าที่แตกต่างกัน
              </p>
            </div>
            <div className="p-4 border-t border-gray-50 bg-gray-50/50">
              <LineContactButton analyticsPosition="why_us_mobile_safety" fullWidth />
            </div>
          </div>

          {/* Mobile Card 2 */}
          <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 flex items-center gap-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Stack className="text-blue-600 w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">
                การออกแบบที่เข้ากับหน้างาน
              </h3>
            </div>
            <div className="relative h-48 w-full bg-gray-100">
              <Image
                src="/images/line_oa_chat_230513_163101.jpg"
                fill
                sizes="100vw"
                className="object-cover"
                alt="กันสาดพับเก็บได้ ดีไซน์เข้ากับหน้างาน"
              />
            </div>
            <div className="p-4 flex-1">
              <p className="text-sm text-gray-500 leading-relaxed">
                ไม่เพียงแค่เรื่องความแข็งแรงของงานติดตั้งเท่านั้นแต่เรายังคำนึงถึงดีไซน์ของกันสาดที่ต้องเข้ากันได้ดีกับหน้างานของลูกค้าเพราะเราเข้าใจว่า
                {keyword} คือหน้าตาของบ้านดังนั้นวัสดุและโทนสีของผ้าใบ
                {keyword}
                จะต้องเข้ากันได้ดีกับโทนบานของลูกค้าเช่นกัน
              </p>
            </div>
            <div className="p-4 border-t border-gray-50 bg-gray-50/50">
              <LineContactButton analyticsPosition="why_us_mobile_design" fullWidth />
            </div>
          </div>

          {/* Mobile Card 3 */}
          <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 flex items-center gap-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Heart className="text-blue-600 w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">
                ใส่ใจบริการหลังการขายทุกงานติดตั้ง
              </h3>
            </div>
            <div className="relative h-48 w-full bg-gray-100">
              <Image
                src="/images/aftersales.jpg"
                fill
                sizes="100vw"
                className="object-cover"
                alt="กันสาดพับเก็บได้ บริการหลังการขาย"
              />
            </div>
            <div className="p-4 flex-1">
              <p className="text-sm text-gray-500 leading-relaxed">
                ในกรณีที่เกิดปัญหาจากการใช้งานเรามีบริการหลังการขายที่พร้อมเข้าไปหน้างานโดยใช้เวลาประมาณ
                2-7 วันหลังรับเรื่องจากลูกค้า และเราเข้าใจว่า{keyword}
                เป็นงานที่มีความเชี่ยวชาญและวัสดุอุปกรณ์เฉพาะทางที่ต้องมีประสบการณ์ในการติดตั้งดังนั้นในกรณีที่มีปัญหาเล็กๆน้อยๆหลังการใช้งานเป็นเรื่องยุ่งยากที่ลูกค้าจะต้องหาซื้อวัสดุอุปกรณ์มาแก้ไขเอง
                ดังนั้นถึงแม้หมดระยะประกันไปแล้วเราก็ยังเข้าไปดูแล
                ปรับ-เปลี่ยนวัสดุอุปกรณ์โดยคิดค่าแรงค่าเดินทางและค่าวัสดุเพียงเล็กน้อยเท่านั้น
              </p>
            </div>
            <div className="p-4 border-t border-gray-50 bg-gray-50/50">
              <LineContactButton analyticsPosition="why_us_mobile_after_sales" fullWidth />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WhyUs2;
