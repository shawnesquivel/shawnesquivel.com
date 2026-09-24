import About from "@/components/agency/About";
import ApiSection from "@/components/agency/ApiSection";
import Comparison from "@/components/agency/Comparison";
import Faq from "@/components/agency/Faq";
import FinalCta from "@/components/agency/FinalCta";
import Hero from "@/components/agency/Hero";
import HowItWorks from "@/components/agency/HowItWorks";
import LogoMarquee from "@/components/agency/LogoMarquee";
import Services from "@/components/agency/Services";
import WorkPreview from "@/components/agency/WorkPreview";

export default function Home() {
  return (
    <>
      <Hero />
      <LogoMarquee />
      <HowItWorks />
      <Services />
      <ApiSection />
      <Comparison />
      <WorkPreview />
      <About />
      <Faq />
      <FinalCta />
    </>
  );
}
