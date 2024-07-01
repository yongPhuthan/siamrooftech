"use client";
import { useMemo, useCallback, useState } from "react";
import HeroSection from "./section/HeroSection";
import ProductType from "./section/ProductType";
import TrustedBy from "./section/TrustedBy";
import WhyUs from "./section/WhyUs";
import ProjectShow from "./section/ProjectShow";
import ImageGalleryModal from "./section/ImageGalleryModal";
import HowItWorks from "./section/HowItWorks";
import EndSection from "./section/EndSection";
import Footer from "./ui/Footer";
import Image from "next/image";
import Whyus2 from "./section/WhyUs2";
import { Stack } from "@mui/material";
type Props = {
  keyword: string;
};
const Main = (props: Props) => {
  const { keyword } = props;
  // const searchParams = useSearchParams();
  // const keyword = searchParams.get('kw') || 'กันสาดพับเก็บได้';
  const [cataloqImages, setCataloqImages] = useState([]);
  const [open, setOpen] = useState(false);

  const projects = useMemo(
    () => [
      {
        id: 1,
        title: [`${keyword} `, "อาคาร-สำนักงาน"],
        description: [
          "สถานที่ : แขวงคลองถนน เขตสายไหม กรุงเทพมหานคร",
          "ประเภท : กันสาด 2 ระบบ มอเตอร์รีโมทและมือหมุนในชุดเดียวกัน",
          "ขนาด :  กว้าง 530 cm * ยื่นออก 250 cm",
          "วัสดุ : ผ้าใบอะคริลิคสเปนสีขาว",
        ],
        items: [
          {
            id: 1,
            title: [`${keyword} `, "อาคาร-สำนักงาน"],

            description: "This is the first project",
            smallSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/46570",
            originalSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/46570",
          },
          {
            id: 2,
            title: "กันสาดสำเร็จรูปพับเก็บได้",
            description: "This is the second project",
            smallSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/17042",
            originalSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/17042",
          },
          {
            id: 3,
            title: "กันสาดสำเร็จรูปพับเก็บได้",
            description: "This is the third project",
            smallSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/63425",
            originalSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/63425",
          },
          {
            id: 4,
            title: "กันสาดสำเร็จรูปพับเก็บได้",
            description: "This is the fourth project",
            smallSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/61840",
            originalSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/61840",
          },
          {
            id: 5,
            title: "กันสาดสำเร็จรูปพับเก็บได้",
            description: "This is the third project",
            smallSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/63425",
            originalSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/63425",
          },
        ],
      },
      {
        id: 2,
        title: [`${keyword} `, "ร้านคาเฟ่ & เบเกอรี่"],
        description: [
          "สถานที่ :  อำเภอเมืองสมุทรปราการ จังหวัดสมุทรปราการ ",
          "ประเภท : กันสาดชนิดมือหมุน",
          "ขนาด :  กว้าง 450 cm * ยื่นออก 250 cm",
          "วัสดุ : ผ้าใบอะคริลิค + พิมพ์ Logo",
        ],
        items: [
          {
            id: 1,
            title: `${keyword} สำหรับโรงแรม`,
            description: "This is the first project",
            smallSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/71865",
            originalSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/71865",
          },
          {
            id: 2,
            title: `${keyword} สำหรับโรงแรม`,
            description: "This is the second project",
            smallSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/59107",
            originalSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/59107",
          },
          {
            id: 3,
            title: "กันสาดสำเร็จรูปพับเก็บได้",
            description: "This is the third project",
            smallSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/38009",
            originalSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/38009",
          },
          {
            id: 4,
            title: "กันสาดสำเร็จรูปพับเก็บได้",
            description: "This is the fourth project",
            smallSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/37540",
            originalSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/37540",
          },
        ],
      },
      {
        id: 2,
        title: [`${keyword} `, "ร้านคาเฟ่ & เบเกอรี่"],
        description: [
          "สถานที่ :  หมู่บ้านการเคหะธนฯ  ถ.พระราม2 ",
          "ประเภท : กันสาดชนิดมอเตอร์รีโมทและมือหมุนในชุดเดียวกัน",
          "ขนาด :  กว้าง 560 cm * ยื่นออก 200 cm (4 แขนพับ)",
          "วัสดุ : ผ้าใบอะคริลิค ชายผ้าตัดเรียบตรง",
        ],
        items: [
          {
            id: 1,
            title: `${keyword} ร้านคาเฟ่ & เบเกอรี่`,
            description: "ร้านคาเฟ่ & เบเกอรี่",
            smallSize:
              "https://firebasestorage.googleapis.com/v0/b/worktrust-b9c02.appspot.com/o/siamrooftech%2FIMG_6441.webp?alt=media&token=24927104-2075-4cb8-b767-e195ba99c8b2",
            originalSize:
              "https://firebasestorage.googleapis.com/v0/b/worktrust-b9c02.appspot.com/o/siamrooftech%2FIMG_6441.webp?alt=media&token=24927104-2075-4cb8-b767-e195ba99c8b2",
          },
          {
            id: 2,
            title: `${keyword} ร้านคาเฟ่ & เบเกอรี่`,
            description: "This is the second project",
            smallSize:
              "https://firebasestorage.googleapis.com/v0/b/worktrust-b9c02.appspot.com/o/siamrooftech%2FIMG_6443.webp?alt=media&token=22512427-30d6-4b2d-b000-769309b49ea7",
            originalSize:
              "https://firebasestorage.googleapis.com/v0/b/worktrust-b9c02.appspot.com/o/siamrooftech%2FIMG_6443.webp?alt=media&token=22512427-30d6-4b2d-b000-769309b49ea7",
          },
          {
            id: 3,
            title: "กันสาดสำเร็จรูปพับเก็บได้ ร้านคาเฟ่ & เบเกอรี่",
            description: "ร้านคาเฟ่ & เบเกอรี่",
            smallSize:
              "https://firebasestorage.googleapis.com/v0/b/worktrust-b9c02.appspot.com/o/siamrooftech%2FIMG_6444.webp?alt=media&token=1470da41-d851-4e2e-a93f-db34194b3f93",
            originalSize:
              "https://firebasestorage.googleapis.com/v0/b/worktrust-b9c02.appspot.com/o/siamrooftech%2FIMG_6444.webp?alt=media&token=1470da41-d851-4e2e-a93f-db34194b3f93",
          },
          {
            id: 4,
            title: "กันสาดสำเร็จรูปพับเก็บได้",
            description: "ร้านคาเฟ่ & เบเกอรี่",
            smallSize:
              "https://firebasestorage.googleapis.com/v0/b/worktrust-b9c02.appspot.com/o/siamrooftech%2FIMG_6445.webp?alt=media&token=7812d426-8c8f-4bc8-b569-9876a2ba0c34",
            originalSize:
              "https://firebasestorage.googleapis.com/v0/b/worktrust-b9c02.appspot.com/o/siamrooftech%2FIMG_6445.webp?alt=media&token=7812d426-8c8f-4bc8-b569-9876a2ba0c34",
          },
        ],
      },
      {
        id: 3,
        title: [`${keyword} `, "โรงแรม-รีสอร์ท"],

        description: [
          "สถานที่ : Suvarnabhumi Airport Hotel เขตลาดกระบัง กรุงเทพมหานคร ",
          "ประเภท : กันสาดชนิดมือหมุน",
          "ขนาด :  กว้าง 500 cm * ยื่นออก 250 cm และ กว้าง 300 cm * ยื่นออก 250 cm",
          "วัสดุ : ผ้าใบอะคริลิคสเปน",
        ],
        items: [
          {
            id: 1,
            title: "กันสาดสำเร็จรูปพับเก็บได้ร้านคาเฟ่",
            description: "This is the first project",
            smallSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/61013",
            originalSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/61013",
          },
          {
            id: 2,
            title: "กันสาดสำเร็จรูปพับเก็บได้",
            description: "This is the second project",
            smallSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/74234",
            originalSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/74234",
          },
          {
            id: 3,
            title: "กันสาดสำเร็จรูปพับเก็บได้",
            description: "This is the third project",
            smallSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/10955",
            originalSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/10955",
          },
        ],
      },
      {
        id: 4,
        title: [`${keyword} `, "ร้านเสริมสวย-สปา"],

        description: [
          "สถานที่ :   ร้าน แจ็คคิ้วสวยบอกต่อ อำเภอเมืองนครปฐม จังหวัดนครปฐม  ",
          "ประเภท : กันสาดชนิดมือหมุน",
          "ขนาด :  กว้าง 570 cm * ยื่นออก 250 cm",
          "วัสดุ : ผ้าใบอะคริลิคสเปน",
        ],
        items: [
          {
            id: 1,
            title: "กันสาดสำเร็จรูปพับเก็บได้ร้านคาเฟ่",
            description: "This is the first project",
            smallSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/93381",
            originalSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/93381",
          },
          {
            id: 2,
            title: "กันสาดสำเร็จรูปพับเก็บได้",
            description: "This is the second project",
            smallSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/56084",
            originalSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/56084",
          },
          {
            id: 3,
            title: "กันสาดสำเร็จรูปพับเก็บได้",
            description: "This is the third project",
            smallSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/83821",
            originalSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/83821",
          },
          {
            id: 4,
            title: "กันสาดสำเร็จรูปพับเก็บได้",
            description: "This is the fourth project",
            smallSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/13033",
            originalSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/13033",
          },
        ],
      },
      {
        id: 5,
        title: [`${keyword} `, "บ้านเดี่ยว-ทาวน์โฮม"],

        description: [
          "สถานที่ :  เขต.ประเวศ กรุงเทพมหานคร  ",
          "ประเภท : กันสาดชนิดมือหมุน",
          "ขนาด : กว้าง 300cm * ยื่นออก 200cm",
          "วัสดุ : ผ้าใบอะคริลิคสเปน",
        ],
        items: [
          {
            id: 1,
            title: "กันสาดสำเร็จรูปพับเก็บได้ร้านคาเฟ่",
            description: "This is the first project",
            smallSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/44373",
            originalSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/44373",
          },
          {
            id: 2,
            title: "กันสาดสำเร็จรูปพับเก็บได้",
            description: "This is the second project",
            smallSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/43948",
            originalSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/43948",
          },
          {
            id: 3,
            title: "กันสาดสำเร็จรูปพับเก็บได้",
            description: "This is the third project",
            smallSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/54182",
            originalSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/54182",
          },
        ],
      },
      {
        id: 5,
        title: [`${keyword} `, "บ้านเดี่ยว-ทาวน์โฮม"],

        description: [
          "สถานที่ :  หมู่บ้านสราญสิริ ศรีวารี",
          "ประเภท : กันสาดชนิดมอเตอร์รีโมท โครงแขนพับอลูมิเนียมแข็งชุบสีขาว",
          "ขนาด : กว้าง 260 cm * ยื่นออก 200 cm ",
          "วัสดุ : ผ้าอะคริลิคสเปนสีเบอร์ C11 ชายผ้าตัดเรียบตรง",
        ],
        items: [
          {
            id: 1,
            title: "กันสาดสำเร็จรูปพับเก็บได้บ้านเดี่ยว-ทาวน์โฮม",
            description: "กันสาดสำเร็จรูปพับเก็บได้บ้านเดี่ยว-ทาวน์โฮม",
            smallSize:
              "https://firebasestorage.googleapis.com/v0/b/worktrust-b9c02.appspot.com/o/siamrooftech%2FIMG_6307%202.webp?alt=media&token=8c386664-b8bf-4c7d-8913-2fe420b54f28",
            originalSize:
              "https://firebasestorage.googleapis.com/v0/b/worktrust-b9c02.appspot.com/o/siamrooftech%2FIMG_6307%202.webp?alt=media&token=8c386664-b8bf-4c7d-8913-2fe420b54f28",
          },
          {
            id: 2,
            title: "กันสาดสำเร็จรูปพับเก็บได้",
            description: "กันสาดสำเร็จรูปพับเก็บได้บ้านเดี่ยว-ทาวน์โฮม",
            smallSize:
              "https://firebasestorage.googleapis.com/v0/b/worktrust-b9c02.appspot.com/o/siamrooftech%2FIMG_6306%202.webp?alt=media&token=bd1f2f7d-7f46-4b34-992f-55d1b26a88d6",
            originalSize:
              "https://firebasestorage.googleapis.com/v0/b/worktrust-b9c02.appspot.com/o/siamrooftech%2FIMG_6306%202.webp?alt=media&token=bd1f2f7d-7f46-4b34-992f-55d1b26a88d6",
          },
          {
            id: 3,
            title: "กันสาดสำเร็จรูปพับเก็บได้",
            description: "กันสาดสำเร็จรูปพับเก็บได้บ้านเดี่ยว-ทาวน์โฮม",
            smallSize:
              "https://firebasestorage.googleapis.com/v0/b/worktrust-b9c02.appspot.com/o/siamrooftech%2FIMG_6438.webp?alt=media&token=99953c85-e33a-49ff-8b47-0436460c660a",
            originalSize:
              "https://firebasestorage.googleapis.com/v0/b/worktrust-b9c02.appspot.com/o/siamrooftech%2FIMG_6438.webp?alt=media&token=99953c85-e33a-49ff-8b47-0436460c660a",
          },
          {
            id: 4,
            title: "กันสาดสำเร็จรูปพับเก็บได้",
            description: "กันสาดสำเร็จรูปพับเก็บได้บ้านเดี่ยว-ทาวน์โฮม",
            smallSize:
              "https://firebasestorage.googleapis.com/v0/b/worktrust-b9c02.appspot.com/o/siamrooftech%2FIMG_6436.webp?alt=media&token=9ea16e06-7422-4bc0-aac6-4b9e736925cb",
            originalSize:
              "https://firebasestorage.googleapis.com/v0/b/worktrust-b9c02.appspot.com/o/siamrooftech%2FIMG_6436.webp?alt=media&token=9ea16e06-7422-4bc0-aac6-4b9e736925cb",
          },
        ],
      },
      {
        id: 6,
        title: [`${keyword} `, "คีออส-แฟรนไชส์"],

        description: [
          "สถานที่ : ร้าน Black Duck กรุงเทพมหานคร",
          "ประเภท : กันสาดชนิดมือหมุน",
          "ขนาด :  กว้าง 200 cm * ยื่นออก 150 cm",
          "วัสดุ : ผ้าใบอะคริลิคสเปนสีดำ",
        ],
        items: [
          {
            id: 1,
            title: "กันสาดสำเร็จรูปพับเก็บได้ร้านคาเฟ่",
            description: "This is the first project",
            smallSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/41791",
            originalSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/41791",
          },
          {
            id: 2,
            title: "กันสาดสำเร็จรูปพับเก็บได้",
            description: "This is the second project",
            smallSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/25336",
            originalSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/25336",
          },
          {
            id: 3,
            title: "กันสาดสำเร็จรูปพับเก็บได้",
            description: "This is the third project",
            smallSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/71837",
            originalSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/71837",
          },
          {
            id: 4,
            title: "กันสาดสำเร็จรูปพับเก็บได้",
            description: "This is the third project",
            smallSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/92517",
            originalSize:
              "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/92517",
          },
        ],
      },
      {
        id: 6,
        title: [`${keyword} `, "วิหาร-สำนักสงฆ์"],

        description: [
          "สถานที่ : วัดท่าพระ",
          "ประเภท : กันสาดชนิดมอเตอร์รีโมท โครงแขนพับอลูมิเนียมแข็งชุบสีขาว",
          "ขนาด :  กว้าง 470 cm * ยื่นออก 250 cm (3 แขนพับ)",
          "วัสดุ : ผ้าอะคริลิคสเปนสีเบอร์ C04 ชายผ้าตัดเรียบตรง",
        ],
        items: [
          {
            id: 1,
            title: "กันสาดสำเร็จรูปพับเก็บได้วัด-สำนักสงฆ์",
            description: "กันสาดสำเร็จรูปพับเก็บได้ วัด-สำนักสงฆ์",
            smallSize:
              "https://firebasestorage.googleapis.com/v0/b/worktrust-b9c02.appspot.com/o/siamrooftech%2FIMG_6310%202.webp?alt=media&token=8a4b8311-1f3d-431b-b340-acccb7b79d73",
            originalSize:
              "https://firebasestorage.googleapis.com/v0/b/worktrust-b9c02.appspot.com/o/siamrooftech%2FIMG_6310%202.webp?alt=media&token=8a4b8311-1f3d-431b-b340-acccb7b79d73",
          },
          {
            id: 2,
            title: "กันสาดสำเร็จรูปพับเก็บได้ วัด-สำนักสงฆ์",
            description: "กันสาดสำเร็จรูปพับเก็บได้ วัด-สำนักสงฆ์",
            smallSize:
              "https://firebasestorage.googleapis.com/v0/b/worktrust-b9c02.appspot.com/o/siamrooftech%2FIMG_6430.webp?alt=media&token=6b7ff03c-1e11-4d84-a08b-eb14bc287288",
            originalSize:
              "https://firebasestorage.googleapis.com/v0/b/worktrust-b9c02.appspot.com/o/siamrooftech%2FIMG_6430.webp?alt=media&token=6b7ff03c-1e11-4d84-a08b-eb14bc287288",
          },
          {
            id: 3,
            title: "กันสาดสำเร็จรูปพับเก็บได้ วัด-สำนักสงฆ์",
            description: "กันสาดสำเร็จรูปพับเก็บได้ วัด-สำนักสงฆ์",
            smallSize:
              "https://firebasestorage.googleapis.com/v0/b/worktrust-b9c02.appspot.com/o/siamrooftech%2FIMG_6433.webp?alt=media&token=b00ec346-ac4d-4ec3-982a-0cccf320ca32",
            originalSize:
              "https://firebasestorage.googleapis.com/v0/b/worktrust-b9c02.appspot.com/o/siamrooftech%2FIMG_6433.webp?alt=media&token=b00ec346-ac4d-4ec3-982a-0cccf320ca32",
          },
          {
            id: 4,
            title: "กันสาดสำเร็จรูปพับเก็บได้ วัด-สำนักสงฆ์",
            description: "กันสาดสำเร็จรูปพับเก็บได้ วัด-สำนักสงฆ์",
            smallSize:
              "https://firebasestorage.googleapis.com/v0/b/worktrust-b9c02.appspot.com/o/siamrooftech%2FIMG_6434.webp?alt=media&token=c9743ee0-d8a0-484f-bd1b-ed1e56b85b3b",
            originalSize:
              "https://firebasestorage.googleapis.com/v0/b/worktrust-b9c02.appspot.com/o/siamrooftech%2FIMG_6434.webp?alt=media&token=c9743ee0-d8a0-484f-bd1b-ed1e56b85b3b",
          },
        ],
      },
    ],
    [keyword]
  );
  const handleOpen = useCallback(
    (projectId: any) => {
      const selectedProject = projects.find(
        (proj) => proj.id === projectId
      ) as any;
      if (selectedProject) {
        setCataloqImages(
          selectedProject.items.map((item: any) => item.originalSize)
        );
        setOpen(true);
      }
    },
    [projects]
  );

  const handleClose = () => setOpen(false);

  return (
    <>
      <div className="bg-white ">
        <HeroSection keyword={keyword} />
        <TrustedBy />
        <ProductType keyword={keyword} />
        <WhyUs keyword={keyword} />
      </div>
      <div className="flex items-center justify-center">
        <a
          href="https://lin.ee/pPz1ZqN"
          target="_blank"
          className="inline-block"
        >
          <button
            className="btn btn-link w-1000 mx-auto" // Use DaisyUI button class
            onClick={() => {
              window.dataLayer = window.dataLayer || ([] as any);
              window.dataLayer.push({
                event: "button_click",
                event_category: "Button",
                event_action: "Click",
                event_label: "สอบถามราคา",
              });
            }}
          >
            <Image
              alt="Add Line ขอใบเสนอราคา"
              src="/images/Add Line.png"
              width={1200}
              height={200}
              className="rounded-2xl" // Rounded corners for the image
            />
          </button>
        </a>
      </div>

      <div className="bg-[#fafafaff] pt-5 ">
        {projects.map((project) => (
          <ProjectShow
            key={project.id}
            projectShows={project.items}
            cataloqImages={project.items.map((item: any) => item.image)}
            handleOpen={() => handleOpen(project.id)}
            title={project.title}
            description={project.description}
          />
        ))}
      </div>
      <ImageGalleryModal
        open={open}
        handleClose={handleClose}
        cataloqImages={cataloqImages}
      />
      <Whyus2 keyword={keyword} />
      <Stack
        direction={"column"}
        justifyContent={"center"}
        alignItems={"center"} // This will center the children horizontally
        gap={2}
        sx={{ width: "100%" }} // Make sure the Stack takes full width
      >
        <a
          href="https://lin.ee/pPz1ZqN"
          target="_blank"
          className="inline-block"
        >
          <button
            className="btn btn-link w-1000 mx-auto" // Use DaisyUI button class
            onClick={() => {
              window.dataLayer = window.dataLayer || ([] as any);
              window.dataLayer.push({
                event: "button_click",
                event_category: "Button",
                event_action: "Click",
                event_label: "สอบถามราคา",
              });
            }}
          >
            <Image
              alt="Add Line ขอใบเสนอราคา"
              src={
                "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/IMG_5328.JPG"
              }
              width={600}
              height={600}
              className="rounded-md" // Rounded corners for the image
            />
          </button>
        </a>

        <HowItWorks keyword={keyword} />

        <div className="flex items-center justify-center">
          <a
            href="https://lin.ee/pPz1ZqN"
            target="_blank"
            className="inline-block"
          >
            <button
              className="btn btn-link w-1000 mx-auto" // Use DaisyUI button class
              onClick={() => {
                window.dataLayer = window.dataLayer || ([] as any);
                window.dataLayer.push({
                  event: "button_click",
                  event_category: "Button",
                  event_action: "Click",
                  event_label: "สอบถามราคา",
                });
              }}
            >
              <Image
                alt="Add Line ขอใบเสนอราคา"
                src="/images/Add Line.png"
                width={1200}
                height={200}
                className="rounded-2xl" // Rounded corners for the image
              />
            </button>
          </a>
        </div>
      </Stack>
      <div className="flex md:hidden fixed bottom-0 bg-white w-full z-50 pb-3 justify-between px-1 py-2">
        <div className=" w-full ">
          <a
            href="https://lin.ee/pPz1ZqN"
            target="_blank"
            onClick={() => {
              window.dataLayer = window.dataLayer || [];
              window.dataLayer.push({
                event: "button_click",
                event_category: "Button",
                event_action: "Click",
                event_label: "สอบถามราคา",
              });
            }}
          >
            <button className="btn flex items-center w-full py-auto h-[50px] bg-[#01b202]">
              <Image
                alt="line icon"
                src="/images/lineedit.png"
                width={25}
                height={25}
              />
              <p className="font_page text-[16px] ml-2 text-white font-semibold">
                คลิกไลน์ ประเมินราคาฟรี
              </p>
            </button>
          </a>
        </div>
      </div>

      {/* Non-Mobile Button */}
      <a
        href="https://lin.ee/pPz1ZqN"
        target="_blank"
        onClick={() => {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            event: "button_click",
            event_category: "Button",
            event_action: "Click",
            event_label: "สอบถามราคา",
          });
        }}
      >
        <button className="hidden lg:flex  fixed bottom-5 right-5 items-center space-x-2 px-4 py-2 bg-[#01b202] rounded hover:bg-[#01bd00ff] active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none right-10 z-40">
          <Image
            alt="line icon"
            src="/images/line.png"
            width={50}
            height={50}
          />
          <span className="text-white font_page text-[18px] font-bold">
          คลิกไลน์ ประเมินราคาฟรี
          </span>
        </button>
      </a>
      <div className="bg-gradient-to-br pt-20 mx-auto  from-gray-100 to-gray-200">
        <h1 className="text-md text-gray-500 mt-4 text-center font_page sm:text-2xl md:text-2xl font-bold leading-snug">
          สยามรูฟเทค {keyword} ที่ลูกค้าไว้วางใจ
        </h1>
        {/* <div className="flex items-center justify-center">
            <a
              href="https://lin.ee/pPz1ZqN"
              target="_blank"
              onClick={() => {
                window.dataLayer = window.dataLayer || [] as any
                window.dataLayer.push({
                  event: 'button_click',
                  event_category: 'Button',
                  event_action: 'Click',
                  event_label: 'สอบถามราคา',
                });
              }}
            >
              <button
                className="transition-all mx-auto duration-200 font_page rounded-full py-5 px-20 font-bold text-center bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                style={{
                  '--sky': '#4e73d1' ,
                  '--roofr-blue': '#269bd6',
                  '--white': 'white',
                  backgroundImage:
                    'linear-gradient(225deg, var(--sky), var(--roofr-blue))',
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  lineHeight: '1.5',
                  maxWidth: '100%',
                  textDecoration: 'none',
                  borderRadius: '6rem',
                } as any} 
              >
                รับใบเสนอราคาฟรี
              </button>
            </a>
          </div> */}
        <EndSection />
        <Footer />
      </div>
    </>
  );
};

export default Main;
