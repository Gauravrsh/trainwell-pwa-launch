import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import flywheel from '@/assets/flywheel-mockups/option1-final-v8.png';

const CTASection = forwardRef<HTMLElement>((_, ref) => {
  return (
    <section ref={ref} className="px-4 py-16 sm:py-24 text-center">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-extrabold sm:text-3xl">
          The Flywheel That Builds{' '}
          <span className="text-gradient">Your Reputation,</span>{' '}
          <span className="text-foreground">and</span>{' '}
          <span className="text-gradient">Your Career</span>
        </h2>
        <div className="mx-auto mt-8 w-full max-w-[560px]">
          <img
            src={flywheel}
            alt="Vecto Flywheel of Growth: client tracks, results come, client stays, gives testimonials, refers friends, reputation grows, more clients, repeat"
            className="block w-full h-auto"
            loading="lazy"
          />
        </div>
        <Button asChild size="lg" className="mt-8 text-base font-bold">
          <Link to="/auth">Start Free</Link>
        </Button>
        <p className="mt-4 text-xs text-muted-foreground">
          No credit card · 3 clients free · Cancel anytime
        </p>
      </div>
    </section>
  );
});

CTASection.displayName = 'CTASection';

export default CTASection;
