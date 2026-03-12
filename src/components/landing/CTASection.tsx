import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CTASection() {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-3xl rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center sm:p-12">
        <h2 className="text-2xl font-extrabold sm:text-3xl">
          Client Wins → Retention → Referrals → <span className="text-gradient">Your Wealth</span>
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
          Stop tolerating "Chalta Hai." Start building a coaching business where every client gets results,
          stays longer, and sends you their friends. The tool costs less than one client's monthly fee.
        </p>
        <Button asChild size="lg" className="mt-6 gap-2 text-base font-bold">
          <Link to="/auth">
            Start 14-Day Discipline Trial <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
