'use client';

import { CaretLeft, CaretRight, X } from '@phosphor-icons/react/dist/ssr';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PublicIcon } from '@/components/ui/public';
import type { ProjectImage } from '@/features/projects/types';
import ImageWatermark from '../ui/ImageWatermark';

type ProjectGalleryProps = {
  images: ProjectImage[];
  title: string;
};

const SIDE_TILES = 2;
const SWIPE_DISTANCE = 50;

function altFor(image: ProjectImage, title: string, index: number): string {
  return image.alt_text?.trim() || `${title} รูปที่ ${index + 1}`;
}

function BeforeBadge({ image }: { image: ProjectImage }) {
  if (image.type !== 'before') return null;
  return <span className="absolute left-2 top-2 z-30 rounded-site-badge bg-site-surface px-2 py-0.5 text-xs font-semibold text-site-ink">ก่อน</span>;
}

/** Photo-first gallery: a large lead photo, side tiles on wide screens, thumbnails on phones, and a lightbox. */
export default function ProjectGallery({ images, title }: ProjectGalleryProps) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = images.length;

  const show = useCallback((index: number) => setActive((index + count) % count), [count]);
  const openAt = (index: number) => { setActive(index); setOpen(true); };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key === 'ArrowRight') show(active + 1);
      if (event.key === 'ArrowLeft') show(active - 1);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', onKey); };
  }, [open, active, show]);

  if (count === 0) return null;
  const current = images[active];
  const sideTiles = images.slice(1, 1 + SIDE_TILES);
  const hiddenCount = count - 1 - sideTiles.length;

  return (
    <div>
      {/* Wide screens: lead photo with up to two side tiles; the last tile carries the remaining count. */}
      <div className={`hidden gap-2 md:grid ${sideTiles.length ? 'md:grid-cols-3' : ''} ${sideTiles.length === SIDE_TILES ? 'md:grid-rows-2' : ''}`}>
        <button type="button" onClick={() => openAt(0)} className={`relative overflow-hidden rounded-site-media bg-site-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-focus ${sideTiles.length ? `col-span-2 aspect-[4/3] ${sideTiles.length === SIDE_TILES ? 'row-span-2' : ''}` : 'aspect-[16/9]'}`} aria-label={`เปิดรูปที่ 1 จาก ${count}`}>
          <ImageWatermark className="block h-full w-full">
            <Image src={images[0].original_size} alt={altFor(images[0], title, 0)} fill priority sizes="(min-width: 1280px) 860px, 66vw" className="object-cover" />
          </ImageWatermark>
          <BeforeBadge image={images[0]} />
        </button>
        {sideTiles.map((image, offset) => {
          const index = offset + 1;
          const isLast = offset === sideTiles.length - 1 && hiddenCount > 0;
          return (
            <button key={image.id} type="button" onClick={() => openAt(index)} className="relative overflow-hidden rounded-site-media bg-site-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-focus" aria-label={`เปิดรูปที่ ${index + 1} จาก ${count}`}>
              <Image src={image.medium_size || image.original_size} alt={altFor(image, title, index)} fill sizes="33vw" className="object-cover" />
              <BeforeBadge image={image} />
              {isLast && <span className="absolute inset-0 z-30 flex items-center justify-center bg-site-overlay text-base font-semibold text-white">+{hiddenCount} รูป</span>}
            </button>
          );
        })}
      </div>

      {/* Phones: the selected photo, then a thumbnail strip. */}
      <div className="md:hidden">
        <button type="button" onClick={() => setOpen(true)} className="relative block aspect-[4/3] w-full overflow-hidden rounded-site-media bg-site-subtle" aria-label={`เปิดรูปที่ ${active + 1} จาก ${count}`}>
          <ImageWatermark className="block h-full w-full">
            <Image src={current.original_size} alt={altFor(current, title, active)} fill priority sizes="100vw" className="object-cover" />
          </ImageWatermark>
          <BeforeBadge image={current} />
          {count > 1 && <span className="absolute bottom-2 right-2 z-30 rounded-site-badge bg-site-surface px-2 py-0.5 text-xs font-semibold text-site-ink">{active + 1}/{count}</span>}
        </button>
        {count > 1 && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <button key={image.id} type="button" onClick={() => setActive(index)} aria-label={`ดูรูปที่ ${index + 1}`} aria-pressed={index === active} className={`relative h-14 w-20 flex-none overflow-hidden rounded-site-media ${index === active ? 'ring-2 ring-site-ink' : ''}`}>
                <Image src={image.small_size} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {current.caption?.trim() && <p className="mt-2 text-sm text-site-muted md:hidden">{current.caption}</p>}
      {images[0].caption?.trim() && <p className="mt-2 hidden text-sm text-site-muted md:block">{images[0].caption}</p>}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-[99999] flex flex-col bg-black text-white"
          onTouchStart={(event) => { touchX.current = event.touches[0]?.clientX ?? null; }}
          onTouchEnd={(event) => {
            const start = touchX.current;
            const end = event.changedTouches[0]?.clientX;
            touchX.current = null;
            if (start === null || end === undefined || Math.abs(end - start) < SWIPE_DISTANCE) return;
            show(end < start ? active + 1 : active - 1);
          }}
        >
          <div className="flex items-center justify-between p-3 text-sm">
            <span>{current.type === 'before' ? 'ก่อนติดตั้ง · ' : ''}{active + 1} / {count}</span>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-white/10" aria-label="ปิด">
              <PublicIcon icon={X} size={24} />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2" onClick={() => setOpen(false)}>
            <div className="relative h-full w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
              <Image src={current.original_size} alt={altFor(current, title, active)} fill sizes="100vw" className="object-contain" />
            </div>
            {count > 1 && (
              <>
                <button type="button" onClick={(event) => { event.stopPropagation(); show(active - 1); }} className="absolute left-2 rounded-full bg-white/10 p-3 hover:bg-white/20" aria-label="รูปก่อนหน้า">
                  <PublicIcon icon={CaretLeft} size={24} />
                </button>
                <button type="button" onClick={(event) => { event.stopPropagation(); show(active + 1); }} className="absolute right-2 rounded-full bg-white/10 p-3 hover:bg-white/20" aria-label="รูปถัดไป">
                  <PublicIcon icon={CaretRight} size={24} />
                </button>
              </>
            )}
          </div>
          <p className="min-h-12 px-4 py-3 text-center text-sm text-white/85">{current.caption?.trim() ?? ''}</p>
        </div>
      )}
    </div>
  );
}
