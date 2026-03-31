import { motion } from 'framer-motion';
import { Lock, Calendar, FileText } from 'lucide-react';
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
    title: 'No Backdating. Period.',
    desc: "Past dates are locked. Log today or it's a miss. This one rule alone changes everything. And the rule is same for both trainer and client.",
  },
  {
    icon: Calendar,
    title: 'Green or Red — No Grey Area',
    desc: 'Every day is done or missed. You and your client both see the month at a glance. Nothing to argue about.',
  },
  {
    icon: FileText,
    title: 'The secret - Log everyday',
    desc: 'When you log everyday, you set in motion a flywheel of results. With every log you increase the odds of client success.',
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
          Rules of the <span className="text-gradient">House</span>
        </motion.h2>
        <motion.p
          className="mx-auto mt-3 max-w-lg text-center text-muted-foreground text-base sm:text-lg"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp} custom={0.5}
        >
          These are non-negotiables that make the system work.
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
