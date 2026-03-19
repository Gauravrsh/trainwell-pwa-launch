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
          Mirror Doesn't Lie.
        </h2>
        <p className="mt-5 text-base text-muted-foreground leading-relaxed sm:text-lg">
          TrainWell app is a mirror. It turns every day into a simple <span className="font-bold text-success">Green</span> or{' '}
          <span className="font-bold text-destructive">Red</span> box on the calendar.
          There's no story to tell. No excuse to give. The client sees it. You see it.
          When there are 5 red boxes in a row, you don't have to say anything to the client.
          The calendar says it for you.
        </p>
        <p className="mt-4 text-base text-muted-foreground leading-relaxed sm:text-lg">
          You stop 'babysitting' the client. You start being the coach who shows up with data.
          That's the difference between a trainer whose client gets results, and the ones, whose don't.
        </p>
      </motion.div>
    </section>
  );
}
