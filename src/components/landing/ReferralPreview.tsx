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
          You Know Good Trainers.{' '}
          <span className="text-gradient">Help Them Win Too.</span>
        </motion.h2>
        <motion.p
          className="mx-auto mt-3 max-w-md text-center text-base text-muted-foreground"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp}
        >
          Refer a trainer friend. When they subscribe, you get free days added to your plan.
          Both of you on Annual? That's <strong className="text-foreground">90 days free</strong>. No limit on referrals.
        </motion.p>

        <motion.div
          className="mt-10 overflow-hidden rounded-xl border border-border"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp}
        >
          <div className="grid grid-cols-3 bg-secondary/50">
            <div className="p-3 sm:p-4 text-sm font-semibold text-muted-foreground text-center">Your Plan</div>
            <div className="p-3 sm:p-4 text-sm font-semibold text-muted-foreground text-center">Friend's Plan</div>
            <div className="p-3 sm:p-4 text-sm font-semibold text-muted-foreground text-center">You Get</div>
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
              <div className="p-3 sm:p-4 text-center text-base text-foreground">{row.yourPlan}</div>
              <div className="p-3 sm:p-4 text-center text-base text-foreground">{row.refPlan}</div>
              <div className="p-3 sm:p-4 text-center text-base font-bold text-primary">
                {row.reward}
                {row.elite && (
                  <span className="block text-[10px] font-medium text-primary/80">⭐ Best combo</span>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
