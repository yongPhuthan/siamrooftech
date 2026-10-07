import HeroSection from "./section/HeroSection";
import TrustedBy from "./section/TrustedBy";
import WhyUs from "./section/WhyUs";
import HowItWorks from "./section/HowItWorks";
import EndSection from "./section/EndSection";
import FinalCTASection from '@/components/site/FinalCTASection';
import Whyus2 from "./section/WhyUs2";
import DamageWarningSection from "./section/DamageWarningSection";
import type { Project } from '@/features/projects/types';
import { transformProjectsToProjectShow } from "@/lib/project-utils";
import ProjectGalleryClient from "./ProjectGalleryClient";
import LineContactButton from "@/features/line-contact/LineContactButton";
import PortfolioButton from "./PortfolioButton";

type Props = {
  keyword: string;
  projects: Project[];
};
const Main = (props: Props) => {
  const { keyword, projects } = props;

  // Transform published projects into the homepage gallery format (up to 25 items).
  const { projectShowData, hasMore } = transformProjectsToProjectShow(
    projects,
    keyword,
    25
  );


  return (
    <>
      <div className="bg-white ">
        <HeroSection keyword={keyword} />
        <TrustedBy />
        <WhyUs keyword={keyword} />
      </div>

      <div className="bg-site-background pt-10 mt-10 ">
        <ProjectGalleryClient projects={projectShowData} />

        {/* ปุ่มดูผลงานทั้งหมด หากมีผลงานเกิน 25 รายการ */}
        {hasMore && (
          <div className="flex justify-center py-8">
            <PortfolioButton
              position="homepage_project_gallery_more"
              className="btn btn-primary px-8 py-3 text-lg font-semibold hover:shadow-lg transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white border-none rounded-[4px]"
            >
              <span>ดูผลงานทั้งหมด →</span>
            </PortfolioButton>
          </div>
        )}
      </div>
      <DamageWarningSection />
      <Whyus2 keyword={keyword} />
      <div className="flex flex-col items-center justify-center gap-4 w-full">
        <HowItWorks keyword={keyword} />

        <div className="flex w-full items-center justify-center px-4">
          <LineContactButton analyticsPosition="bottom" />
        </div>
      </div>

      <div className="bg-gradient-to-br pt-20 mx-auto  from-gray-100 to-gray-200">


        <FinalCTASection compactLineButton />
        <EndSection />
      </div>
    </>
  );
};

export default Main;
