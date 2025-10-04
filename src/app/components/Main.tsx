import HeroSection from "./section/HeroSection";
import ProductType from "./section/ProductType";
import TrustedBy from "./section/TrustedBy";
import WhyUs from "./section/WhyUs";
import HowItWorks from "./section/HowItWorks";
import EndSection from "./section/EndSection";
import FinalCTASection from "./FinalCTASection";
import Footer from "./ui/Footer";
import Whyus2 from "./section/WhyUs2";
import { Stack } from "@mui/material";
import { Project } from "@/lib/firestore";
import { transformFirestoreProjectsToProjectShow } from "@/lib/project-utils";
import ProjectGalleryClient from "./ProjectGalleryClient";
import LineButton from "./LineButton";
import LineButtonMobile from "./LineButtonMobile";
import LineButtonDesktop from "./LineButtonDesktop";
import PortfolioButton from "./PortfolioButton";

type Props = {
  keyword: string;
  projects: Project[];
};
const Main = (props: Props) => {
  const { keyword, projects: firestoreProjects } = props;

  // แปลงข้อมูลจาก Firestore เป็น format ที่ ProjectShow ใช้ (แสดง 25 รายการ)
  const { projectShowData: projects, hasMore } = transformFirestoreProjectsToProjectShow(
    firestoreProjects,
    keyword,
    25
  );


  return (
    <>
      <div className="bg-white ">
        <HeroSection keyword={keyword} />
        <TrustedBy />
        <ProductType keyword={keyword} />
        <WhyUs keyword={keyword} />
      </div>
      {/* Hero CTA - Full Width Line Button */}
      <div className="w-full px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <LineButton
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full h-auto sm:h-20 py-4 sm:py-0 bg-[#06C755] hover:bg-[#05B34A] active:bg-[#04A041] rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.98]"
            imageSrc="/images/line.png"
            imageAlt="Line Official"
            width={40}
            height={40}
            imageClassName="drop-shadow-md"
            trackingType="hero"
          >
            <span className="text-white text-xl sm:text-2xl font-bold tracking-wide text-center">
              คลิกไลน์ ประเมินราคาฟรี
            </span>
          </LineButton>
        </div>
      </div>

      <div className="bg-[#fafafaff] pt-5 ">
        <ProjectGalleryClient projects={projects} />

        {/* ปุ่มดูผลงานทั้งหมด หากมีผลงานเกิน 25 รายการ */}
        {hasMore && (
          <div className="flex justify-center py-8">
            <PortfolioButton className="btn btn-primary px-8 py-3 text-lg font-semibold hover:shadow-lg transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white border-none rounded-lg">
              <span>ดูผลงานทั้งหมด →</span>
            </PortfolioButton>
          </div>
        )}
      </div>
      <Whyus2 keyword={keyword} />
      <Stack
        direction={"column"}
        justifyContent={"center"}
        alignItems={"center"} // This will center the children horizontally
        gap={2}
        sx={{ width: "100%" }} // Make sure the Stack takes full width
      >
        <LineButton
          className="btn btn-link w-1000 mx-auto"
          imageSrc="https://siamroof.workstandard.co/siamrooftech/4700950199970095519.jpeg"
          imageAlt="Add Line ขอใบเสนอราคา"
          width={600}
          height={600}
          imageClassName="rounded-md"
          trackingType="middle"
        />

        <HowItWorks keyword={keyword} />

        <div className="flex items-center justify-center">
          <LineButton
            className="btn btn-link w-1000 mx-auto"
            imageSrc="/images/Add Line.png"
            imageAlt="Add Line ขอใบเสนอราคา"
            width={1200}
            height={200}
            imageClassName="rounded-2xl"
            trackingType="bottom"
          />
        </div>
      </Stack>

      {/* Mobile Sticky Line Button */}
      <LineButtonMobile />

      {/* Desktop Floating Line Button */}
      <LineButtonDesktop />
      <div className="bg-gradient-to-br pt-20 mx-auto  from-gray-100 to-gray-200">


        <FinalCTASection />
        <EndSection />
        <Footer />
      </div>
    </>
  );
};

export default Main;
