import option1 from '@/assets/flywheel-mockups/option1-circular.png';
import option2 from '@/assets/flywheel-mockups/option2-hex.png';
import option3 from '@/assets/flywheel-mockups/option3-orbit.png';

const mockups = [
  { src: option1, title: 'Option 1 — Circular Flywheel', note: 'Closest to your reference. Has stray "100%/70%" debug text inside arrows that needs cleanup.' },
  { src: option2, title: 'Option 2 — Hexagonal Command Grid', note: 'Brutalist / command-center energy. Arrow flow reads counterclockwise, needs fix.' },
  { src: option3, title: 'Option 3 — Editorial Orbit', note: 'Refined Economist-style. Has a typo "REPUATION" and only 4 of 6 labels rendered.' },
];

export default function FlywheelReview() {
  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-extrabold mb-2">Flywheel Mockup Review</h1>
        <p className="text-muted-foreground mb-10">Pick one to perfect before placing on landing page.</p>
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
