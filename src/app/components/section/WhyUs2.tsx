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
        <Stack
          px={10}
          alignItems={'center'}
          gap={3}
          my={3}
          direction={'column'}
        >
          <div className="md:flex md:justify-center md:items-center mb-5 md:space-x-4">
            <h1 className="text-3xl text-[#427ed2ff] md:text-4xl font_page font-bold text-center">
              {keyword}
            </h1>
            <h1 className="text-3xl md:text-4xl font_page font-bold text-center ">
              ไว้ใจสยามรูฟเทค
            </h1>
          </div>
          <Grid
            style={{
              borderRadius: '12px',
              border: '1px solid #D9D9D9',
              background: 'var(--Background-Light-Paper, #FFF)',
              boxShadow:
                '0px 12px 24px -4px rgba(145, 158, 171, 0.12), 0px 0px 2px 0px rgba(145, 158, 171, 0.20)',
            }}
            container
            maxWidth={'100%'}
            alignItems={'center'}
            justifyContent={'space-between'}
          >
            <Grid mt={3} item xs={7}>
              <Stack alignItems={'center'} gap={3} direction={'column'}>
                <Avatar
                  sx={{ width: 90, height: 90, backgroundColor: '#E9F0FE' }}
                >
                  <FoundationIcon
                    fontSize="large"
                    sx={{ color: '#1769D8', fontSize: '50px' }}
                  />
                </Avatar>
                <Typography fontSize={24} fontWeight={700} align="center">
                  วางใจเรื่องความแข็งแรงปลอดภัย
                </Typography>
                <Typography variant="body1" maxWidth={'90%'} align="center">
                  ทีมงานของเรามีประสบการณ์ติดตั้ง{keyword}มานาน
                  ทำให้เราเข้าใจถึงปัญหาและความเสี่ยงที่ลูกค้าอาจจะได้เจอจากการติดตั้ง
                  {keyword}ที่ไม่มีคุณภาพ ดังนั้นงานติดตั้ง{keyword}
                  ทุกงานของเราคำนึงถึงความปลอดภัยในเคสการใช้งานกับพื้นผิวและวัสดุของพื้นที่หน้างานต่างๆ
                  ที่จำเป็นต้องออกแบบการติดตั้งให้เหมาะสมกับพื้นที่และการใช้งานของลูกค้าที่แตกต่างกัน
                </Typography>
                <a
                    href="https://lin.ee/pPz1ZqN"
                    target="_blank"
                    className="inline-block"
                  >
                    <button
                      className="btn btn-outline btn-large w-[300px] btn-primary mx-auto" // Use DaisyUI button class
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
              </Stack>
            </Grid>
            <Grid item xs={3}>
              <Image
                src={'/images/1675672547482.jpg'}
                width={300}
                height={150}
                style={{ borderRadius: '0 12px  12px 0' }}
                layout="responsive"
                alt="กันสาดพับเก็บได้"
              />
            </Grid>
          </Grid>
          <Grid
            style={{
              borderRadius: '12px',
              border: '1px solid #D9D9D9',
              background: 'var(--Background-Light-Paper, #FFF)',
              boxShadow:
                '0px 12px 24px -4px rgba(145, 158, 171, 0.12), 0px 0px 2px 0px rgba(145, 158, 171, 0.20)',
            }}
            container
            flexDirection={'row-reverse'}
            maxWidth={'100%'}
            justifyContent={'space-between'}
          >
            <Grid mt={3} item xs={6}>
              <Stack
                alignItems={'center'}
                py={6}
                gap={3}
                direction={'column'}
                justifyContent={'flex-start'}
                mr={10}
              >
                <Avatar
                  sx={{ width: 90, height: 90, backgroundColor: '#E9F0FE' }}
                >
                  <LayersIcon
                    fontSize="large"
                    sx={{ color: '#1769D8', fontSize: '50px' }}
                  />
                </Avatar>
                <h1 className="text-2xl  md:text-2xl font_page font-bold text-center">
                  การออกแบบที่เข้ากับหน้างาน
                </h1>
                <Typography variant="body1" align="center">
                  ไม่เพียงแค่เรื่องความแข็งแรงของงานติดตั้งเท่านั้นแต่เรายังคำนึงถึงดีไซน์ของกันสาดที่ต้องเข้ากันได้ดีกับหน้างานของลูกค้าเพราะเราเข้าใจว่า
                  {keyword} คือหน้าตาของบ้านดังนั้นวัสดุและโทนสีของผ้าใบ
                  {keyword}
                  จะต้องเข้ากันได้ดีกับโทนบานของลูกค้าเช่นกัน
                </Typography>
                <a
                    href="https://lin.ee/pPz1ZqN"
                    target="_blank"
                    className="inline-block"
                  >
                    <button
                      className="btn btn-outline btn-large w-[300px] btn-primary mx-auto" // Use DaisyUI button class
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
              </Stack>
            </Grid>
            <Grid item xs={6}>
              <Image
                src={'/images/line_oa_chat_230513_163101.jpg'}
                width={600}
                height={900}
                style={{ borderRadius: ' 12px 0 0  12px ' }}
                alt="กันสาดพับเก็บได้"
              />
            </Grid>
          </Grid>
          <Grid
            style={{
              borderRadius: '12px',
              border: '1px solid #D9D9D9',
              background: 'var(--Background-Light-Paper, #FFF)',
              boxShadow:
                '0px 12px 24px -4px rgba(145, 158, 171, 0.12), 0px 0px 2px 0px rgba(145, 158, 171, 0.20)',
            }}
            container
            maxWidth={'100%'}
            alignItems={'center'}
            justifyContent={'space-between'}
          >
            <Grid mt={3} item xs={6}>
              <Stack alignItems={'center'} gap={3} direction={'column'}>
                <Avatar
                  sx={{ width: 90, height: 90, backgroundColor: '#E9F0FE' }}
                >
                  <FavoriteIcon
                    fontSize="large"
                    sx={{ color: '#1769D8', fontSize: '50px' }}
                  />
                </Avatar>
                <Typography fontSize={24} fontWeight={700} align="center">
                  ใส่ใจบริการหลังการขายทุกงานติดตั้ง
                </Typography>
                <Typography variant="body1" maxWidth={'90%'} align="center">
                  ในกรณีที่เกิดปัญหาจากการใช้งานเรามีบริการหลังการขายที่พร้อมเข้าไปหน้างานโดยใช้เวลาประมาณ
                  2-7 วันหลังรับเรื่องจากลูกค้า และเราเข้าใจว่า{keyword}
                  เป็นงานที่มีความเชี่ยวชาญและวัสดุอุปกรณ์เฉพาะทางที่ต้องมีประสบการณ์ในการติดตั้งดังนั้นในกรณีที่มีปัญหาเล็กๆน้อยๆหลังการใช้งานเป็นเรื่องยุ่งยากที่ลูกค้าจะต้องหาซื้อวัสดุอุปกรณ์มาแก้ไขเอง
                  ดังนั้นถึงแม้หมดระยะประกันไปแล้วเราก็ยังเข้าไปดูแล
                  ปรับ-เปลี่ยนวัสดุอุปกรณ์โดยคิดค่าแรงค่าเดินทางและค่าวัสดุเพียงเล็กน้อยเท่านั้น
                </Typography>
                <a
                    href="https://lin.ee/pPz1ZqN"
                    target="_blank"
                    className="inline-block"
                  >
                    <button
                      className="btn btn-outline btn-large w-[300px] btn-primary mx-auto" // Use DaisyUI button class
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
              </Stack>
            </Grid>
            <Grid item xs={6}>
              <Image
                src={'/images/aftersales.jpg'}
                width={300}
                height={150}
                style={{ borderRadius: '0 12px  12px 0' }}
                layout="responsive"
                alt="กันสาดพับเก็บได้"
              />
            </Grid>
          </Grid>
        </Stack>
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
