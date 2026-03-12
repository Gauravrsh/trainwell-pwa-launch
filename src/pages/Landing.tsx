import LandingNav from '@/components/landing/LandingNav';
import HeroSection from '@/components/landing/HeroSection';
import MirrorSection from '@/components/landing/MirrorSection';
import HouseRules from '@/components/landing/HouseRules';
import ComparisonTable from '@/components/landing/ComparisonTable';
import PricingSection from '@/components/landing/PricingSection';
import ReferralPreview from '@/components/landing/ReferralPreview';
import ManifestoSection from '@/components/landing/ManifestoSection';
import CTASection from '@/components/landing/CTASection';
import LandingFooter from '@/components/landing/LandingFooter';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />
      <HeroSection />
      <MirrorSection />
      <HouseRules />
      <ComparisonTable />
      <PricingSection />
      <ReferralPreview />
      <ManifestoSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
