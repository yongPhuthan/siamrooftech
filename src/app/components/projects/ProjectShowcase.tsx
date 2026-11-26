import Image from 'next/image';
import Link from 'next/link';
import type { Project, ProjectImage } from '@/features/projects/types';
import { orderedProjectImages, projectHeading } from '@/features/projects/project-presentation';
import { getProjectPath } from '@/lib/project-url';

type ProjectShowcaseProps = {
  projects: Project[];
};

/** Side tiles beside the cover on tablets and desktops: 4 when the project has 5+ photos, else 2 or 1. */
function sideTileCount(photos: number): 0 | 1 | 2 | 4 {
  if (photos >= 5) return 4;
  if (photos >= 3) return 2;
  return photos === 2 ? 1 : 0;
}

const WIDE_LAYOUT = {
  0: { grid: 'md:grid-cols-1', cover: '' },
  1: { grid: 'md:grid-cols-2', cover: '' },
  2: { grid: 'md:grid-cols-3 md:grid-rows-2', cover: 'md:col-span-2 md:row-span-2' },
  4: { grid: 'md:grid-cols-4 md:grid-rows-2', cover: 'md:col-span-2 md:row-span-2' },
} as const;

/** Phones show the cover and a strip of up to 3 more photos. */
const PHONE_STRIP = 3;

function Photo({ image, alt, sizes, priority = false }: { image: ProjectImage; alt: string; sizes: string; priority?: boolean }) {
  return <Image src={image.medium_size || image.original_size} alt={alt} fill sizes={sizes} priority={priority} className="object-cover transition duration-300 group-hover/tile:brightness-90" />;
}

function MoreOverlay({ count }: { count: number }) {
  if (count <= 0) return null;
  return <span className="absolute inset-0 flex items-center justify-center bg-site-overlay text-sm font-semibold text-white md:text-base">+{count} รูป</span>;
}

/** One project per row, photos only: a large cover with a photo grid beside it, Airbnb-style. */
export default function ProjectShowcase({ projects }: ProjectShowcaseProps) {
  const rows = projects.flatMap((project) => {
    const href = getProjectPath(project);
    const images = orderedProjectImages(project);
    return href && images.length ? [{ project, href, images, heading: projectHeading(project) }] : [];
  });

  return (
    <div className="space-y-10 md:space-y-14">
      {rows.map(({ project, href, images, heading }) => {
        const [cover, ...rest] = images;
        const tiles = sideTileCount(images.length);
        const layout = WIDE_LAYOUT[tiles];
        const wideTiles = rest.slice(0, tiles);
        const phoneTiles = rest.slice(0, PHONE_STRIP);
        const altFor = (image: ProjectImage, index: number) => image.alt_text?.trim() || `${heading} รูปที่ ${index + 1}`;

        return (
          <article key={project.id}>
            <h3 className="mb-3 text-lg font-semibold text-site-ink md:text-xl">
              <Link href={href} className="hover:text-site-brand">{heading}</Link>
            </h3>

            <Link href={href} aria-label={`ดูผลงาน ${heading}`} className="block rounded-site-media focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-focus">
              {/* Tablets and desktops: cover on the left, tiles on the right. */}
              <div className={`hidden aspect-[2/1] gap-2 lg:aspect-[5/2] overflow-hidden rounded-site-media md:grid ${layout.grid}`}>
                <div className={`group/tile relative bg-site-subtle ${layout.cover}`}>
                  <Photo image={cover} alt={altFor(cover, 0)} sizes="(min-width: 1280px) 640px, 50vw" />
                </div>
                {wideTiles.map((image, index) => (
                  <div key={image.id} className="group/tile relative bg-site-subtle">
                    <Photo image={image} alt={altFor(image, index + 1)} sizes="(min-width: 1280px) 320px, 25vw" />
                    {index === wideTiles.length - 1 && <MoreOverlay count={images.length - 1 - wideTiles.length} />}
                  </div>
                ))}
              </div>

              {/* Phones: cover, then a strip of up to 3 photos. */}
              <div className="md:hidden">
                <div className="group/tile relative aspect-[4/3] overflow-hidden rounded-site-media bg-site-subtle">
                  <Photo image={cover} alt={altFor(cover, 0)} sizes="100vw" />
                </div>
                {phoneTiles.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {phoneTiles.map((image, index) => (
                      <div key={image.id} className="group/tile relative aspect-square overflow-hidden rounded-site-media bg-site-subtle">
                        <Photo image={image} alt={altFor(image, index + 1)} sizes="33vw" />
                        {index === phoneTiles.length - 1 && <MoreOverlay count={images.length - 1 - phoneTiles.length} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          </article>
        );
      })}
    </div>
  );
}
