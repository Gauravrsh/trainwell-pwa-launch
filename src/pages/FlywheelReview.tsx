import FlywheelSVG from '@/components/landing/FlywheelSVG';

export default function FlywheelReview() {
  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-extrabold mb-2">Flywheel — Native SVG</h1>
        <p className="text-muted-foreground mb-2">
          Pixel-controlled. Inter font, primary lime token, foreground white. 6 nodes + 7 arrows
          (the extra short arrow sits in the MORE CLIENTS → CLIENT TRACKS sector to signal the loop-back).
        </p>
        <p className="text-sm text-muted-foreground mb-10">
          Approve and I'll wire it into the landing page CTA section, replacing the text-only flywheel.
        </p>

        <div className="rounded-lg border border-border bg-background p-6 sm:p-10">
          <FlywheelSVG className="mx-auto block w-full max-w-[560px] h-auto" />
        </div>
      </div>
    </div>
  );
}
