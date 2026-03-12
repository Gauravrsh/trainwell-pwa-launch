import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CalendarMockup from './CalendarMockup';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: 'easeOut' },
  }),
};

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pt-20 pb-16 sm:pt-28 sm:pb-24">
      {/* Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-primary/8 blur-[140px]" />

      <div className="relative mx-auto max-w-5xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Copy */}
          <div>
            <motion.h1
              className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl leading-[1.1]"
              initial="hidden" animate="visible" variants={fadeUp} custom={0}
            >
              Stop Losing Clients to{' '}
              <span className="text-gradient">'Chalta&nbsp;Hai'</span>{' '}
              Behavior.
            </motion.h1>

            <motion.p
              className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg leading-relaxed"
              initial="hidden" animate="visible" variants={fadeUp} custom={1}
            >
              Your income depends on client results. Their results depend on consistency.
              TrainWell is the first platform that <strong className="text-foreground">enforces daily discipline</strong> — no backdating, no excuses, just results.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-col gap-3 sm:flex-row"
              initial="hidden" animate="visible" variants={fadeUp} custom={2}
            >
              <Button asChild size="lg" className="gap-2 text-base font-bold">
                <Link to="/auth">
                  Start 14-Day Discipline Trial <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base">
                <Link to="/auth">Sign In</Link>
              </Button>
            </motion.div>

            <motion.p
              className="mt-4 text-xs text-muted-foreground"
              initial="hidden" animate="visible" variants={fadeUp} custom={3}
            >
              No credit card · 3 clients included · Results or nothing.
            </motion.p>
          </div>

          {/* Calendar Mockup */}
          <div className="flex justify-center lg:justify-end">
            <CalendarMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
