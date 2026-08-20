import Image from 'next/image';

const logos = [
  {
    src:'/images/logo1.webp',
    // src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/10123',
    alt: 'Logo 1',
  },
  {
    src:'/images/logo-กันสาดพับได้2.webp',
    // src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/12619',
    alt: 'Logo 2',
  },
  {
    src:'/images/logo/39513.webp',
    // src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/54794',
    alt: 'Logo 3',
  },
  {
    src:'/images/logo/54794.webp',
    // src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/71044',
    alt: 'Logo 4',
  },
  {
    src:'/images/logo/62772.webp',
    // src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/79503',
    alt: 'Logo 5',
  },
  {
    src:'/images/logo/64837.webp',
    // src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/84258',
    alt: 'Logo 6',
  },
  {
    src:'/images/logo/71044.webp',
    // src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/39513',
    alt: 'Logo 7',
  },
  {
    src:'/images/logo/79503.webp',
    // src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/62772',
    alt: 'Logo 8',
  },
  {
    src:'/images/logo/83414.webp',
    // src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/64837',
    alt: 'Logo 9',
  },
  {
    src:'/images/logo/84258.webp',
    // src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/83414',
    alt: 'Logo 10',
  },
  // {
  //   src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/12619',
  //   alt: 'Logo 2',
  // },
  // {
  //   src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/54794',
  //   alt: 'Logo 3',
  // },
  // {
  //   src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/71044',
  //   alt: 'Logo 4',
  // },
  // {
  //   src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/79503',
  //   alt: 'Logo 5',
  // },
  // {
  //   src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/84258',
  //   alt: 'Logo 6',
  // },
  // {
  //   src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/94135',
  //   alt: 'Logo 6',
  // },
 

  // ... add more logos as needed
];

function TrustedBy() {
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
