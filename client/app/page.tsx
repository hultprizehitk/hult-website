import CherryHeroSection from "@/components/sections/CherryHeroSection";
import AboutSection from "@/components/sections/AboutSection";
import EventsHighlightSection from "@/components/sections/EventsHighlightSection";
import CtaBannerSection from "@/components/sections/CtaBannerSection";
import SiteFooter from "@/components/sections/SiteFooter";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#fdeef1] font-sans text-[#2b1a1a]">
      <CherryHeroSection />
      <AboutSection />
      <EventsHighlightSection />
      <CtaBannerSection />
      <SiteFooter />
    </div>
  );
}
