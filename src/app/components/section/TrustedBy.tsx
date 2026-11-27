import Image from 'next/image';

const logos = [
  {
    src:'/images/logo1.webp',
    alt: 'Logo 1',
  },
  {
    src:'/images/logo-กันสาดพับได้2.webp',
    alt: 'Logo 2',
  },
  {
    src:'/images/logo/39513.webp',
    alt: 'Logo 3',
  },
  {
    src:'/images/logo/54794.webp',
    alt: 'Logo 4',
  },
  {
    src:'/images/logo/62772.webp',
    alt: 'Logo 5',
  },
  {
    src:'/images/logo/64837.webp',
    alt: 'Logo 6',
  },
  {
    src:'/images/logo/71044.webp',
    alt: 'Logo 7',
  },
  {
    src:'/images/logo/79503.webp',
    alt: 'Logo 8',
  },
  {
    src:'/images/logo/83414.webp',
    alt: 'Logo 9',
  },
  {
    src:'/images/logo/84258.webp',
    alt: 'Logo 10',
  },
];

type TrustedByProps = {
  /** Slow right-to-left auto-scroll instead of the static grid. Off by default so the homepage is unaffected. */
  animated?: boolean;
};

function TrustedBy({ animated = false }: TrustedByProps) {
  if (animated) {
    const track = [...logos, ...logos];

    return (
      <section className="mx-auto w-full overflow-hidden bg-transparent px-4 py-4">
        <div className="animate-marquee flex w-max items-center gap-x-8">
          {track.map((logo, index) => (
            <div key={`${logo.src}-${index}`} className="flex shrink-0 justify-center grayscale">
              <Image
                width={100}
                height={50}
                loading="lazy"
                src={logo.src}
                alt={logo.alt}
                sizes="10vw"
                className="h-auto max-h-16 w-24 object-contain"
              />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full bg-transparent px-4 py-4">
      <div className="mx-auto grid max-w-6xl grid-cols-4 items-center justify-items-center gap-x-3 gap-y-4 lg:grid-cols-10">
        {logos.map((logo) => (
          <div key={logo.src} className="flex justify-center grayscale">
            <Image
              width={100}
              height={50}
              loading="lazy"
              src={logo.src}
              alt={logo.alt}
              sizes="(max-width: 1024px) 25vw, 10vw"
              className="h-auto max-h-16 w-auto object-contain"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default TrustedBy;
