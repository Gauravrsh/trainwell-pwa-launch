import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';

const rows = [
  { label: 'Client Logs', whatsapp: 'Messy screenshots', trainwell: 'Structured, real-time' },
  { label: 'Backdating', whatsapp: 'Common excuse', trainwell: 'Impossible — locked' },
  { label: 'Progress Visibility', whatsapp: 'None', trainwell: 'Calendar + Charts' },
  { label: 'Avg. Client Retention', whatsapp: '~3 months', trainwell: '12+ months' },
  { label: 'Payment Tracking', whatsapp: 'Manual follow-up', trainwell: 'Built-in UPI & Razorpay' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function ComparisonTable() {
  return (
    <section className="px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <motion.h2
          className="text-center text-2xl font-extrabold sm:text-3xl"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp}
        >
          WhatsApp Coaching vs. <span className="text-gradient">TrainWell</span>
        </motion.h2>

        <motion.div
          className="mt-10 overflow-hidden rounded-xl border border-border"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp}
        >
          {/* Header */}
          <div className="grid grid-cols-3 bg-secondary/50">
            <div className="p-3 text-xs font-semibold text-muted-foreground" />
            <div className="p-3 text-center text-xs font-semibold text-destructive/80">WhatsApp</div>
            <div className="p-3 text-center text-xs font-semibold text-primary">TrainWell</div>
          </div>

          {rows.map((row, i) => (
            <div key={row.label} className={`grid grid-cols-3 ${i % 2 === 0 ? 'bg-card' : 'bg-secondary/20'}`}>
              <div className="p-3 text-sm font-medium text-foreground">{row.label}</div>
              <div className="flex items-center justify-center gap-1.5 p-3 text-xs text-destructive/70">
                <X className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{row.whatsapp}</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 p-3 text-xs text-primary">
                <Check className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{row.trainwell}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
