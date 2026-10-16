import { DuotoneRail } from '@/components/landing/DuotoneRail';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { FactsSection } from '@/components/landing/FactsSection';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingBackdrop } from '@/components/landing/LandingBackdrop';

export default function LandingPage() {
  return (
    <div className="landing-page min-h-screen bg-paper text-foreground">
      <LandingHeader />
      <DuotoneRail>
        <main>
          <div className="landing-intro">
            <LandingBackdrop />
            <HeroSection />
          </div>
          <HowItWorksSection />
          <FactsSection />
        </main>
        <LandingFooter />
      </DuotoneRail>
    </div>
  );
}
