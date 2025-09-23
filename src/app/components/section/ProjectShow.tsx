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
  const subtitle = props.subtitle;
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
      <div className="hidden w-full lg:flex md:flex justify-center mb-10 px-4">
        <div className="container max-w-6xl mx-auto">
          {/* Title Section - UX Laws: Visual Hierarchy */}
          <div className="space-y-3 mb-8">
            {/* Main Title */}
            <div className="flex items-center">
              {title.map((item:any, index:number) => (
                <h2
                  key={index}
                  className={`text-left font-bold text-3xl lg:text-4xl ${
                    index === 0
                      ? 'border-l-4 border-blue-600 pl-4 mr-2 text-gray-900'
                      : 'text-blue-600'
                  }`}
                >
                  {item}
                </h2>
              ))}
            </div>
            {/* Subtitle - Portfolio Card Style */}
            {subtitle && (
              <p className="text-lg text-gray-700 font-medium ml-6 opacity-90">
                {subtitle}
              </p>
            )}
          </div>

          {/* Content Grid - Improved Layout (Fitts's Law + Visual Hierarchy) */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
              {/* Main Image - Enhanced Touch Target */}
              <div className="space-y-4">
                <div className="relative group">
                  <Image
                    width={600}
                    height={450}
                    className="w-full h-auto aspect-[4/3] object-cover rounded-xl cursor-pointer transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl"
                    src={projects[0].originalSize}
                    alt={projects[0].title}
                    onClick={() => handleImageClick(projects[0].originalSize)}
                  />
                  {/* Overlay badge */}
                  <div className="absolute top-3 right-3">
                    <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium text-gray-800 shadow-sm">
                      {projects.length} รูป
                    </div>
                  </div>
                </div>
                
                {/* Thumbnail Gallery - Improved Touch Targets */}
                <div className="grid grid-cols-4 gap-3">
                  {projects.slice(0, 4).map((project:any) => (
                    <div key={project.id} className="relative group cursor-pointer" onClick={() => handleImageClick(project.originalSize)}>
                      <Image
                        alt={project.title}
                        width={140}
                        height={105}
                        className="w-full h-20 lg:h-24 object-cover rounded-lg transition-all duration-200 group-hover:scale-105 group-hover:shadow-md"
                        src={project.smallSize}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-200" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Project Details - Miller's Law: Limited Information */}
              <div className="space-y-6">
                <div className="space-y-4">
                  {description.map((item:any, index:number) => {
                    const [label, content] = item.split(' : ');
                    return (
                      <div key={index} className="flex flex-col space-y-1.5 p-4 bg-gray-50 rounded-xl">
                        <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                          {label}
                        </span>
                        <span className="text-base text-gray-800 font-medium">{content}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="my-8 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
          
          {/* Modal for full-screen view */}
          {showModal && (
            <div
              className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-90 flex items-center justify-center z-50"
              onClick={() => setShowModal(false)}
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
                      className="max-h-[97vh] mx-auto z-50"
                      src={project.originalSize}
                      draggable="false"
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
              <div className="swiper-fraction absolute top-2 right-2 p-2"></div>
              <div className="swiper-button-prev"></div>
              <div className="swiper-button-next"></div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowModal(false);
                }}
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
      </div>

      {/* mobile */}
      <div className="flex lg:hidden md:hidden flex-col bg-white rounded-2xl shadow-lg my-6 mx-4 overflow-hidden">
        <div className="w-full">
          {/* Mobile Title Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                {title.map((item:any, index:number) => (
                  <h2
                    key={index}
                    className={`text-white font-bold text-lg ${
                      index === 0 ? 'mr-1' : ''
                    }`}
                  >
                    {item}
                  </h2>
                ))}
              </div>
              {subtitle && (
                <p className="text-blue-100 text-sm text-center font-medium">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            {/* main image */}
            <div className="relative group cursor-pointer rounded-xl overflow-hidden">
              <Image
                onClick={handleOpen}
                sizes="(max-width: 320px) 280px, (max-width: 480px) 440px, 800px"
                src={projects[0]?.originalSize}
                alt={projects[0]?.title}
                width={400}
                height={300}
                className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Image count badge */}
              <div className="absolute top-3 right-3">
                <div className="bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-medium text-gray-800">
                  {projects.length} รูป
                </div>
              </div>
            </div>

            {/* Thumbnail row - Better touch targets */}
            <div className="grid grid-cols-4 gap-2">
              {projects.slice(0, 4).map((project:any) => (
                <div
                  key={project.id}
                  className="relative group cursor-pointer"
                  onClick={props.handleOpen}
                >
                  <Image
                    className="w-full h-16 object-cover rounded-lg transition-all duration-200 group-hover:scale-105"
                    src={project.smallSize}
                    alt={project.title}
                    width={80}
                    height={60}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-200" />
                </div>
              ))}
            </div>

            {showModal && (
              <div
                className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-90 flex items-center justify-center z-50"
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
          
            {/* Mobile Project Details */}
            <div className="space-y-3">
              {description.map((item:any, index:number) => {
                const [label, content] = item.split(' : ');
                return (
                  <div key={index} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                      {label}
                    </div>
                    <div className="text-sm text-gray-800 font-medium">
                      {content}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectShow;
