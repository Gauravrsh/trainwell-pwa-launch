import { useMemo } from "react";

/**
 * TW-016: In-app loading state quote rotation.
 *
 * Shown by RouteFallback during lazy-loaded route chunk fetches.
 * Picks a quote at mount, so each navigation may show a different one.
 * The cold-start SplashScreen stays minimal (no quote) — this is for
 * post-login navigations where a quick beat of brand voice fits the moment.
 */

type Quote = { text: string; attribution: string };

const QUOTES: Quote[] = [
  {
    text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    attribution: "Will Durant",
  },
  {
    text: "Success is the sum of small efforts, repeated day in and day out.",
    attribution: "Robert Collier",
  },
  {
    text: "It's not what we do once in a while that shapes our lives. It's what we do consistently.",
    attribution: "Tony Robbins",
  },
  {
    text: "Discipline is choosing between what you want now and what you want most.",
    attribution: "Abraham Lincoln",
  },
  {
    text: "You do not rise to the level of your goals. You fall to the level of your systems.",
    attribution: "James Clear",
  },
  {
    text: "Motivation gets you going, but discipline keeps you growing.",
    attribution: "John C. Maxwell",
  },
  {
    text: "Small disciplines repeated with consistency every day lead to great achievements gained slowly over time.",
    attribution: "John C. Maxwell",
  },
  {
    text: "Hard work beats talent when talent doesn't work hard.",
    attribution: "Tim Notke",
  },
  {
    text: "The pain of discipline weighs ounces. The pain of regret weighs tonnes.",
    attribution: "Anonymous",
  },
  {
    text: "Show up. Even when you don't feel like it. Especially when you don't feel like it.",
    attribution: "Anonymous",
  },
];

export const LoadingQuote = () => {
  const quote = useMemo(
    () => QUOTES[Math.floor(Math.random() * QUOTES.length)],
    []
  );

  return (
    <div className="mt-8 max-w-md px-6 text-center">
      <p className="italic text-sm text-muted-foreground leading-relaxed">
        “{quote.text}”
      </p>
      <p className="mt-2 text-xs text-muted-foreground/70 not-italic">
        — {quote.attribution}
      </p>
    </div>
  );
};