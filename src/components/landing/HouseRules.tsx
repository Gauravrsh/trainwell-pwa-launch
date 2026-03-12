import { motion } from 'framer-motion';
import { Lock, Calendar, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: 'easeOut' },
  }),
};

const rules = [
  {
    icon: Lock,
    title: "The 'Today Only' Rule",
    desc: "Trainers plan today and future. Clients log today. Past dates are locked. We don't do 'I'll log it tomorrow.'",
  },
  {
    icon: Calendar,
    title: 'Color-Coded Accountability',
    desc: "A visual calendar where Green is progress and Red is a warning. No room for ambiguity.",
  },
  {
    icon: Camera,
    title: 'One-Click Compliance',
    desc: "AI Food Analysis so 'it was too hard to log' is never an excuse again. Snap, submit, done.",
  },
];

export default function HouseRules() {
  return (
    <section className="px-4 py-16 sm:py-24 bg-secondary/20">
      <div className="mx-auto max-w-4xl">
        <motion.h2
          className="text-center text-2xl font-extrabold sm:text-3xl"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp} custom={0}
        >
          House Rules, Not <span className="text-gradient">Features</span>
        </motion.h2>
        <motion.p
          className="mx-auto mt-3 max-w-md text-center text-sm text-muted-foreground"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp} custom={0.5}
        >
          TrainWell doesn't politely suggest. It enforces.
        </motion.p>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {rules.map((r, i) => (
            <motion.div
              key={r.title}
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
              variants={fadeUp} custom={i + 1}
            >
              <Card className="h-full border-border bg-card">
                <CardHeader className="pb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                    <r.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{r.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
