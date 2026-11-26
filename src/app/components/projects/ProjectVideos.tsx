'use client';

import { useState } from 'react';
import VideoModal from '@/components/ui/VideoModal';
import VideoPlayer from '@/components/ui/VideoPlayer';
import type { ProjectVideo } from '@/features/projects/types';

/** Video thumbnails for a project; a click opens the shared video modal. */
export default function ProjectVideos({ videos }: { videos: ProjectVideo[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (videos.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video, index) => (
          <button key={video.id} type="button" className="text-left" onClick={() => setOpenIndex(index)} aria-label={`เล่นวิดีโอ ${index + 1}`}>
            <VideoPlayer video={video} controls={false} />
          </button>
        ))}
      </div>
      <VideoModal
        isOpen={openIndex !== null}
        videos={videos}
        currentIndex={openIndex ?? 0}
        onClose={() => setOpenIndex(null)}
        onNext={() => setOpenIndex((index) => ((index ?? 0) + 1) % videos.length)}
        onPrevious={() => setOpenIndex((index) => ((index ?? 0) - 1 + videos.length) % videos.length)}
      />
    </>
  );
}
