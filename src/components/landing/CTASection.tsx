import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CTASection = forwardRef<HTMLElement>((_, ref) => {
  return (
    <section ref={ref} className="px-4 py-16 sm:py-24 text-center">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-extrabold sm:text-3xl">
          The Flywheel That Builds{' '}
          <span className="text-gradient">Your Career</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
          Client tracks consistently → Results come →
          Client stays longer → Refers friends →&nbsp; &nbsp; &nbsp; &nbsp;
          Your reputation grows →&nbsp;More Clients&nbsp;→ Repeat
        </p>
        <Button asChild size="lg" className="mt-8 gap-2 text-base font-bold">
          <Link to="/auth">
            Get Started Free <ArrowRight className="h-4 w-4" />
          </Link>
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
