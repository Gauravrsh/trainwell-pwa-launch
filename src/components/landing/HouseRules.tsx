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
    title: "No Back date entries",
    desc: "You log the workout/meal for today or plan for the future. Client marks it done today — not tomorrow, not \"next week.\" Past dates are locked. If it wasn't logged, it's a miss. This one habit forming rule alone changes everything. For both you and your client!",
  },
  {
    icon: Calendar,
    title: 'Its either Green or Red — There\'s No Grey',
    desc: "Every day on the calendar is either Green (done) or Red (missed). No \"pending from last tuesday.\" When 20 out of 30 days are Green, client feels it. When 15 are Red, there's nothing left to discuss..",
  },
  {
    icon: Camera,
    title: 'Snap the Meal, Done.',
    desc: "\"It's too much effort to log food\" — that excuse is gone. Client clicks a photo of their plate, AI breaks it down into calories and macros. Takes 10 seconds. Now there's no friction left. Only the result.",
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
          className="mx-auto mt-3 max-w-lg text-center text-base text-muted-foreground"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp} custom={0.5}
        >
          These aren't features. These are non-negotiables. You and your client both agree to play by these rules.
          That's what makes it work.
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
                  <p className="text-base text-muted-foreground leading-relaxed">{r.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
