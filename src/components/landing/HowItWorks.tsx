import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: 'easeOut' },
  }),
};

const steps = [
  {
    step: 1,
    title: 'You create plan',
    desc: 'Assign workouts and/or diet plan to each client for each day.',
  },
  {
    step: 2,
    title: 'Client Logs Daily',
    desc: 'You log for client and client acknowledges it daily. Workout, meals (AI-powered) and weight. No backdating allowed.',
  },
  {
    step: 3,
    title: 'Both of You See Everything',
    desc: 'Green/Red calendar. Progress charts. Real numbers. Zero guesswork/excuses on adherence.',
  },
];

export default function HowItWorks() {
  return (
    <section className="px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <motion.p
          className="text-center text-xs font-semibold uppercase tracking-widest text-primary mb-3"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp} custom={0}
        >
          How It Works
        </motion.p>
        <motion.h2
          className="text-center text-2xl font-extrabold sm:text-3xl"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp} custom={0.3}
        >
          Three Steps. <span className="text-gradient">Zero Guesswork.</span>
        </motion.h2>
        <motion.p
          className="mx-auto mt-3 max-w-lg text-center text-muted-foreground text-base sm:text-lg"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp} custom={0.5}
        >
          A dead-simple system designed to keep both you and your client honest.
        </motion.p>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
              variants={fadeUp} custom={i + 1}
            >
              <Card className="h-full border-border bg-card text-center">
                <CardHeader className="pb-2">
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 mb-3">
                    <span className="text-sm font-extrabold text-primary">{s.step}</span>
                  </div>
                  <CardTitle className="text-base">{s.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
