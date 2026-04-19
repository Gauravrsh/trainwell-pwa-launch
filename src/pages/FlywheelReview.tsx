import flywheel from '@/assets/flywheel-mockups/option1-final-v7.png';

export default function FlywheelReview() {
  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-extrabold mb-2">Flywheel — Final</h1>
        <p className="text-muted-foreground mb-2">
          7 nodes (Client Tracks → Results Come → Client Stays → Refers Friends → Reputation Grows → More Clients → Repeat) with a single clockwise ring of curved neon arrows. Vecto wordmark centered. Brand colors and typography preserved.
        </p>
        <p className="text-sm text-muted-foreground mb-10">Approve and I'll place it on the landing page CTA.</p>
        <div className="rounded-lg border border-border bg-background p-6 sm:p-10">
          <img
            src={flywheel}
            alt="Vecto flywheel: client tracks, results come, client stays, refers friends, reputation grows, more clients, repeat"
            className="mx-auto block w-full max-w-[600px] h-auto"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
