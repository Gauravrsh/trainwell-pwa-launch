import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CTASection() {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-3xl rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center sm:p-12">
        <h2 className="text-2xl font-extrabold sm:text-3xl">
          Stop Chasing Clients.{' '}
          <span className="text-gradient">Start Keeping Them.</span>
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-base text-muted-foreground">
          The tool costs less than one client's monthly fee. But it can be the reason that client stays for a year,
          refers two friends, and builds your reputation in ways no Instagram reel ever will.
        </p>
        <Button asChild size="lg" className="mt-6 gap-2 text-base font-bold">
          <Link to="/auth">
            Start Free 14-Day Trial <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          3 clients included · All features · No credit card
        </p>
      </div>
    </section>
  );
}
