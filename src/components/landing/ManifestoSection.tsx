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
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">The Simple Math</p>
        <h2 className="text-xl sm:text-2xl font-extrabold leading-snug">
          Client gets results → Client stays → Client refers friends →{' '}
          <span className="text-gradient">You build wealth.</span>
        </h2>
        <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
          That's it. That's the whole game. Everything else — the diet plans, the exercise variations,
          the motivational speeches — only works if the client shows up and stays consistent.
          TrainWell doesn't replace your coaching. It makes sure your coaching actually reaches the client.
        </p>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
          We built this for trainers like you. Not for gym chains. Not for influencers.
          For the trainer who wakes up at 5 AM, trains 8 clients a day,
          and deserves a tool that works as hard as they do.
        </p>
      </motion.div>
    </section>
  );
}
