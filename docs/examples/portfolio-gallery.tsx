// Example: Swiper v11 for an interactive modal/gallery only.
// Do not use Swiper for static public sections such as logo strips.
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectFade } from 'swiper/modules';
import Image from 'next/image';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

interface PortfolioGalleryProps {
  images: string[];
  title: string;
}

export default function PortfolioGallery({ images, title }: PortfolioGalleryProps) {
  return (
    <div className="h-[400px] w-full overflow-hidden rounded-xl bg-gray-100">
      <Swiper
        modules={[Navigation, Pagination, EffectFade]}
        spaceBetween={30}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        effect="fade"
        loop={true}
      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <div className="relative h-[400px] w-full">
              <Image
                src={image}
                alt={`${title} - รูปที่ ${index + 1}`}
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
