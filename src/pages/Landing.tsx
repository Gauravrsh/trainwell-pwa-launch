import LandingNav from '@/components/landing/LandingNav';
import HeroSection from '@/components/landing/HeroSection';
import HowItWorks from '@/components/landing/HowItWorks';
import HouseRules from '@/components/landing/HouseRules';
import ComparisonTable from '@/components/landing/ComparisonTable';
import PricingSection from '@/components/landing/PricingSection';
import CTASection from '@/components/landing/CTASection';
import LandingFooter from '@/components/landing/LandingFooter';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />
      <HeroSection />
      <div id="how-it-works">
        <HowItWorks />
      </div>
      <HouseRules />
      <ComparisonTable />
      <PricingSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
