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
      <div className="flex items-center justify-center">
        <LineButton
          className="btn btn-link w-1000 mx-auto"
          imageSrc="/images/Add Line.png"
          imageAlt="Add Line ขอใบเสนอราคา"
          width={1200}
          height={200}
          imageClassName="rounded-2xl"
          trackingType="hero"
        />
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
      <div className="flex md:hidden fixed bottom-0 bg-white w-full z-50 pb-3 justify-between px-1 py-2">
        <div className=" w-full ">
          <LineButton
            className="btn flex items-center w-full py-auto h-[50px] bg-[#01b202]"
            imageSrc="/images/lineedit.png"
            imageAlt="line icon"
            width={25}
            height={25}
            trackingType="mobile"
          >
            <p className="font_page text-[16px] ml-2 text-white font-semibold">
              คลิกไลน์ ประเมินราคาฟรี
            </p>
          </LineButton>
        </div>
      </div>

      {/* Non-Mobile Button */}
      <LineButton
        className="hidden lg:flex  fixed bottom-5 right-5 items-center space-x-2 px-4 py-2 bg-[#01b202] rounded hover:bg-[#01bd00ff] active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none right-10 z-40"
        imageSrc="/images/line.png"
        imageAlt="line icon"
        width={50}
        height={50}
        trackingType="desktop"
      >
        <span className="text-white font_page text-[18px] font-bold">
          คลิกไลน์ ประเมินราคาฟรี
        </span>
      </LineButton>
      <div className="bg-gradient-to-br pt-20 mx-auto  from-gray-100 to-gray-200">

       
        <FinalCTASection />
        <EndSection />
        <Footer />
      </div>
    </>
  );
};

export default Main;
