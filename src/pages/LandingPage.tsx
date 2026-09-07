import { DuotoneRail } from '@/components/landing/DuotoneRail';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroSection } from '@/components/landing/HeroSection';
import { ResultFigure } from '@/components/landing/ResultFigure';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { PrivacySection } from '@/components/landing/PrivacySection';
import { OpenSourceSection } from '@/components/landing/OpenSourceSection';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { SchoolGardenBackdrop } from '@/components/landing/SchoolGardenBackdrop';

export default function LandingPage() {
  return (
    <div className="landing-page min-h-screen bg-paper text-foreground">
      <LandingHeader />
      <main>
        <DuotoneRail>
          <div className="landing-intro">
            <SchoolGardenBackdrop />
            <HeroSection />
            <ResultFigure />
          </div>
          <HowItWorksSection />
          <PrivacySection />
          <FeaturesSection />
          <OpenSourceSection />
        </DuotoneRail>
      </main>
      <LandingFooter />
    </div>
  );
}
