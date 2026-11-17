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
import { PublicContainer } from "@/components/ui/public";

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
      <HeroSection keyword="กันสาดไฟฟ้า" />

      <div className="border-y border-site-border bg-white py-6">
        <TrustedBy animated />
      </div>

      <section className="bg-white py-12 md:py-16">
        <WhyUs keyword={keyword} />
      </section>

      <section className="bg-site-background py-12 md:py-16">
        <PublicContainer className="mb-8 text-center md:mb-10">
          <h2 className="heading-section text-site-ink">ตัวอย่างงานติดตั้ง{keyword}</h2>
        </PublicContainer>
        <ProjectGalleryClient projects={projectShowData} />

        {/* ปุ่มดูผลงานทั้งหมด หากมีผลงานเกิน 25 รายการ */}
        {hasMore && (
          <div className="flex justify-center pt-4">
            <PortfolioButton
              position="homepage_project_gallery_more"
              className="btn btn-primary px-8 py-3 text-lg font-semibold hover:shadow-lg transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white border-none rounded-[4px]"
            >
              <span>ดูผลงานทั้งหมด →</span>
            </PortfolioButton>
          </div>
        )}
      </section>

      <DamageWarningSection />

      <section className="bg-site-background py-12 md:py-16">
        <Whyus2 keyword={keyword} />
      </section>

      <section className="flex w-full flex-col items-center gap-6 bg-white py-12 md:py-16">
        <HowItWorks keyword={keyword} />
        <div className="flex w-full items-center justify-center px-4">
          <LineContactButton analyticsPosition="bottom" />
        </div>
      </section>

      <FinalCTASection compactLineButton />
      <EndSection />
    </>
  );
};

export default Main;
