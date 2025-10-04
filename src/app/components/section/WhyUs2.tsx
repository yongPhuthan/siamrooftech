'use client';

import FavoriteIcon from '@mui/icons-material/Favorite';
import FoundationIcon from '@mui/icons-material/Foundation';
import LayersIcon from '@mui/icons-material/Layers';
import {
  Avatar,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  Grid,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material';
import Image from 'next/image';
type Props = {
  keyword: string;
};

const WhyUs2 = (props: Props) => {
  const { keyword } = props;
  const isDesktop = useMediaQuery('(min-width:600px)');
  return (
    <>
      {isDesktop ? (
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex justify-center items-center gap-3 mb-10">
            <h2 className="text-3xl text-[#427ed2ff] font-bold text-center">
              {keyword}
            </h2>
            <h2 className="text-3xl font-bold text-center">
              ไว้ใจสยามรูฟเทค
            </h2>
          </div>

          <div className="space-y-6">
            {/* Card 1: ความแข็งแรงปลอดภัย */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
              <div className="grid grid-cols-3 gap-0">
                <div className="col-span-2 p-8 flex flex-col items-center justify-center">
                  <Avatar
                    sx={{ width: 72, height: 72, backgroundColor: '#E9F0FE', mb: 3 }}
                  >
                    <FoundationIcon
                      sx={{ color: '#1769D8', fontSize: '40px' }}
                    />
                  </Avatar>
                  <h3 className="text-xl font-bold text-center mb-4">
                    วางใจเรื่องความแข็งแรงปลอดภัย
                  </h3>
                  <p className="text-gray-600 text-center text-sm leading-relaxed mb-6">
                    ทีมงานของเรามีประสบการณ์ติดตั้ง{keyword}มานาน
                    ทำให้เราเข้าใจถึงปัญหาและความเสี่ยงที่ลูกค้าอาจจะได้เจอจากการติดตั้ง
                    {keyword}ที่ไม่มีคุณภาพ ดังนั้นงานติดตั้ง{keyword}
                    ทุกงานของเราคำนึงถึงความปลอดภัยในเคสการใช้งานกับพื้นผิวและวัสดุของพื้นที่หน้างานต่างๆ
                  </p>
                  <a href="https://lin.ee/pPz1ZqN" target="_blank">
                    <button
                      className="btn btn-outline btn-primary"
                      onClick={() => {
                        window.dataLayer = window.dataLayer || [];
                        window.dataLayer.push({
                          event: 'button_click',
                          event_category: 'Button',
                          event_action: 'Click',
                          event_label: 'สอบถามราคา',
                        });
                      }}
                    >
                      ประเมินราคาฟรี
                    </button>
                  </a>
                </div>
                <div className="col-span-1">
                  <Image
                    src="/images/1675672547482.jpg"
                    width={400}
                    height={600}
                    className="w-full h-full object-cover"
                    alt="กันสาดพับเก็บได้"
                  />
                </div>
              </div>
            </div>
            {/* Card 2: การออกแบบที่เข้ากับหน้างาน */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
              <div className="grid grid-cols-3 gap-0">
                <div className="col-span-1">
                  <Image
                    src="/images/line_oa_chat_230513_163101.jpg"
                    width={400}
                    height={600}
                    className="w-full h-full object-cover"
                    alt="กันสาดพับเก็บได้"
                  />
                </div>
                <div className="col-span-2 p-8 flex flex-col items-center justify-center">
                  <Avatar
                    sx={{ width: 72, height: 72, backgroundColor: '#E9F0FE', mb: 3 }}
                  >
                    <LayersIcon
                      sx={{ color: '#1769D8', fontSize: '40px' }}
                    />
                  </Avatar>
                  <h3 className="text-xl font-bold text-center mb-4">
                    การออกแบบที่เข้ากับหน้างาน
                  </h3>
                  <p className="text-gray-600 text-center text-sm leading-relaxed mb-6">
                    ไม่เพียงแค่เรื่องความแข็งแรงของงานติดตั้งเท่านั้นแต่เรายังคำนึงถึงดีไซน์ของกันสาดที่ต้องเข้ากันได้ดีกับหน้างานของลูกค้าเพราะเราเข้าใจว่า
                    {keyword} คือหน้าตาของบ้านดังนั้นวัสดุและโทนสีของผ้าใบ
                    {keyword}
                    จะต้องเข้ากันได้ดีกับโทนบานของลูกค้าเช่นกัน
                  </p>
                  <a href="https://lin.ee/pPz1ZqN" target="_blank">
                    <button
                      className="btn btn-outline btn-primary"
                      onClick={() => {
                        window.dataLayer = window.dataLayer || [];
                        window.dataLayer.push({
                          event: 'button_click',
                          event_category: 'Button',
                          event_action: 'Click',
                          event_label: 'สอบถามราคา',
                        });
                      }}
                    >
                      ประเมินราคาฟรี
                    </button>
                  </a>
                </div>
              </div>
            </div>
            {/* Card 3: บริการหลังการขาย */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
              <div className="grid grid-cols-3 gap-0">
                <div className="col-span-2 p-8 flex flex-col items-center justify-center">
                  <Avatar
                    sx={{ width: 72, height: 72, backgroundColor: '#E9F0FE', mb: 3 }}
                  >
                    <FavoriteIcon
                      sx={{ color: '#1769D8', fontSize: '40px' }}
                    />
                  </Avatar>
                  <h3 className="text-xl font-bold text-center mb-4">
                    ใส่ใจบริการหลังการขายทุกงานติดตั้ง
                  </h3>
                  <p className="text-gray-600 text-center text-sm leading-relaxed mb-6">
                    ในกรณีที่เกิดปัญหาจากการใช้งานเรามีบริการหลังการขายที่พร้อมเข้าไปหน้างานโดยใช้เวลาประมาณ
                    2-7 วันหลังรับเรื่องจากลูกค้า และเราเข้าใจว่า{keyword}
                    เป็นงานที่มีความเชี่ยวชาญและวัสดุอุปกรณ์เฉพาะทางที่ต้องมีประสบการณ์ในการติดตั้งดังนั้นในกรณีที่มีปัญหาเล็กๆน้อยๆหลังการใช้งานเป็นเรื่องยุ่งยากที่ลูกค้าจะต้องหาซื้อวัสดุอุปกรณ์มาแก้ไขเอง
                  </p>
                  <a href="https://lin.ee/pPz1ZqN" target="_blank">
                    <button
                      className="btn btn-outline btn-primary"
                      onClick={() => {
                        window.dataLayer = window.dataLayer || [];
                        window.dataLayer.push({
                          event: 'button_click',
                          event_category: 'Button',
                          event_action: 'Click',
                          event_label: 'สอบถามราคา',
                        });
                      }}
                    >
                      ประเมินราคาฟรี
                    </button>
                  </a>
                </div>
                <div className="col-span-1">
                  <Image
                    src="/images/aftersales.jpg"
                    width={400}
                    height={600}
                    className="w-full h-full object-cover"
                    alt="กันสาดพับเก็บได้"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <Stack direction={'column'} gap={0}>
            <div className="md:flex md:justify-center md:items-center mb-5 md:space-x-4 mt-5">
              <h1 className="text-2xl text-[#427ed2ff] md:text-4xl font_page font-bold text-center">
                ทำไม{keyword}
              </h1>
              <h1 className="text-2xl md:text-4xl font_page font-bold text-center ">
                ต้องเลือกสยามรูฟเทค
              </h1>
            </div>
            <Card sx={{ m: 1 }} variant="outlined">
              <CardHeader
                avatar={
                  <Avatar sx={{ backgroundColor: '#E9F0FE' }}>
                    <FoundationIcon sx={{ color: '#1769D8' }} />
                  </Avatar>
                }
                title={
                  <Typography
                    variant="h6"
                    fontStyle={'bold'}
                    fontWeight={800}
                    align="left"
                  >
                    วางใจเรื่องความแข็งแรงปลอดภัย{' '}
                  </Typography>
                }
              ></CardHeader>
              <CardMedia
                component="img"
                height="140px"
                image="/images/1675672547482.jpg"
                alt="green iguana"
                sx={{ maxHeight: '260px' }}
              />
              <CardContent>
                <p className="font-sans text-gray-500">
                  ทีมงานของเรามีประสบการณ์ติดตั้ง{keyword}มานาน
                  ทำให้เราเข้าใจถึงปัญหาและความเสี่ยงที่ลูกค้าอาจจะได้เจอจากการติดตั้ง
                  {keyword}ที่ไม่มีคุณภาพ ดังนั้นงานติดตั้ง{keyword}
                  ทุกงานของเราคำนึงถึงความปลอดภัยในเคสการใช้งานกับพื้นผิวและวัสดุของพื้นที่หน้างานต่างๆ
                  ที่จำเป็นต้องออกแบบการติดตั้งให้เหมาะสมกับพื้นที่และการใช้งานของลูกค้าที่แตกต่างกัน
                </p>
              </CardContent>
              <CardActions>
              <a
                    href="https://lin.ee/pPz1ZqN"
                    target="_blank"
                    className="inline-block"
                  >
                    <button
                      className="btn btn-outline btn-large  btn-primary mx-auto" // Use DaisyUI button class
                      onClick={() => {
                        window.dataLayer = window.dataLayer || ([] as any);
                        window.dataLayer.push({
                          event: 'button_click',
                          event_category: 'Button',
                          event_action: 'Click',
                          event_label: 'สอบถามราคา',
                        });
                      }}
                    >
                      ประเมินราคาฟรี
                    </button>
                  </a>
              </CardActions>
            </Card>
            <Card sx={{ m: 1 }} variant="outlined">
              <CardHeader
                avatar={
                  <Avatar sx={{ backgroundColor: '#E9F0FE' }}>
                    <LayersIcon sx={{ color: '#1769D8' }} />
                  </Avatar>
                }
                title={
                  <Typography variant="h6" fontStyle={'bold'} align="left">
                    การออกแบบที่เข้ากับหน้างาน
                  </Typography>
                }
              ></CardHeader>
              <CardMedia
                component="img"
                height="140px"
                image="/images/line_oa_chat_230513_163101.jpg"
                alt="กันสาดพับเก็บได้"
                sx={{ maxHeight: '260px' }}
              />
              <CardContent>
                <p className="font-sans text-gray-500">
                  ไม่เพียงแค่เรื่องความแข็งแรงของงานติดตั้งเท่านั้นแต่เรายังคำนึงถึงดีไซน์ของกันสาดที่ต้องเข้ากันได้ดีกับหน้างานของลูกค้าเพราะเราเข้าใจว่า
                  {keyword} คือหน้าตาของบ้านดังนั้นวัสดุและโทนสีของผ้าใบ
                  {keyword}
                  จะต้องเข้ากันได้ดีกับโทนบานของลูกค้าเช่นกัน
                </p>
              </CardContent>
              <CardActions>
                <CardActions>
                <a
                    href="https://lin.ee/pPz1ZqN"
                    target="_blank"
                    className="inline-block"
                  >
                    <button
                      className="btn btn-outline btn-large btn-primary mx-auto" // Use DaisyUI button class
                      onClick={() => {
                        window.dataLayer = window.dataLayer || ([] as any);
                        window.dataLayer.push({
                          event: 'button_click',
                          event_category: 'Button',
                          event_action: 'Click',
                          event_label: 'สอบถามราคา',
                        });
                      }}
                    >
                      ประเมินราคาฟรี
                    </button>
                  </a>
                </CardActions>
              </CardActions>
            </Card>
            <Card sx={{ m: 1 }} variant="outlined">
              <CardHeader
                avatar={
                  <Avatar sx={{ backgroundColor: '#E9F0FE' }}>
                    <FavoriteIcon sx={{ color: '#1769D8' }} />
                  </Avatar>
                }
                title={
                  <Typography variant="h6" fontStyle={'bold'} align="left">
                    บริการหลังการขายทุกงานติดตั้ง
                  </Typography>
                }
              ></CardHeader>
              <CardMedia
                component="img"
                height="140px"
                image="/images/aftersales.jpg"
                alt="กันสาดพับเก็บได้"
                sx={{ maxHeight: '260px' }}
              />
              <CardContent>
                <p className="font-sans text-gray-500">
                  ในกรณีที่เกิดปัญหาจากการใช้งานเรามีบริการหลังการขายที่พร้อมเข้าไปหน้างานโดยใช้เวลาประมาณ
                  2-7 วันหลังรับเรื่องจากลูกค้า และเราเข้าใจว่า{keyword}
                  เป็นงานที่มีความเชี่ยวชาญและวัสดุอุปกรณ์เฉพาะทางที่ต้องมีประสบการณ์ในการติดตั้งดังนั้นในกรณีที่มีปัญหาเล็กๆน้อยๆหลังการใช้งานเป็นเรื่องยุ่งยากที่ลูกค้าจะต้องหาซื้อวัสดุอุปกรณ์มาแก้ไขเอง
                  ดังนั้นถึงแม้หมดระยะประกันไปแล้วเราก็ยังเข้าไปดูแล
                  ปรับ-เปลี่ยนวัสดุอุปกรณ์โดยคิดค่าแรงค่าเดินทางและค่าวัสดุเพียงเล็กน้อยเท่านั้น
                </p>
              </CardContent>
              <CardActions>
              <a
                    href="https://lin.ee/pPz1ZqN"
                    target="_blank"
                    className="inline-block"
                  >
                    <button
                      className="btn btn-outline btn-large btn-primary mx-auto" // Use DaisyUI button class
                      onClick={() => {
                        window.dataLayer = window.dataLayer || ([] as any);
                        window.dataLayer.push({
                          event: 'button_click',
                          event_category: 'Button',
                          event_action: 'Click',
                          event_label: 'สอบถามราคา',
                        });
                      }}
                    >
                      ประเมินราคาฟรี
                    </button>
                  </a>
              </CardActions>
            </Card>
          </Stack>
        </>
      )}
    </>
  );
};

export default WhyUs2;
