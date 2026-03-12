import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function MirrorSection() {
  return (
    <section className="px-4 py-16 sm:py-24">
      <motion.div
        className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-8 sm:p-12"
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
        variants={fadeUp}
      >
        <h2 className="text-2xl font-extrabold sm:text-3xl leading-tight">
          The Mirror Doesn't Lie.{' '}
          <span className="text-gradient">Neither Does This App.</span>
        </h2>
        <p className="mt-5 text-base text-muted-foreground leading-relaxed sm:text-lg">
          A client who doesn't log is a client who will eventually drop off.
          TrainWell turns the daily log into a <strong className="text-foreground">digital mirror</strong>.
          When the calendar turns <span className="font-bold text-destructive">Red</span>,
          the client knows exactly why they aren't seeing results. You stop being a "nag" and start being a{' '}
          <strong className="text-foreground">professional coach backed by data</strong>.
        </p>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          In India, PT is an investment — not an expense. When a client pays ₹15,000/month, they're paying for a new body.
          If they don't get it, you lose a client. TrainWell removes the friction of tracking so the only thing left is the result.
        </p>
      </motion.div>
    </section>
  );
}
