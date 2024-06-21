'use client';
import { useMemo,useCallback,useState } from 'react';
import HeroSection from './section/HeroSection';
import ProductType from './section/ProductType';
import TrustedBy from './section/TrustedBy';
import WhyUs from './section/WhyUs';
import ProjectShow from './section/ProjectShow';
import ImageGalleryModal from './section/ImageGalleryModal';
import HowItWorks from './section/HowItWorks';
import EndSection from './section/EndSection';
import Footer from './ui/Footer';
import Image from 'next/image';
import Whyus2 from './section/WhyUs2';
import { Stack } from '@mui/material';
type Props = {
  keyword: string;

}
const Main = (props:Props) =>{

const { keyword } = props;
  // const searchParams = useSearchParams();
  // const keyword = searchParams.get('kw') || 'กันสาดพับเก็บได้';
  const [cataloqImages, setCataloqImages] = useState([]);
  const [open, setOpen] = useState(false);

  const projects = useMemo(
    () => [
      {
        id: 1,
        title: [`${keyword}`, 'อาคาร-สำนักงาน'],
        description: [
          'สถานที่ : แขวงคลองถนน เขตสายไหม กรุงเทพมหานคร',
          'ประเภท : กันสาด 2 ระบบ มอเตอร์รีโมทและมือหมุนในชุดเดียวกัน',
          'ขนาด :  กว้าง 530 cm * ยื่นออก 250 cm',
          'วัสดุ : ผ้าใบอะคริลิคสเปนสีขาว',
        ],
        items: [
          {
            id: 1,
            title: [`${keyword}`, 'อาคาร-สำนักงาน'],

            description: 'This is the first project',
            smallSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/46570',
            originalSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/46570',
          },
          {
            id: 2,
            title: 'กันสาดสำเร็จรูปพับเก็บได้',
            description: 'This is the second project',
            smallSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/17042',
            originalSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/17042',
          },
          {
            id: 3,
            title: 'กันสาดสำเร็จรูปพับเก็บได้',
            description: 'This is the third project',
            smallSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/63425',
            originalSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/63425',
          },
          {
            id: 4,
            title: 'กันสาดสำเร็จรูปพับเก็บได้',
            description: 'This is the fourth project',
            smallSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/61840',
            originalSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/61840',
          },
          {
            id: 5,
            title: 'กันสาดสำเร็จรูปพับเก็บได้',
            description: 'This is the third project',
            smallSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/63425',
            originalSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/63425',
          },
        ],
      },
      {
        id: 2,
        title: [`${keyword}`, 'ร้านคาเฟ่ & เบเกอรี่'],
        description: [
          'สถานที่ :  อำเภอเมืองสมุทรปราการ จังหวัดสมุทรปราการ ',
          'ประเภท : กันสาดชนิดมือหมุน',
          'ขนาด :  กว้าง 450 cm * ยื่นออก 250 cm',
          'วัสดุ : ผ้าใบอะคริลิค + พิมพ์ Logo',
        ],
        items: [
          {
            id: 1,
            title: `${keyword} สำหรับโรงแรม`,
            description: 'This is the first project',
            smallSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/71865',
            originalSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/71865',
          },
          {
            id: 2,
            title: `${keyword} สำหรับโรงแรม`,
            description: 'This is the second project',
            smallSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/59107',
            originalSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/59107',
          },
          {
            id: 3,
            title: 'กันสาดสำเร็จรูปพับเก็บได้',
            description: 'This is the third project',
            smallSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/38009',
            originalSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/38009',
          },
          {
            id: 4,
            title: 'กันสาดสำเร็จรูปพับเก็บได้',
            description: 'This is the fourth project',
            smallSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/37540',
            originalSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/37540',
          },
        ],
      },
      {
        id: 3,
        title: [`${keyword}`, 'โรงแรม-รีสอร์ท'],

        description: [
          'สถานที่ : Suvarnabhumi Airport Hotel เขตลาดกระบัง กรุงเทพมหานคร ',
          'ประเภท : กันสาดชนิดมือหมุน',
          'ขนาด :  กว้าง 500 cm * ยื่นออก 250 cm และ กว้าง 300 cm * ยื่นออก 250 cm',
          'วัสดุ : ผ้าใบอะคริลิคสเปน',
        ],
        items: [
          {
            id: 1,
            title: 'กันสาดสำเร็จรูปพับเก็บได้ร้านคาเฟ่',
            description: 'This is the first project',
            smallSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/61013',
            originalSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/61013',
          },
          {
            id: 2,
            title: 'กันสาดสำเร็จรูปพับเก็บได้',
            description: 'This is the second project',
            smallSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/74234',
            originalSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/74234',
          },
          {
            id: 3,
            title: 'กันสาดสำเร็จรูปพับเก็บได้',
            description: 'This is the third project',
            smallSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/10955',
            originalSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/10955',
          },
        ],
      },
      {
        id: 4,
        title: [`${keyword}`, 'ร้านเสริมสวย-สปา'],

        description: [
          'สถานที่ :   ร้าน แจ็คคิ้วสวยบอกต่อ อำเภอเมืองนครปฐม จังหวัดนครปฐม  ',
          'ประเภท : กันสาดชนิดมือหมุน',
          'ขนาด :  กว้าง 570 cm * ยื่นออก 250 cm',
          'วัสดุ : ผ้าใบอะคริลิคสเปน',
        ],
        items: [
          {
            id: 1,
            title: 'กันสาดสำเร็จรูปพับเก็บได้ร้านคาเฟ่',
            description: 'This is the first project',
            smallSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/93381',
            originalSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/93381',
          },
          {
            id: 2,
            title: 'กันสาดสำเร็จรูปพับเก็บได้',
            description: 'This is the second project',
            smallSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/56084',
            originalSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/56084',
          },
          {
            id: 3,
            title: 'กันสาดสำเร็จรูปพับเก็บได้',
            description: 'This is the third project',
            smallSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/83821',
            originalSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/83821',
          },
          {
            id: 4,
            title: 'กันสาดสำเร็จรูปพับเก็บได้',
            description: 'This is the fourth project',
            smallSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/13033',
            originalSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/13033',
          },
        ],
      },
      {
        id: 5,
        title: [`${keyword}`, 'บ้านเดี่ยว-ทาวน์โฮม'],

        description: [
          'สถานที่ :  เขต.ประเวศ กรุงเทพมหานคร  ',
          'ประเภท : กันสาดชนิดมือหมุน',
          'ขนาด : กว้าง 300cm * ยื่นออก 200cm',
          'วัสดุ : ผ้าใบอะคริลิคสเปน',
        ],
        items: [
          {
            id: 1,
            title: 'กันสาดสำเร็จรูปพับเก็บได้ร้านคาเฟ่',
            description: 'This is the first project',
            smallSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/44373',
            originalSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/44373',
          },
          {
            id: 2,
            title: 'กันสาดสำเร็จรูปพับเก็บได้',
            description: 'This is the second project',
            smallSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/43948',
            originalSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/43948',
          },
          {
            id: 3,
            title: 'กันสาดสำเร็จรูปพับเก็บได้',
            description: 'This is the third project',
            smallSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/54182',
            originalSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/54182',
          },
        ],
      },
      {
        id: 6,
        title: [`${keyword}`, 'คีออส-แฟรนไชส์'],

        description: [
          'สถานที่ : ร้าน Black Duck กรุงเทพมหานคร',
          'ประเภท : กันสาดชนิดมือหมุน',
          'ขนาด :  กว้าง 200 cm * ยื่นออก 150 cm',
          'วัสดุ : ผ้าใบอะคริลิคสเปนสีดำ',
        ],
        items: [
          {
            id: 1,
            title: 'กันสาดสำเร็จรูปพับเก็บได้ร้านคาเฟ่',
            description: 'This is the first project',
            smallSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/41791',
            originalSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/41791',
          },
          {
            id: 2,
            title: 'กันสาดสำเร็จรูปพับเก็บได้',
            description: 'This is the second project',
            smallSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/25336',
            originalSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/25336',
          },
          {
            id: 3,
            title: 'กันสาดสำเร็จรูปพับเก็บได้',
            description: 'This is the third project',
            smallSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/71837',
            originalSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/71837',
          },
          {
            id: 4,
            title: 'กันสาดสำเร็จรูปพับเก็บได้',
            description: 'This is the third project',
            smallSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/92517',
            originalSize:
              'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/92517',
          },
        ],
      },
    ],
    [keyword]
  );
  const handleOpen = useCallback(
    (projectId:any) => {
      const selectedProject = projects.find((proj) => proj.id === projectId) as any
      if (selectedProject) {
        setCataloqImages(
          selectedProject.items.map((item :any) => item.originalSize)
        );
        setOpen(true);
      }
    },
    [projects]
  );


  const handleClose = () => setOpen(false);

  return (
    <>
       <div className="bg-white ">
      <HeroSection keyword={keyword} />
      <TrustedBy />
      <ProductType  keyword={keyword}/>
      <WhyUs keyword={keyword} />
      </div>
      <div className="flex items-center justify-center">
  <a href="https://lin.ee/pPz1ZqN" target="_blank" className="inline-block">
    <button
      className="btn btn-link w-1000 mx-auto" // Use DaisyUI button class
      onClick={() => {
        window.dataLayer = window.dataLayer || [] as any;
        window.dataLayer.push({
          event: 'button_click',
          event_category: 'Button',
          event_action: 'Click',
          event_label: 'สอบถามราคา',
        });
      }}
    >
      <Image 
        alt='Add Line ขอใบเสนอราคา'
        src='/images/Add Line.png'
        width={1200}
        height={200}
        className="rounded-2xl" // Rounded corners for the image
      />
    </button>
  </a>
</div>


      <div className="bg-[#fafafaff] pt-5 ">
          {projects.map((project) => (
            <ProjectShow
              key={project.id}
              projectShows={project.items}
              cataloqImages={project.items.map((item:any ) => item.image)}
              handleOpen={() => handleOpen(project.id)}
              title={project.title}
              description={project.description}
            />
          ))}
        </div>
        <ImageGalleryModal
        open={open}
        handleClose={handleClose}
        cataloqImages={cataloqImages}
      />
      <Whyus2 
      keyword={keyword}
      />
      <Stack 
      direction={'column'}
      justifyContent={'center'}
      alignItems={'center'} // This will center the children horizontally
      gap={2}
      sx={{ width: '100%' }} // Make sure the Stack takes full width
      >
          <a href="https://lin.ee/pPz1ZqN" target="_blank" className="inline-block">
    <button
      className="btn btn-link w-1000 mx-auto" // Use DaisyUI button class
      onClick={() => {
        window.dataLayer = window.dataLayer || [] as any;
        window.dataLayer.push({
          event: 'button_click',
          event_category: 'Button',
          event_action: 'Click',
          event_label: 'สอบถามราคา',
        });
      }}
    >
      <Image 
        alt='Add Line ขอใบเสนอราคา'
        src={'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/IMG_5328.JPG'}
        width={600}
        height={600}
        className="rounded-md" // Rounded corners for the image
      />
    </button>
  </a>

    

      <HowItWorks keyword={keyword} />

      <div className="flex items-center justify-center">
  <a href="https://lin.ee/pPz1ZqN" target="_blank" className="inline-block">
    <button
      className="btn btn-link w-1000 mx-auto" // Use DaisyUI button class
      onClick={() => {
        window.dataLayer = window.dataLayer || [] as any;
        window.dataLayer.push({
          event: 'button_click',
          event_category: 'Button',
          event_action: 'Click',
          event_label: 'สอบถามราคา',
        });
      }}
    >
      <Image 
        alt='Add Line ขอใบเสนอราคา'
        src='/images/Add Line.png'
        width={1200}
        height={200}
        className="rounded-2xl" // Rounded corners for the image
      />
    </button>
  </a>
</div>
</Stack>
<div className="flex md:hidden fixed bottom-0 bg-white w-full z-50 pb-3 justify-between px-1 py-2">
        <div className="grid gap-4 grid-cols-2 w-full ">
          <a href="tel:+66984542455" className="track-web-phone-call">
            <button className="btn flex items-center w-full py-auto h-[50px]">
              <Image
                alt="call now icon"
                src="/images/call.png"
                width={20}
                height={20}
              />
              <p className="font_page text-[16px] ml-2 font-semibold">โทรเลย</p>
            </button>
          </a>

          <a
            href="https://lin.ee/pPz1ZqN"
            target="_blank"
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
            <button className="btn flex items-center w-full py-auto h-[50px] bg-[#01b202]">
              <Image
                alt="line icon"
                src="/images/lineedit.png"
                width={25}
                height={25}
              />
              <p className="font_page text-[16px] ml-2 text-white font-semibold">
                สอบถามราคา
              </p>
            </button>
          </a>
        </div>
      </div>
      <div className="bg-gradient-to-br pt-20 mx-auto  from-gray-100 to-gray-200">
      <h1 className="text-md text-gray-500 mt-4 text-center font_page sm:text-2xl md:text-2xl font-bold leading-snug">
             สยามรูฟเทค {keyword} ที่ลูกค้าไว้วางใจ
            </h1>
          {/* <div className="flex items-center justify-center">
            <a
              href="https://lin.ee/pPz1ZqN"
              target="_blank"
              onClick={() => {
                window.dataLayer = window.dataLayer || [] as any
                window.dataLayer.push({
                  event: 'button_click',
                  event_category: 'Button',
                  event_action: 'Click',
                  event_label: 'สอบถามราคา',
                });
              }}
            >
              <button
                className="transition-all mx-auto duration-200 font_page rounded-full py-5 px-20 font-bold text-center bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                style={{
                  '--sky': '#4e73d1' ,
                  '--roofr-blue': '#269bd6',
                  '--white': 'white',
                  backgroundImage:
                    'linear-gradient(225deg, var(--sky), var(--roofr-blue))',
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  lineHeight: '1.5',
                  maxWidth: '100%',
                  textDecoration: 'none',
                  borderRadius: '6rem',
                } as any} 
              >
                รับใบเสนอราคาฟรี
              </button>
            </a>
          </div> */}
<EndSection />
<Footer />
        </div>
    </>
  );
}

export default Main;