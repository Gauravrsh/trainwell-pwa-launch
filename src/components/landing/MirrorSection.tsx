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
          The Calendar Doesn't Lie.{' '}
          <span className="text-gradient">And Neither Should Your Clients.</span>
        </h2>
        <p className="mt-5 text-base text-muted-foreground leading-relaxed sm:text-lg">
          You already know which clients will drop off. It's the ones who "forgot" to eat right yesterday,
          who "didn't have time" to work out, who'll tell you they'll make up for it "next week."
        </p>
        <p className="mt-4 text-base text-muted-foreground leading-relaxed">
          TrainWell turns every day into a simple <span className="font-bold text-success">Green</span> or{' '}
          <span className="font-bold text-destructive">Red</span> box on the calendar.
          There's no story to tell. No excuse to give. The client sees it. You see it.
          When there are 5 red boxes in a row, you don't have to say "bhai, tu seriously nahi le raha hai."
          The calendar says it for you.
        </p>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          You stop being the "nag." You start being the coach who shows up with data.
          That's the difference between a trainer who keeps clients for 3 months and one who keeps them for 12.
        </p>
      </motion.div>
    </section>
  );
}
