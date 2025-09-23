'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import 'swiper/css';
import 'swiper/css/autoplay';
import { Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.css';

import 'swiper/css/pagination';

type ImageGalleryModalProps = {
  open: boolean;
  handleClose: () => void;
  cataloqImages: string[];
};

const ImageGalleryModal = (props: ImageGalleryModalProps) => {
  const { open: initialOpen, handleClose, cataloqImages } = props;
  const [displayModal, setDisplayModal] = useState(initialOpen);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<{ [key: number]: boolean }>({});  
  useEffect(() => {
    if (initialOpen) {
      setDisplayModal(true);
      const modalElement = document.getElementById('image-gallery-modal');
      if (modalElement instanceof HTMLDialogElement) {
        // Type assertion here
        modalElement.showModal();
      } else {
        console.error('The element is not a dialog');
      }
    }
  }, [initialOpen]);

  const handleModalClose = () => {
    handleClose();
    setSelectedImage(null);
  };

  const handleImageClick = (image: string) => {
    setSelectedImage(image);
  };

  return (
    <>
      <dialog
        id="image-gallery-modal"
        className="modal modal-backdrop fixed inset-0 w-full h-full"
      >
        {/* Fixed top navbar-like container */}
        <div className="fixed top-0 left-0 right-0 bg-white z-10 shadow-sm">
          <div className="modal-action pb-5 px-5 flex justify-between">
            <form method="dialog">
              <button
                className="btn btn-md btn-outline"
                aria-label="Close"

                onClick={handleModalClose}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>

        <div className="modal-box w-full max-h-full rounded-none bg-white pt-20">
          <div className="grid gap-4 grid-cols-1 mt-5">
            {cataloqImages?.map((image, index) => (
              <div
                className={`w-full cursor-pointer ${
                  !loadedImages[index] ? 'skeleton' : ''
                }`}
                style={!loadedImages[index] ? { height: '500px' } : {}}
                key={index}
              >
                <Image
                  onLoad={() =>
                    setLoadedImages((prev) => ({ ...prev, [index]: true }))
                  }
                  onClick={() => handleImageClick(image)}
                  src={image}
                  width={500}
                  height={500}
                  alt={`Image ${index + 1}`}
                  loading="lazy"
                  placeholder="empty"
                />
              </div>
            ))}
          </div>
        </div>
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black w-full h-full bg-opacity-90 flex items-center justify-center z-50"
            onClick={handleModalClose} // Close modal when clicking on the backdrop
          >
            <button
              className="absolute top-[3%] pl-4 left-0 "
              onClick={handleModalClose}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="white"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <Swiper
              pagination={{
                type: 'fraction',
                el: '.swiper-fraction',
              }}
              modules={[Pagination]}
            >
           {cataloqImages.map((image, index) => (
  <SwiperSlide key={index}>
    <div className="relative" style={{height: '90vh'}}> {/* Ensure the parent div has a height if using layout="responsive" */}
      <Image
        src={image}
        alt={`Image ${index + 1}`}
        width={500} // Specify width
        height={500} // Specify height
        layout="responsive" // Makes the image responsive while maintaining aspect ratio
        objectFit="contain" // Adjust this as needed
        className="z-50"
        draggable="false"
      />
    </div>
  </SwiperSlide>
))}

            </Swiper>
            <div className="swiper-fraction absolute "></div>
          </div>
        )}
      </dialog>
    </>
  );
};

export default ImageGalleryModal;
