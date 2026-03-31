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
          <div className="text-center lg:text-left">
            <motion.p
              className="text-xs font-semibold uppercase tracking-widest text-primary mb-4"
              initial="hidden" animate="visible" variants={fadeUp} custom={0}
            >
              FOR TRAINERS WHO DELIVER RESULTS
            </motion.p>

            <motion.h1
              className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl leading-[1.1]"
              initial="hidden" animate="visible" variants={fadeUp} custom={0.5}
            >
              Whatever Gets Tracked,{' '}
              <span className="text-gradient">Gets Done.</span>
            </motion.h1>

            <motion.p
              className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg leading-relaxed"
              initial="hidden" animate="visible" variants={fadeUp} custom={1}
            >
              Your clients pay you for results. Results come from consistency. Yes, just consistency! And you know it. TrainWell tracks every workout and every meal — <strong className="text-foreground">today, not tomorrow</strong>.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-col gap-3 sm:flex-row"
              initial="hidden" animate="visible" variants={fadeUp} custom={1.5}
            >
              <Button asChild size="lg" className="gap-2 text-base font-bold">
                <Link to="/auth">
                  Start Free 14-Day Trial <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>

            <motion.p
              className="mt-4 text-xs text-muted-foreground"
              initial="hidden" animate="visible" variants={fadeUp} custom={2}
            >
              No credit card · Upto 3 clients free · No question asked cancellation
            </motion.p>

            <motion.div
              className="mt-5 mx-auto inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary"
              initial="hidden" animate="visible" variants={fadeUp} custom={2.5}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Used by personal trainers across India
            </motion.div>
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
