'use client';
import Image from 'next/image';
import { useState } from 'react';

import { Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/swiper-bundle.css';

const ProjectShow = (props:any) => {
  const [showModal, setShowModal] = useState(false);
  const projects = props.projectShows;
  const title = props.title;
  const description = props.description;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleImageClick = (imageSrc :string ) => {
    setSelectedImage(imageSrc);
    setShowModal(true);
  };

  return (
    <>
      {/* desktop */}
      <div className="hidden w-full  lg:flex md:flex justify-center  mb-10 px-4">
        <div className="container max-w-screen mx-auto">
          <div className="mt-5 p-4 rounded-tl-lg rounded-tr-lg flex">
            {title.map((item:any, index:number) => (
              <p
                key={index}
                className={`text-left  text-[#427ed2ff] font-bold text-3xl ${
                  index === 0
                    ? 'border-l-4 border-blue-500 pl-4 mr-1 text-black'
                    : ''
                }`}
              >
                {item}
              </p>
            ))}
          </div>

          <div className="grid gap-2 grid-cols-2 mt-2  justify-between">
            {/* Main Image - Assuming the first project image is the main one */}
            <div>
              <Image
                width={635}
                height={700}
                className="h-auto max-h-[500px]  rounded rounded-md cursor-pointer"
                src={projects[0].originalSize}
                alt={projects[0].title}
                onClick={() => handleImageClick(projects[0].originalSize)}
              />
            </div>
            <div className=" flex flex-col justify-between h-full text-center gap-1">
              <div className=" ml-5 text-left">
                {/* <h2 className="font-bold font_page text-xl  ">รายละเอียด</h2>
            <div className="divider"></div>  */}

                <div>
                  <ul className="space-y-4">
                    {description.map((item:any, index:number) => {
                      const [subtitle, content] = item.split(' : ');
                      return (
                        <li key={index} className="flex flex-col">
                          <span className="text-lg font-bold mb-1">
                            {subtitle}
                          </span>
                          <span className="text-md font-sans">{content}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              {/* 4 little images row */}
              <div className="flex  bottom-0 w-full self-between ">
                <div className="divider"></div>

                {projects.slice(0, 4).map((project:any) => (
                  <div key={project.id} className="overflow-hidden">
                    <Image
                      alt={title}
                      width={150}
                      height={150}
                      className=" w-[150px] h-[150px] mx-1 rounded rounded-md cursor-pointer"
                      src={project.smallSize}
                      onClick={() => handleImageClick(project.originalSize)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Modal for full-screen view */}
            {showModal && (
              <div
                className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-90 flex items-center justify-center z-50"
                // onClick={() => setShowModal(false)}
              >
                <Swiper
                  navigation={{
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                  }}
                  pagination={{
                    type: 'fraction',
                    el: '.swiper-fraction',
                  }}
                  modules={[Navigation, Pagination]}
                >
                  {projects.map((project:any, index:number) => (
                    <SwiperSlide key={index}>
                      <Image
                      width={900}
                      height={900}
                        alt={project.title}
                        className="max-h-[97vh] mx-auto z-50  "
                        src={project.originalSize}
                        draggable="false"
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
                <div className="swiper-fraction absolute top-2 right-2  p-2 "></div>
                <div className="swiper-button-prev "></div>
                <div className="swiper-button-next"></div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowModal(false);
                  }} // Updated onClick here
                  className="absolute top-[3%] left-2 p-2 text-white bg-opacity-70 rounded-full z-50 cursor-pointer"
                >
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <hr className="my-5 mx-2" />
        </div>
      </div>

      {/* mobile */}
      <div className="flex lg:hidden md:hidden flex-col items-center sm-mt-10 bg-white rounded-lg shadow-lg my-5 mx-1  px-2">
        <div className="container max-w-screen-sm mx-auto">
          <div className="mt-0 bg-[#4371a0] p-3 rounded-t-lg mb-1">
            <p className="text-white text-center font_page font-semibold text-xl">
              {title}
            </p>
          </div>
          <div className=" w-full">
            {/* main image */}
            <div className="w-full h-96 overflow-hidden  cursor-pointer relative z-10">
              <Image
                // onClick={() => handleImageClick(projects[0].image)}

                onClick={handleOpen}
          
                sizes="(max-width: 320px) 280px,
               (max-width: 480px) 440px,
               800px"
                src={projects[0]?.originalSize}
                alt={projects[0]?.title}
                fill
                // loading="lazy"
                // objectFit="cover"
              />
            </div>

            {/* 4 little images row */}
            <div className="flex mt-1 space-x-1">
              {projects.slice(0, 4).map((project:any, ) => (
                <div
                  key={project.id}
                  className="  overflow-hidden rounded-b-md"
                >
                  <Image
                    className=" w-[200px] h-[100px] mt-1 rounded rounded-b-md  cursor-pointer"
                    // onClick={() => handleImageClick(projects[index].image)}

                    onClick={props.handleOpen}
                    // loading="lazy"
                    src={project.smallSize}
                    alt={project.title}
                    width={180}
                    height={100}
                    // objectFit="cover"
                  />
                </div>
              ))}
            </div>

            {showModal && (
              <div
                className="fixed top-0 left-0 w-full  h-full bg-black bg-opacity-90 flex items-center justify-center z-50"
                onClick={() => setShowModal(false)}
              >
                <div
                  className="relative max-h-[90vh] w-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Image
                  width={500}
                  height={500}
                    alt="caption"
                    className="max-h-[90vh] w-auto"
                    src={selectedImage || ''}
                  />
                </div>
                <button
                  className="absolute top-2 left-2 p-2 text-white bg-opacity-70 rounded-full"
                  onClick={() => setShowModal(false)}
                >
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
          {/* <hr className="my-4 mx-1" /> */}
          
          <div className="mb-4 md:px-4 py-8 ">
    <div>
        <ul className="space-y-4">
            {description.map((item:any, index:number) => {
                const [subtitle, content] = item.split(' : ');
                return (
                    <li key={index} className="flex flex-col p-3 bg-gray-100 rounded-lg shadow-inner">
                        <span className="text-lg font-bold mb-1 text-[#427ed2ff]">
                            {subtitle}
                        </span>
                        <span className="text-md font-sans text-gray-700">
                            {content}
                        </span>
                    </li>
                );
            })}
        </ul>
    </div>
</div>

        </div>
      </div>
    </>
  );
};

export default ProjectShow;
