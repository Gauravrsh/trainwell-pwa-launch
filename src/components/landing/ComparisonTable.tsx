import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

const rows = [
{ label: 'Workout planning', whatsapp: 'Voice note / text list', trainwell: 'Structured, date-locked plans' },
{ label: 'Client compliance', whatsapp: '"Haan sir, kar liya" on WhatsApp', trainwell: 'Green or Red on the calendar' },
{ label: 'Diet logging', whatsapp: 'Client sends a photo... sometimes', trainwell: 'AI-powered, 10-second meal log' },
{ label: 'Backdating', whatsapp: '"I\'ll log it tomorrow" (never does)', trainwell: 'Locked. Today only.' },
{ label: 'Progress data', whatsapp: 'In your head or a notebook', trainwell: 'Charts, trends, real numbers' },
{ label: 'Client retention', whatsapp: '3-6 months average', trainwell: '12+ months with results' }];


export default function ComparisonTable() {
  return (
    <section className="px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <motion.h2
          className="text-center text-2xl font-extrabold sm:text-3xl"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp}>
          
          WhatsApp Coaching vs.{' '}
          <span className="text-gradient">TrainWell</span>
        </motion.h2>
        <motion.p
          className="mx-auto mt-3 max-w-md text-center text-muted-foreground text-lg"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp}>You're already doing the hard work. The question is — are your methods helping you?


        </motion.p>

        <motion.div
          className="mt-10 overflow-hidden rounded-xl border border-border"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp}>
          
          <div className="grid grid-cols-3 bg-secondary/50">
            <div className="p-3 sm:p-4 text-sm font-semibold text-muted-foreground" />
            <div className="p-3 sm:p-4 text-center font-semibold text-muted-foreground text-base">WhatsApp</div>
            <div className="p-3 sm:p-4 text-center font-semibold text-primary text-base">TrainWell</div>
          </div>

          {rows.map((row, i) =>
          <div
            key={row.label}
            className={`grid grid-cols-3 ${i % 2 === 0 ? 'bg-card' : 'bg-secondary/20'}`}>
            
              <div className="p-3 sm:p-4 text-base font-medium text-foreground">{row.label}</div>
              <div className="p-3 sm:p-4 text-center text-base text-muted-foreground flex items-start justify-center gap-1.5">
                <X className="mt-1 h-4 w-4 shrink-0 text-destructive" />
                <span>{row.whatsapp}</span>
              </div>
              <div className="p-3 sm:p-4 text-center text-base text-foreground flex items-start justify-center gap-1.5">
                <Check className="mt-1 h-4 w-4 shrink-0 text-success" />
                <span>{row.trainwell}</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>);

}