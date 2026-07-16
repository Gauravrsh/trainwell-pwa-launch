import LandingNav from '@/components/landing/LandingNav';
import HeroSection from '@/components/landing/HeroSection';
import HowItWorks from '@/components/landing/HowItWorks';
import HouseRules from '@/components/landing/HouseRules';
import ComparisonTable from '@/components/landing/ComparisonTable';
import PricingSection from '@/components/landing/PricingSection';
import CTASection from '@/components/landing/CTASection';
import LandingFooter from '@/components/landing/LandingFooter';
import Seo from '@/components/Seo';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title="Vecto — Accountability engine for fitness trainers"
        description="Vecto is the accountability OS for independent fitness trainers. Binary tracking of workouts, meals and steps so clients get results and stay longer."
        path="/"
      />
      <LandingNav />
      <main>
        <HeroSection />
        <div id="how-it-works">
          <HowItWorks />
        </div>
        <HouseRules />
        <ComparisonTable />
        <PricingSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
