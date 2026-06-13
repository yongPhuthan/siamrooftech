import { Project } from "./firestore";

const R2 = "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech";

type LegacyProjectInput = Omit<Project, "images" | "featured_image"> & {
  imageIds?: string[];
  imageUrls?: string[];
};

function makeImages(project: LegacyProjectInput) {
  const fromR2 =
    project.imageIds?.map((id) => ({
      small: `${R2}/small/${id}`,
      original: `${R2}/original/${id}`,
    })) || [];
  const fromUrls =
    project.imageUrls?.map((url) => ({
      small: url,
      original: url,
    })) || [];

  return [...fromR2, ...fromUrls]
    .filter((image, index, all) => {
      return all.findIndex((item) => item.original === image.original) === index;
    })
    .map((image, index) => ({
      id: `${project.id}-image-${index + 1}`,
      project_id: project.id,
      title: project.title,
      description: Array.isArray(project.description)
        ? project.description.join(" ")
        : project.description,
      small_size: image.small,
      original_size: image.original,
      alt_text: `${project.title} ${project.location}`,
      order_index: index,
      type: "after" as const,
    }));
}

function project(input: LegacyProjectInput): Project {
  const images = makeImages(input);
  return {
    ...input,
    featured_image: images[0]?.original_size,
    images,
  };
}

export const legacyFallbackProjects: Project[] = [
  project({
    id: "legacy-1-office-saimai",
    title: "กันสาดพับเก็บได้ อาคาร-สำนักงาน",
    width: 5.3,
    extension: 2.5,
    description: [
      "สถานที่ : แขวงคลองถนน เขตสายไหม กรุงเทพมหานคร",
      "ประเภท : กันสาด 2 ระบบ มอเตอร์รีโมทและมือหมุนในชุดเดียวกัน",
      "ขนาด : กว้าง 530 cm * ยื่นออก 250 cm",
      "วัสดุ : ผ้าใบอะคริลิคสเปนสีขาว",
    ],
    category: "อาคาร-สำนักงาน",
    location: "แขวงคลองถนน เขตสายไหม กรุงเทพมหานคร",
    year: "2024",
    type: "สองระบบ (มือหมุน + มอเตอร์ไฟฟ้า)",
    arms_count: "3",
    canvas_material: "ผ้าอะคริลิคสเปน",
    fabric_edge: "ตัดเรียบ",
    slug: "legacy-office-saimai-530x250",
    imageIds: ["46570", "17042", "63425", "61840", "63425"],
  }),
  project({
    id: "legacy-2-cafe-samutprakan",
    title: "กันสาดพับเก็บได้ ร้านคาเฟ่ & เบเกอรี่",
    width: 4.5,
    extension: 2.5,
    description: [
      "สถานที่ : อำเภอเมืองสมุทรปราการ จังหวัดสมุทรปราการ",
      "ประเภท : กันสาดชนิดมือหมุน",
      "ขนาด : กว้าง 450 cm * ยื่นออก 250 cm",
      "วัสดุ : ผ้าใบอะคริลิค + พิมพ์ Logo",
    ],
    category: "ร้านคาเฟ่ & เบเกอรี่",
    location: "อำเภอเมืองสมุทรปราการ จังหวัดสมุทรปราการ",
    year: "2024",
    type: "ระบบมือหมุน",
    arms_count: "3",
    canvas_material: "ผ้าอะคริลิค",
    fabric_edge: "ตัดเรียบ + พิมพ์ Logo",
    slug: "legacy-cafe-samutprakan-450x250",
    imageIds: ["71865", "59107", "38009", "37540"],
  }),
  project({
    id: "legacy-3-hotel-suvarnabhumi",
    title: "กันสาดพับเก็บได้ โรงแรม-รีสอร์ท",
    width: 5,
    extension: 2.5,
    description: [
      "สถานที่ : Suvarnabhumi Airport Hotel เขตลาดกระบัง กรุงเทพมหานคร",
      "ประเภท : กันสาดชนิดมือหมุน",
      "ขนาด : กว้าง 500 cm * ยื่นออก 250 cm และ กว้าง 300 cm * ยื่นออก 250 cm",
      "วัสดุ : ผ้าใบอะคริลิคสเปน",
    ],
    category: "โรงแรม-รีสอร์ท",
    location: "Suvarnabhumi Airport Hotel เขตลาดกระบัง กรุงเทพมหานคร",
    year: "2024",
    type: "ระบบมือหมุน",
    arms_count: "3",
    canvas_material: "ผ้าอะคริลิคสเปน",
    fabric_edge: "ตัดเรียบ",
    slug: "legacy-hotel-suvarnabhumi-500x250",
    imageIds: ["61013", "74234", "10955"],
  }),
  project({
    id: "legacy-4-salon-nakhonpathom",
    title: "กันสาดพับเก็บได้ ร้านเสริมสวย-สปา",
    width: 5.7,
    extension: 2.5,
    description: [
      "สถานที่ : ร้าน แจ็คคิ้วสวยบอกต่อ อำเภอเมืองนครปฐม จังหวัดนครปฐม",
      "ประเภท : กันสาดชนิดมือหมุน",
      "ขนาด : กว้าง 570 cm * ยื่นออก 250 cm",
      "วัสดุ : ผ้าใบอะคริลิคสเปน",
    ],
    category: "ร้านเสริมสวย-สปา",
    location: "ร้าน แจ็คคิ้วสวยบอกต่อ อำเภอเมืองนครปฐม จังหวัดนครปฐม",
    year: "2024",
    type: "ระบบมือหมุน",
    arms_count: "3",
    canvas_material: "ผ้าอะคริลิคสเปน",
    fabric_edge: "ตัดเรียบ",
    slug: "legacy-salon-nakhonpathom-570x250",
    imageIds: ["93381", "56084", "83821", "13033"],
  }),
  project({
    id: "legacy-5-home-prawet",
    title: "กันสาดพับเก็บได้ บ้านเดี่ยว-ทาวน์โฮม",
    width: 3,
    extension: 2,
    description: [
      "สถานที่ : เขตประเวศ กรุงเทพมหานคร",
      "ประเภท : กันสาดชนิดมือหมุน",
      "ขนาด : กว้าง 300cm * ยื่นออก 200cm",
      "วัสดุ : ผ้าใบอะคริลิคสเปน",
    ],
    category: "บ้านเดี่ยว-ทาวน์โฮม",
    location: "เขตประเวศ กรุงเทพมหานคร",
    year: "2024",
    type: "ระบบมือหมุน",
    arms_count: "2",
    canvas_material: "ผ้าอะคริลิคสเปน",
    fabric_edge: "ตัดเรียบ",
    slug: "legacy-home-prawet-300x200",
    imageIds: ["44373", "43948", "54182"],
  }),
  project({
    id: "legacy-6-kiosk-black-duck",
    title: "กันสาดพับเก็บได้ คีออส-แฟรนไชส์",
    width: 2,
    extension: 1.5,
    description: [
      "สถานที่ : ร้าน Black Duck กรุงเทพมหานคร",
      "ประเภท : กันสาดชนิดมือหมุน",
      "ขนาด : กว้าง 200 cm * ยื่นออก 150 cm",
      "วัสดุ : ผ้าใบอะคริลิคสเปนสีดำ",
    ],
    category: "คีออส-แฟรนไชส์",
    location: "ร้าน Black Duck กรุงเทพมหานคร",
    year: "2024",
    type: "ระบบมือหมุน",
    arms_count: "2",
    canvas_material: "ผ้าอะคริลิคสเปน",
    fabric_edge: "ตัดเรียบ",
    slug: "legacy-kiosk-black-duck-200x150",
    imageIds: ["41791", "25336", "71837", "92517"],
  }),
];

export const legacyProjectsWithUnavailableImageHosts = [
  {
    id: "legacy-7-cafe-rama2",
    title: "กันสาดพับเก็บได้ ร้านคาเฟ่ & เบเกอรี่ พระราม 2",
    unavailableHost: "siamroof.workstandard.co",
    originalImages: ["IMG_6441.JPG", "IMG_6444.JPG", "IMG_6443.JPG", "IMG_6445.JPG"],
  },
  {
    id: "legacy-8-home-saransiri",
    title: "กันสาดพับเก็บได้ บ้านเดี่ยว-ทาวน์โฮม ศรีวารี",
    unavailableHost: "siamroof.workstandard.co",
    originalImages: ["IMG_6307 2.JPG", "IMG_6436.JPG", "IMG_6438.JPG", "IMG_6439.JPG"],
  },
  {
    id: "legacy-9-temple-wat-thaphra",
    title: "กันสาดพับเก็บได้ วิหาร-สำนักสงฆ์",
    unavailableHost: "siamroof.workstandard.co",
    originalImages: ["IMG_6431.JPG", "IMG_6433.JPG", "IMG_6434.JPG", "IMG_6430.JPG"],
  },
];

export function validateLegacyFallbackProjects(projects = legacyFallbackProjects) {
  const errors: string[] = [];
  const featuredImages = new Map<string, string>();

  projects.forEach((project) => {
    if (!project.images.length) {
      errors.push(`${project.id}: missing images`);
    }
    if (!project.featured_image) {
      errors.push(`${project.id}: missing featured_image`);
    }
    if (project.featured_image?.includes("default-project.jpg")) {
      errors.push(`${project.id}: default-project.jpg is not allowed`);
    }
    if (project.featured_image) {
      const owner = featuredImages.get(project.featured_image);
      if (owner) {
        errors.push(`${project.id}: featured_image duplicates ${owner}`);
      }
      featuredImages.set(project.featured_image, project.id);
    }

    const imageSet = new Set<string>();
    project.images.forEach((image) => {
      if (!image.original_size || !image.small_size) {
        errors.push(`${project.id}/${image.id}: missing image URL`);
      }
      if (image.original_size.includes("default-project.jpg")) {
        errors.push(`${project.id}/${image.id}: default-project.jpg is not allowed`);
      }
      if (imageSet.has(image.original_size)) {
        errors.push(`${project.id}/${image.id}: duplicate image inside project`);
      }
      imageSet.add(image.original_size);
    });
  });

  if (errors.length > 0) {
    throw new Error(`Invalid legacy fallback projects:\n${errors.join("\n")}`);
  }
}

validateLegacyFallbackProjects();
