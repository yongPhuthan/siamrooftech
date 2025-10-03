'use client';

import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, Close as CloseIcon, ZoomIn as ZoomInIcon } from '@mui/icons-material';
import { Button, Chip, Typography } from '@mui/material';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { Project } from '../../../lib/firestore';
import { usePortfolioStore } from '../../../store/portfolioStore';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import SeparateBeforeAfterGallery from '../../components/portfolio/SeparateBeforeAfterGallery';
import { getBeforeImage, getAfterImages, getBeforeImages, shouldShowBeforeAfter } from '@/lib/project-image-utils';


interface PortfolioDetailClientProps {
  project: Project;
}

export default function PortfolioDetailClient({ project }: PortfolioDetailClientProps) {
  const { getRelatedProjects } = usePortfolioStore();
  const relatedProjects = getRelatedProjects(project, 3);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [swipeThreshold] = useState(50);
  const [initialDistance, setInitialDistance] = useState<number | null>(null);
  const [initialZoom, setInitialZoom] = useState(1);
  
  
  const displayImages = project.images || [];
  const hasImages = displayImages.length > 0;

  // Structured Data สำหรับหน้า Portfolio Detail
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: Array.isArray(project.description) ? project.description.join(" ") : project.description,
    image: project.featured_image || project.images?.[0]?.original_size,
    url: `https://www.siamrooftech.com/portfolio/${project.slug || project.id}`,
    about: "กันสาดพับได้",
    keywords: `กันสาดพับได้, ${project.type}, ${project.category}, ${project.location}`,
    creator: {
      "@type": "Organization", 
      name: "Siamrooftech",
      url: "https://www.siamrooftech.com",
    },
    datePublished: project.completionDate || project.created_at,
    workExample: {
      "@type": "VisualArtwork",
      name: project.title,
      artform: "การติดตั้งกันสาดพับได้",
      artMedium: project.canvas_material,
      size: `${project.width} x ${project.extension} เมตร`,
      locationCreated: project.location,
      dateCreated: project.year,
    },
    mainEntity: {
      "@type": "Product",
      name: `กันสาดพับได้${project.type}`,
      description: `กันสาดพับได้ระบบ${project.type} ขนาด ${project.width}x${project.extension} เมตร`,
      category: "กันสาดพับได้",
      brand: {
        "@type": "Brand",
        name: "Siamrooftech"
      },
      offers: {
        "@type": "Offer",
        availability: "https://schema.org/InStock",
        price: "ติดต่อสอบราคา",
        priceCurrency: "THB",
        seller: {
          "@type": "Organization",
          name: "Siamrooftech"
        }
      }
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "หน้าแรก",
          item: "https://www.siamrooftech.com",
        },
        {
          "@type": "ListItem", 
          position: 2,
          name: "ผลงาน",
          item: "https://www.siamrooftech.com/portfolio",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: project.category,
          item: `https://www.siamrooftech.com/portfolio/category/${encodeURIComponent(project.category)}`,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: project.title,
          item: `https://www.siamrooftech.com/portfolio/${project.slug || project.id}`,
        },
      ],
    },
  };



  // Lightbox functions
  const openLightbox = (index: number) => {
    setLightboxImageIndex(index);
    setImageLoaded(false);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setImageLoaded(false);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const nextLightboxImage = useCallback(() => {
    setImageLoaded(false);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setLightboxImageIndex((prev) => (prev + 1) % displayImages.length);
  }, [displayImages.length]);

  const prevLightboxImage = useCallback(() => {
    setImageLoaded(false);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setLightboxImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  }, [displayImages.length]);

  // Keyboard controls
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!isLightboxOpen) return;
    
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowLeft') {
      prevLightboxImage();
    } else if (e.key === 'ArrowRight') {
      nextLightboxImage();
    }
  }, [isLightboxOpen, prevLightboxImage, nextLightboxImage]);

  // Zoom and pan functionality
  const handleZoom = useCallback((delta: number) => {
    setZoomLevel(prev => Math.max(0.5, Math.min(3, prev + delta)));
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!isLightboxOpen) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoom(delta);
  }, [isLightboxOpen, handleZoom]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setIsDragging(true);
    } else if (e.touches.length === 2) {
      // Pinch to zoom start
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      setInitialDistance(distance);
      setInitialZoom(zoomLevel);
      setTouchStart(null);
      setIsDragging(false);
    }
  }, [zoomLevel]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 2 && initialDistance !== null) {
      // Pinch to zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = getDistance(touch1, touch2);
      const scale = currentDistance / initialDistance;
      const newZoom = Math.max(0.5, Math.min(3, initialZoom * scale));
      setZoomLevel(newZoom);
    } else if (touchStart && isDragging && e.touches.length === 1) {
      // Pan when zoomed
      const deltaX = e.touches[0].clientX - touchStart.x;
      const deltaY = e.touches[0].clientY - touchStart.y;
      
      if (zoomLevel > 1) {
        setPanPosition(prev => ({
          x: prev.x + deltaX * 0.5,
          y: prev.y + deltaY * 0.5
        }));
      }
      
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  }, [touchStart, isDragging, zoomLevel, initialDistance, initialZoom, getDistance]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      // All fingers lifted
      setInitialDistance(null);
      setInitialZoom(1);
      
      if (touchStart && !isDragging) {
        const touchEnd = e.changedTouches[0];
        const deltaX = touchEnd.clientX - touchStart.x;
        const deltaY = touchEnd.clientY - touchStart.y;
        
        // Only trigger swipe if horizontal movement is greater than vertical
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
          if (deltaX > 0 && displayImages.length > 1) {
            // Swipe right - previous image
            prevLightboxImage();
          } else if (deltaX < 0 && displayImages.length > 1) {
            // Swipe left - next image
            nextLightboxImage();
          }
        }
      }
      
      setTouchStart(null);
      setIsDragging(false);
    }
  }, [touchStart, isDragging, swipeThreshold, displayImages.length, prevLightboxImage, nextLightboxImage]);

  const handleDoubleClick = useCallback(() => {
    if (zoomLevel === 1) {
      setZoomLevel(2);
    } else {
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
    }
  }, [zoomLevel]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);


return (
  <div className="min-h-screen bg-white">
    {/* Structured Data */}
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />

    {/* Breadcrumbs */}
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumbs 
          items={[
            { name: 'หน้าแรก', href: '/' },
            { name: 'ผลงาน', href: '/portfolio' },
            { name: project.category, href: `/portfolio/category/${encodeURIComponent(project.category)}` },
            { name: project.title, href: `/portfolio/${project.slug}` }
          ]} 
        />
      </div>
    </div>

    {/* Hero Section - Modern Amazon-like */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Mobile-only heading: แสดงบนหน้าจอเล็กเท่านั้น (ซ่อนบน lg+) */}
      <div className="block lg:hidden mb-6">
        <Typography
          variant="h5"
          component="h1"
          gutterBottom
          className="font-bold text-gray-900"
        >
          กันสาดพับเก็บได้ {project.type} หน้ากว้าง {project.width} เมตร x ระยะแขนพับ {project.extension} เมตร
        </Typography>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* ===== Image Gallery - Before/After or Regular ===== */}
        <div className="flex flex-col gap-4">
          {hasImages ? (
            shouldShowBeforeAfter(project) ? (
              <>
                {/* Separate Before/After Gallery */}
                <SeparateBeforeAfterGallery
                  project={project}
                  afterImages={getAfterImages(project)}
                  beforeImages={getBeforeImages(project)}
                  onImageClick={(image, index, type) => {
                    const allImages = type === 'after' ? getAfterImages(project) : getBeforeImages(project);
                    const globalIndex = project.images?.findIndex(img => img.id === image.id) ?? index;
                    openLightbox(globalIndex);
                  }}
                />
              </>
            ) : (
              <>
                {/* Regular Image Gallery (Backward Compatible) */}
                <div
                  className="relative w-full rounded-xl overflow-hidden bg-gray-100 shadow-md cursor-pointer"
                  style={{ aspectRatio: '1 / 1' }}
                  onClick={() => openLightbox(activeImageIndex)}
                >
                  <Image
                    src={displayImages[activeImageIndex].original_size}
                    alt={
                      displayImages[activeImageIndex].alt_text ||
                      `${project.title} - รูปที่ ${activeImageIndex + 1}`
                    }
                    fill
                    priority
                    className="object-cover"
                  />
                </div>

                {/* Thumbnails */}
                {displayImages.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {displayImages.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImageIndex(index)}
                        className={`relative flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                          activeImageIndex === index
                            ? 'border-blue-500 shadow-lg'
                            : 'border-gray-300'
                        }`}
                        style={{ width: 80, height: 80 }}
                      >
                        <Image
                          src={img.small_size}
                          alt={img.alt_text || `${project.title} thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Image Caption */}
                {displayImages[activeImageIndex]?.caption && (
                  <p className="text-sm text-gray-500">
                    {displayImages[activeImageIndex].caption} • รูปที่{' '}
                    {activeImageIndex + 1} จาก {displayImages.length}
                  </p>
                )}
              </>
            )
          ) : (
            <div className="h-96 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400">
              ไม่มีรูปภาพแสดง
            </div>
          )}
        </div>

        {/* ===== Project Information ===== */}
        <div className="space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="flex flex-wrap gap-2">
                <Chip label={`กันสาด${project.category}`} color="primary" variant="outlined" />
                <Chip label={`กันสาด${project.type}`} color="secondary" variant="outlined" />
              </div>
            </div>

            {/* Desktop-only heading: ซ่อนบน mobile, แสดงบน lg+ */}
            <div className="hidden lg:block">
              <Typography
                variant="h3"
                component="h1"
                gutterBottom
                className="font-bold text-gray-900"
              >
                กันสาดพับเก็บได้ {project.type} หน้ากว้าง {project.width} เมตร x ระยะแขนพับ {project.extension} เมตร
              </Typography>
            </div>

            <div className="space-y-3 my-3">
              {Array.isArray(project.description) ? (
                project.description.map((desc, index) => (
                  <Typography
                    key={index}
                    variant="body1"
                    color="text.secondary"
                    className="leading-relaxed"
                  >
                    {desc}
                  </Typography>
                ))
              ) : (
                <Typography
                  variant="body1"
                  color="text.secondary"
                  className="leading-relaxed"
                >
                  {project.description}
                </Typography>
              )}
            </div>

            {/* Project Details Section - Modern Style */}
            <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                รายละเอียดโปรเจค
              </h2>

              <div className="divide-y divide-gray-200">
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-gray-500">ประเภทงาน</span>
                  <span className="text-sm font-medium text-gray-900">{project.category}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-gray-500">ระบบที่ใช้</span>
                  <span className="text-sm font-medium text-gray-900">{project.type}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-gray-500">จำนวนแขนพับ</span>
                  <span className="text-sm font-medium text-gray-900">{project.arms_count} แขน</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-gray-500">วัสดุผ้าใบ</span>
                  <span className="text-sm font-medium text-gray-900">{project.canvas_material}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-gray-500">ชายผ้า</span>
                  <span className="text-sm font-medium text-gray-900">{project.fabric_edge}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-gray-500">ปีที่ติดตั้ง</span>
                  <span className="text-sm font-medium text-gray-900">{project.year}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-gray-500">สถานที่</span>
                  <span className="text-sm font-medium text-gray-900">{project.location}</span>
                </div>
                {project.client && (
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm text-gray-500">ลูกค้า</span>
                    <span className="text-sm font-medium text-gray-900">{project.client}</span>
                  </div>
                )}
                {project.completionDate && (
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm text-gray-500">วันที่เสร็จสิ้น</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(project.completionDate).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Button
              variant="contained"
              size="large"
              component="a"
              href="https://lin.ee/pPz1ZqN"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              ขอใบเสนอราคาแบบนี้
            </Button>
            <Button
              variant="outlined"
              size="large"
              href="tel:0984542455"
              component="a"
              className="flex-1"
            >
              โทรปรึกษาทันที
            </Button>
          </div>
        </div>
      </div>
    </div>

    {/* Process Timeline */}
    {project.timeline && project.timeline.length > 0 && (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Typography variant="h4" component="h2" gutterBottom className="text-center font-bold mb-12">
            ขั้นตอนการดำเนินงาน
          </Typography>
          <div className="space-y-8">
            {project.timeline.map((phase, index) => (
              <div key={phase.id} className="flex flex-col md:flex-row gap-8 items-start">
                <div className="md:w-1/3">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <Typography variant="h6" className="font-semibold">
                      {phase.phase}
                    </Typography>
                  </div>
                  <Typography variant="body2" color="text.secondary" className="mb-2">
                    {phase.description}
                  </Typography>
                  {phase.date && (
                    <Typography variant="caption" color="text.secondary">
                      {new Date(phase.date).toLocaleDateString('th-TH')}
                    </Typography>
                  )}
                </div>
                <div className="md:w-2/3 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {phase.images.map((imageUrl, imgIndex) => (
                    <div 
                      key={imgIndex}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer"
                      onClick={() => {
                        const allImages = displayImages.concat(
                          phase.images.map(url => ({
                            id: `timeline-${phase.id}-${imgIndex}`,
                            project_id: project.id,
                            title: `${phase.phase} - รูปที่ ${imgIndex + 1}`,
                            small_size: url,
                            original_size: url,
                            alt_text: `${project.title} - ${phase.phase}`,
                            order_index: displayImages.length + imgIndex,
                            type: 'during' as const,
                          }))
                        );
                        openLightbox(displayImages.length + imgIndex);
                      }}
                    >
                      <Image
                        src={imageUrl}
                        alt={`${phase.phase} - รูปที่ ${imgIndex + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )}

    {/* Related Projects */}
    {relatedProjects.length > 0 && (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                โปรเจกต์ที่เกี่ยวข้อง
              </h2>
              <p className="text-gray-600 mt-1">
                ผลงานอื่นๆ ในประเภท {project.category} ที่น่าสนใจ
              </p>
            </div>
            {/* Desktop / Tablet only */}
            <a
              href="/portfolio"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ดูผลงานทั้งหมด →
            </a>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProjects.map((relatedProject) => (
              <a
                key={relatedProject.id}
                href={`/portfolio/${relatedProject.slug || relatedProject.id}`}
                className="rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-shadow bg-white flex flex-col"
              >
                {/* Image */}
                <div className="relative h-48 sm:h-56 lg:h-56 overflow-hidden">
                  <img
                    src={
                      relatedProject.featured_image ||
                      relatedProject.images?.[0]?.original_size ||
                      "/images/default-project.jpg"
                    }
                    alt={relatedProject.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  {/* Tags */}
                  <div className="flex items-center gap-2 mb-2 text-sm flex-wrap">
                    <span className="px-2 py-0.5 rounded-full border border-gray-300 text-gray-600 bg-gray-50">
                      {relatedProject.type}
                    </span>
                    {relatedProject.location && (
                      <span className="text-gray-500">{relatedProject.location}</span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                    {relatedProject.title}
                  </h3>

                  {/* Year */}
                  <span className="text-sm text-gray-500">
                    ปี {relatedProject.year}
                  </span>
                </div>
              </a>
            ))}

            {/* Mobile only → ปุ่มหลังการ์ดสุดท้าย */}
            <div className="sm:hidden">
              <a
                href="/portfolio"
                className="mt-4 w-full inline-flex justify-center items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                ดูผลงานทั้งหมด →
              </a>
            </div>
          </div>
        </div>
      </section>
    )}
  </div>
);

}