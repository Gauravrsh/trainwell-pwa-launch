import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const matrix = [
  { yourPlan: 'Monthly', refPlan: 'Monthly', reward: '+30 Days', elite: false },
  { yourPlan: 'Monthly', refPlan: 'Annual', reward: '+60 Days', elite: false },
  { yourPlan: 'Annual', refPlan: 'Monthly', reward: '+30 Days', elite: false },
  { yourPlan: 'Annual', refPlan: 'Annual', reward: '+90 Days', elite: true },
];

export default function ReferralPreview() {
  return (
    <section className="px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-2xl">
        <motion.h2
          className="text-center text-2xl font-extrabold sm:text-3xl"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp}
        >
          Grow Your <span className="text-gradient">Tribe</span>
        </motion.h2>
        <motion.p
          className="mx-auto mt-3 max-w-md text-center text-sm text-muted-foreground"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp}
        >
          Elite Trainers help Elite Trainers. Refer an annual subscriber and earn up to 90 days free. No cap.
        </motion.p>

        <motion.div
          className="mt-10 overflow-hidden rounded-xl border border-border"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp}
        >
          {/* Header */}
          <div className="grid grid-cols-3 bg-secondary/50">
            <div className="p-3 text-xs font-semibold text-muted-foreground text-center">Your Plan</div>
            <div className="p-3 text-xs font-semibold text-muted-foreground text-center">Referee's Plan</div>
            <div className="p-3 text-xs font-semibold text-muted-foreground text-center">Your Reward</div>
          </div>

          {matrix.map((row, i) => (
            <div
              key={i}
              className={`grid grid-cols-3 ${
                row.elite
                  ? 'border-l-2 border-l-primary bg-primary/5'
                  : i % 2 === 0 ? 'bg-card' : 'bg-secondary/20'
              }`}
            >
              <div className="p-3 text-center text-sm text-foreground">{row.yourPlan}</div>
              <div className="p-3 text-center text-sm text-foreground">{row.refPlan}</div>
              <div className="p-3 text-center text-sm font-bold text-primary">
                {row.reward}
                {row.elite && (
                  <span className="block text-[10px] font-medium text-primary/80">⭐ Elite Trainer Reward</span>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
