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
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Brand Manifesto</p>
        <blockquote className="text-lg sm:text-xl font-medium leading-relaxed text-foreground italic">
          "In India, PT is an investment, not an expense. When a client pays you ₹15,000,
          they aren't paying for your time — they are paying for a <strong className="text-primary not-italic">new body</strong>.
          If they don't get it, you lose a client."
        </blockquote>
        <p className="mt-6 text-base text-muted-foreground leading-relaxed">
          TrainWell removes the friction of tracking so that the only thing left is the result.
          We don't just track workouts — <strong className="text-foreground">we track the truth</strong>.
        </p>
      </motion.div>
    </section>
  );
}
