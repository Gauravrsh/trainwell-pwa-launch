import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export default function ManifestoSection() {
  return (
    <section className="px-4 py-16 sm:py-24 bg-secondary/20">
      <motion.div
        className="mx-auto max-w-2xl text-center"
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
        variants={fadeUp}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Why This Exists</p>
        <blockquote className="text-lg sm:text-xl font-medium leading-relaxed text-foreground">
          "Whatever gets tracked, gets done."
        </blockquote>
        <p className="mt-6 text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
          Consistency builds habits. Habits replace motivation. Tracking builds consistency.
          Every visible day of missed workout is motivation to show up tomorrow.
          Every logged meal is a small win that compounds into a transformation.
        </p>
        <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
          When the client wins, they stay. When they stay, they refer.
          When they refer, <strong className="text-foreground">you build wealth</strong>.
          TrainWell doesn't just track workouts — <strong className="text-foreground">it tracks the truth</strong>.
        </p>
      </motion.div>
    </section>
  );
}
