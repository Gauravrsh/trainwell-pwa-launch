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
            <motion.p
              className="text-xs font-semibold uppercase tracking-widest text-primary mb-4"
              initial="hidden" animate="visible" variants={fadeUp} custom={0}
            >
              The Hard Truth
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
              Your client pays you every month for a new body. Not for your time — for <strong className="text-foreground">results</strong>.
              If results don't come, the client leaves. No referral. No testimonial. Just another client dropout.
            </motion.p>

            <motion.p
              className="mt-3 max-w-lg text-base text-muted-foreground sm:text-lg leading-relaxed"
              initial="hidden" animate="visible" variants={fadeUp} custom={1.5}
            >
              The hard truth? Results come ONLY from consistency. Keto, intermittent fasting, strength training, HIIT, Mobility — no matter which diet type and which workout type you get your client on, if consistency is not there, then failure is just a matter of time.
            </motion.p>

            <motion.p
              className="mt-3 max-w-lg text-base text-muted-foreground sm:text-lg leading-relaxed"
              initial="hidden" animate="visible" variants={fadeUp} custom={1.8}
            >
              Consistency comes from tracking. TrainWell is the tool that makes sure every workout and every meal is logged — <strong className="text-foreground">today, not tomorrow</strong>. No backdating. No "chalta hai."
              Just an honest mirror that shows exactly where your client stands.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-col gap-3 sm:flex-row"
              initial="hidden" animate="visible" variants={fadeUp} custom={2}
            >
              <Button asChild size="lg" className="gap-2 text-base font-bold">
                <Link to="/auth">
                  Start Free 14-Day Trial <ArrowRight className="h-4 w-4" />
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
              No credit card needed · 3 clients included · Cancel anytime.
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
