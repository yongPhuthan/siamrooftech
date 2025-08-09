// Example: Portfolio gallery with Swiper v11 + MUI
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectFade } from 'swiper/modules';
import { Box, Card, CardMedia } from '@mui/material';
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
    <Box sx={{ width: '100%', height: 400 }}>
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
            <Card>
              <CardMedia
                component="img"
                height="400"
                image={image}
                alt={`${title} - รูปที่ ${index + 1}`}
              />
            </Card>
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
  );
}
