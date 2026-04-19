import optionV2 from '@/assets/flywheel-mockups/option1-circular-v2.png';
import optionV4 from '@/assets/flywheel-mockups/option1-circular-v4.png';

const mockups = [
  {
    src: optionV2,
    title: 'Option 1 — Circular Flywheel (cleaned)',
    note: 'All stray debug text removed. 6 nodes + icons + central VECTO mark are correct. Arrow count came back as 8 instead of the requested 7 — image model would not honor the count after multiple attempts.',
  },
  {
    src: optionV4,
    title: 'Option 1 — Retry attempt (still 8 arrows)',
    note: 'Same as above visually. Kept for comparison.',
  },
];

export default function FlywheelReview() {
  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-extrabold mb-2">Flywheel Mockup Review</h1>
        <p className="text-muted-foreground mb-2">Refined per request: 6 nodes (CLIENT TRACKS → RESULTS COME → CLIENT STAYS → REFERS FRIENDS → REPUTATION GROWS → MORE CLIENTS).</p>
        <p className="text-sm text-primary mb-10">
          ⚠ Honest flag: you asked for 7 arrows. The image model returns 8 every time (it auto-balances arrows to node count). Three options:
          (a) accept 8 arrows — visually it reads as a clean continuous loop; (b) I rebuild this as native SVG in code where I can guarantee exactly 7 arrows; (c) different arrow scheme.
        </p>
        <div className="space-y-12">
          {mockups.map((m) => (
            <section key={m.title}>
              <h2 className="text-xl font-bold mb-2">{m.title}</h2>
              <p className="text-sm text-muted-foreground mb-4">{m.note}</p>
              <img
                src={m.src}
                alt={m.title}
                className="w-full rounded-lg border border-border"
                loading="lazy"
              />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
