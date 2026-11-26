import HeroSection from "./section/HeroSection";
import TrustedBy from "./section/TrustedBy";
import WhyUs from "./section/WhyUs";
import HowItWorks from "./section/HowItWorks";
import EndSection from "./section/EndSection";
import FinalCTASection from '@/components/site/FinalCTASection';
import Whyus2 from "./section/WhyUs2";
import DamageWarningSection from "./section/DamageWarningSection";
import type { Project } from '@/features/projects/types';
import ProjectShowcase from "./projects/ProjectShowcase";
import LineContactButton from "@/features/line-contact/LineContactButton";
import PortfolioButton from "./PortfolioButton";
import { PublicContainer } from "@/components/ui/public";

type Props = {
  keyword: string;
  projects: Project[];
};
const Main = (props: Props) => {
  const { keyword, projects } = props;

  // The latest projects, one per row; the rest are on /projects.
  const HOME_PROJECTS = 6;
  const shownProjects = projects.slice(0, HOME_PROJECTS);
  const hasMore = projects.length > HOME_PROJECTS;

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
        <PublicContainer>
          <ProjectShowcase projects={shownProjects} />
        </PublicContainer>

        {hasMore && (
          <div className="flex justify-center pt-8">
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
