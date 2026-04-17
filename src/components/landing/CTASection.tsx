import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const CTASection = forwardRef<HTMLElement>((_, ref) => {
  return (
    <section ref={ref} className="px-4 py-16 sm:py-24 text-center">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-extrabold sm:text-3xl">
          The Flywheel That Builds{' '}
          <span className="text-gradient">Your Reputation</span>
          <span className="text-foreground">, and </span>
          <span className="text-gradient">Your Career</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
          Client tracks consistently → Results come →
          Client stays longer → Refers friends →&nbsp; &nbsp; &nbsp; &nbsp;
          Your reputation grows →&nbsp;More Clients&nbsp;→ Repeat
        </p>
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
