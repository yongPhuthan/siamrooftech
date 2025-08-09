'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import { Project } from '../../../lib/firestore';
import FinalCTASection from '../../components/FinalCTASection';

interface ProjectPageClientProps {
  project: Project;
  relatedProjects: Project[];
}

export default function ProjectPageClient({ project, relatedProjects }: ProjectPageClientProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  
  const displayImages = project.images || [];
  const currentImage = displayImages[selectedImageIndex] || {
    original_size: project.featured_image || '/images/default-project.jpg',
    alt_text: project.title
  };

  const openImageModal = (index: number) => {
    setModalImageIndex(index);
    setImageLoaded(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setImageLoaded(false);
    setIsZoomed(false);
  };

  const nextImage = () => {
    setImageLoaded(false);
    setIsZoomed(false);
    setModalImageIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = () => {
    setImageLoaded(false);
    setIsZoomed(false);
    setModalImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!isModalOpen) return;
    
    if (e.key === 'Escape') {
      closeModal();
    } else if (e.key === 'ArrowLeft') {
      prevImage();
    } else if (e.key === 'ArrowRight') {
      nextImage();
    }
  }, [isModalOpen]);

  // Add keyboard event listeners
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Breadcrumbs 
            items={[
              { name: 'หน้าแรก', href: '/' },
              { name: 'ผลงานทั้งหมด', href: '/works' },
              { name: project.title, href: `/works/${project.id}` }
            ]} 
          />
        </div>
      </div>

      {/* Project Detail */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Project Images Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div 
              className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-50 border border-gray-200 cursor-pointer group"
              onClick={() => openImageModal(selectedImageIndex)}
            >
              <Image
                src={currentImage.original_size}
                alt={currentImage.alt_text || project.title}
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
                priority
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
                <div className="bg-white bg-opacity-95 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-sm">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Thumbnail Gallery */}
            {displayImages.length > 1 && (
              <div className="space-y-3">
                <div className={`grid ${showAllImages ? 'grid-cols-6' : 'grid-cols-4'} gap-3`}>
                  {(showAllImages ? displayImages : displayImages.slice(0, 4)).map((image, index) => (
                    <div 
                      key={index} 
                      className={`relative aspect-square overflow-hidden rounded-md bg-gray-50 border cursor-pointer transition-all duration-200 ${
                        selectedImageIndex === index 
                          ? 'border-gray-900 ring-1 ring-gray-900' 
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                      onClick={() => {
                        setSelectedImageIndex(index);
                        openImageModal(index);
                      }}
                    >
                      <Image
                        src={image.original_size}
                        alt={image.alt_text || `${project.title} - รูปที่ ${index + 1}`}
                        fill
                        className="object-cover hover:scale-110 transition-transform duration-200"
                      />
                    </div>
                  ))}
                  {!showAllImages && displayImages.length > 4 && (
                    <div 
                      className="relative aspect-square overflow-hidden rounded-lg bg-gray-900 border border-gray-200 cursor-pointer hover:bg-gray-800 transition-colors flex items-center justify-center"
                      onClick={() => setShowAllImages(true)}
                    >
                      <div className="text-white text-center">
                        <div className="text-lg font-semibold">+{displayImages.length - 4}</div>
                        <div className="text-xs">รูปเพิ่มเติม</div>
                      </div>
                    </div>
                  )}
                </div>
                {showAllImages && displayImages.length > 6 && (
                  <button
                    onClick={() => setShowAllImages(false)}
                    className="text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
                  >
                    ← ย่อรูปภาพ
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Project Info */}
          <div className="space-y-10">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded-md text-sm font-medium border border-gray-200">
                  {project.category}
                </span>
                <span className="bg-gray-50 text-gray-600 px-3 py-1.5 rounded-md text-sm font-medium border border-gray-100">
                  {project.type}
                </span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8 leading-tight">
                {project.title}
              </h1>
              <div className="text-lg text-gray-600 leading-relaxed space-y-4">
                {Array.isArray(project.description) ? (
                  project.description.map((desc, index) => (
                    <p key={index} className="text-gray-600">{desc}</p>
                  ))
                ) : (
                  <p className="text-gray-600">{project.description}</p>
                )}
              </div>
            </div>

            {/* Project Details */}
            <div className="bg-gray-50 rounded-lg p-8 border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">รายละเอียดโปรเจค</h3>
              <div className="grid grid-cols-1 gap-6">
                <div className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
                  <span className="text-gray-500 font-medium">ประเภทงาน</span>
                  <span className="text-gray-900 font-semibold">{project.category}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
                  <span className="text-gray-500 font-medium">ระบบที่ใช้</span>
                  <span className="text-gray-900 font-semibold">{project.type}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
                  <span className="text-gray-500 font-medium">ปีที่ติดตั้ง</span>
                  <span className="text-gray-900 font-semibold">{project.year}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-500 font-medium">สถานที่</span>
                  <span className="text-gray-900 font-semibold">{project.location}</span>
                </div>
              </div>
            </div>

            {/* Contact CTA */}
            <div className="bg-gray-50 rounded-lg p-8 border border-gray-100">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  สนใจโปรเจคแบบนี้?
                </h3>
                <p className="text-gray-600">
                  ปรึกษาฟรี • ออกแบบตามความต้องการ • ติดตั้งมืออาชีพ
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/contact"
                  className="flex-1 bg-gray-900 text-white px-6 py-3.5 rounded-lg font-medium hover:bg-gray-800 transition-colors text-center"
                >
                  ขอใบเสนอราคา
                </Link>
                <a
                  href="tel:02-xxx-xxxx"
                  className="flex-1 border-2 border-gray-300 text-gray-700 px-6 py-3.5 rounded-lg font-medium hover:border-gray-400 hover:bg-gray-100 transition-colors text-center"
                >
                  โทรปรึกษาทันที
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations Section */}
      {relatedProjects.length > 0 && (
        <div className="py-20 bg-gray-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  โปรเจกต์ที่เกี่ยวข้อง
                </h2>
                <p className="text-gray-600">ผลงานอื่นๆ ในประเภท{project.category} ที่น่าสนใจ</p>
              </div>
              <Link
                href="/works"
                className="hidden sm:flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors border border-gray-200 px-4 py-2 rounded-lg hover:bg-white"
              >
                ดูผลงานทั้งหมด →
              </Link>
            </div>
            
            {/* Enhanced Recommendation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProjects.map((relatedProject) => (
                <Link 
                  key={relatedProject.id} 
                  href={`/works/${relatedProject.id}`}
                  className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200"
                >
                  <div className="relative h-48 bg-gray-100">
                    <Image
                      src={relatedProject.featured_image || relatedProject.images?.[0]?.original_size || '/images/default-project.jpg'}
                      alt={relatedProject.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                        {relatedProject.type}
                      </span>
                      <span className="text-gray-500 text-xs">{relatedProject.location}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-700 transition-colors">
                      {relatedProject.title}
                    </h3>
                    <div className="text-sm text-gray-500">
                      ปี {relatedProject.year}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            {/* Mobile View All Button */}
            <div className="mt-6 text-center sm:hidden">
              <Link
                href="/works"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                ดูผลงานทั้งหมด
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Navigation to All Projects */}
      <div className="bg-white py-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-50 rounded-2xl p-10 border border-gray-100">
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <div className="text-center sm:text-left mb-8 sm:mb-0">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  สำรวจผลงานอื่นๆ
                </h3>
                <p className="text-gray-600 max-w-md">
                  ดูผลงานการติดตั้งกันสาดพับเก็บได้หลากหลายประเภทของเรา
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Link
                  href="/works"
                  className="bg-gray-900 text-white px-8 py-3.5 rounded-lg font-medium hover:bg-gray-800 transition-colors inline-flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0l-4-4m4 4l-4 4" />
                  </svg>
                  ดูผลงานทั้งหมด
                </Link>
                <Link
                  href="/contact"
                  className="border-2 border-gray-300 text-gray-700 px-8 py-3.5 rounded-lg font-medium hover:border-gray-400 hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  ขอใบเสนอราคา
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <FinalCTASection 
        title="ต้องการกันสาดพับเก็บได้"
        subtitle="แบบนี้สำหรับโปรเจกต์ของคุณ?"
        projectTitle={project.title}
      />

      {/* Fullscreen Image Modal */}
      {isModalOpen && displayImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors"
            aria-label="ปิด"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous Button */}
          {displayImages.length > 1 && (
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors"
              aria-label="รูปก่อนหน้า"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Next Button */}
          {displayImages.length > 1 && (
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors"
              aria-label="รูปถัดไป"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Main Image */}
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Loading Spinner */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            )}
            
            <img
              src={displayImages[modalImageIndex]?.original_size || '/images/default-project.jpg'}
              alt={displayImages[modalImageIndex]?.alt_text || `${project.title} - รูปที่ ${modalImageIndex + 1}`}
              className={`transition-all duration-300 cursor-zoom-in ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              } ${
                isZoomed 
                  ? 'scale-150 cursor-zoom-out' 
                  : 'max-w-full max-h-full object-contain cursor-zoom-in'
              }`}
              style={{ 
                imageRendering: 'crisp-edges'
              }}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)}
              onClick={() => setIsZoomed(!isZoomed)}
            />
          </div>

          {/* Image Counter and Instructions */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
            {displayImages.length > 1 && (
              <div className="text-white bg-black bg-opacity-50 px-4 py-2 rounded-lg mb-2">
                {modalImageIndex + 1} / {displayImages.length}
              </div>
            )}
            <div className="text-white bg-black bg-opacity-50 px-3 py-1 rounded text-xs">
              คลิกรูปเพื่อซูม • กด Esc เพื่อปิด
            </div>
          </div>

          {/* Thumbnail Navigation */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2 max-w-screen-lg overflow-x-auto px-4">
              {displayImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setModalImageIndex(index)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    modalImageIndex === index 
                      ? 'border-white shadow-lg' 
                      : 'border-gray-400 hover:border-white opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={image.original_size}
                    alt={image.alt_text || `${project.title} - รูปที่ ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Background Click to Close */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={closeModal}
            aria-label="ปิดโมดอล"
          />
        </div>
      )}
    </div>
  );
}