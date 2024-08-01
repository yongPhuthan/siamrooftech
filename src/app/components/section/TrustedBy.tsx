import { Autoplay, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import Image from 'next/image';
import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/pagination';
import 'swiper/swiper-bundle.css';
const logos = [
  {
    src:'/images/logo1.webp',
    // src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/10123',
    alt: 'Logo 1',
  },
  {
    src:'/images/logo-กันสาดพับได้2.webp',
    // src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/12619',
    alt: 'Logo 2',
  },
  {
    src:'/images/logo/39513.webp',
    // src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/54794',
    alt: 'Logo 3',
  },
  {
    src:'/images/logo/54794.webp',
    // src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/71044',
    alt: 'Logo 4',
  },
  {
    src:'/images/logo/62772.webp',
    // src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/79503',
    alt: 'Logo 5',
  },
  {
    src:'/images/logo/64837.webp',
    // src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/84258',
    alt: 'Logo 6',
  },
  {
    src:'/images/logo/71044.webp',
    // src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/39513',
    alt: 'Logo 7',
  },
  {
    src:'/images/logo/79503.webp',
    // src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/62772',
    alt: 'Logo 8',
  },
  {
    src:'/images/logo/83414.webp',
    // src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/64837',
    alt: 'Logo 9',
  },
  {
    src:'/images/logo/84258.webp',
    // src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/83414',
    alt: 'Logo 10',
  },
  // {
  //   src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/12619',
  //   alt: 'Logo 2',
  // },
  // {
  //   src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/54794',
  //   alt: 'Logo 3',
  // },
  // {
  //   src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/71044',
  //   alt: 'Logo 4',
  // },
  // {
  //   src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/79503',
  //   alt: 'Logo 5',
  // },
  // {
  //   src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/84258',
  //   alt: 'Logo 6',
  // },
  // {
  //   src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/94135',
  //   alt: 'Logo 6',
  // },
 

  // ... add more logos as needed
];

function TrustedBy() {
  return (
    <div className="bg-transparent	 px-4 overflow-hidden mx-auto h-full  ">
      <Swiper
        freeMode={true}
        slidesPerView={'auto'}
        // autoplay={{
        //   delay: 0,
        //   disableOnInteraction: false,
        // }}
        speed={20000}
        loop={true}
        modules={[Pagination, Autoplay]}
        className="mx-auto w-full"
      >
        {logos.map((logo, index) => (
          <SwiperSlide key={index}>
            <div className="bg-transparent	my-5 px-10 overflow-hidden mx-auto h-full">
              <div className="mx-auto flex  justify-center items-center grid  grid-cols-4  gap-y-4 gap-x-1 lg:grid-cols-10  ">
                {logos.map((logo, index) => (
                  <div
                    key={index}
                    className="col-span-1 flex justify-center grayscale"
                  >
                    {/* <Image className="max-h-24 md:max-h-16 lg:max-h-20"  */}
                    <Image
                    width={100} height={50}
                    loading='lazy'
                    src={logo.src} alt={logo.alt} />
                  </div>
                ))}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}





export default TrustedBy;
