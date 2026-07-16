import { Link } from "react-router-dom";
import { Check, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Seo from "@/components/Seo";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

const comparisonRows: Array<{ feature: string; vecto: string; trainerize: string }> = [
  {
    feature: "Backdating logs",
    vecto: "Blocked — clients can only log today. Yesterday is closed.",
    trainerize: "Allowed — clients can retro-fill workouts and meals days later.",
  },
  {
    feature: "Accountability model",
    vecto: "Binary calendar (green / red). No excuses, no partial credit.",
    trainerize: "Progress bars, streaks, and gentle nudges.",
  },
  {
    feature: "Trainer role",
    vecto: "Commander — sets the plan, enforces the rules of the house.",
    trainerize: "Coach + content library + messaging concierge.",
  },
  {
    feature: "Client experience",
    vecto: "The mirror doesn't lie. Log or don't — the calendar tells the truth.",
    trainerize: "Feature-rich app: habits, groups, meal photos, community feed.",
  },
  {
    feature: "Built for",
    vecto: "Independent 1:1 trainers with 2–15 paying clients who want retention.",
    trainerize: "Gyms, studios, and coaches running 30+ clients at scale.",
  },
  {
    feature: "Pricing (INR)",
    vecto: "₹499/month or ₹5,988/year. First 3 clients free.",
    trainerize: "Starts around $5/client/month; scales with client count.",
  },
  {
    feature: "Referral engine",
    vecto: "Built-in — trainer-to-trainer referrals extend subscription validity.",
    trainerize: "Affiliate programme via third parties.",
  },
  {
    feature: "Voice & tone",
    vecto: "Elite, clinical, dry. Rewards effort, mocks excuses.",
    trainerize: "Warm, encouraging, community-first.",
  },
];

export default function VectoVsTrainerize() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title="Vecto vs Trainerize: accountability over babysitting"
        description="A direct comparison of Vecto and Trainerize for independent personal trainers. Binary calendar, no-backdating logs, and retention-first design vs a feature-rich coaching app."
        path="/vecto-vs-trainerize"
      />
      <LandingNav />
      <main className="pt-24 pb-16">
        <article className="mx-auto max-w-3xl px-4">
          <header className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Trainerize alternative for independent trainers
            </p>
            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Vecto vs Trainerize:{" "}
              <span className="text-gradient">Why high-performance trainers choose accountability over babysitting</span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground">
              Trainerize is a well-loved coaching app. Vecto is a different animal — an
              accountability engine built for the one problem independent trainers can't
              solve with more content: <strong className="text-foreground">clients who don't stay long enough to get results</strong>.
              If you have 2–15 paying clients and retention is your real bottleneck,
              here's the honest comparison.
            </p>
          </header>

          <section className="space-y-6">
            <h2 className="text-xl font-bold">The core difference in one line</h2>
            <p className="text-muted-foreground">
              Trainerize gives your client{" "}
              <em>more ways to engage</em>. Vecto gives your client{" "}
              <em>fewer places to hide</em>. Everything downstream — the UI, the
              pricing, the tone — flows from that.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="mb-4 text-xl font-bold">Side-by-side</h2>
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="p-3 text-left font-semibold">&nbsp;</th>
                    <th className="p-3 text-left font-semibold text-primary">Vecto</th>
                    <th className="p-3 text-left font-semibold">Trainerize</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.feature} className="border-t border-border">
                      <td className="p-3 align-top font-medium">{row.feature}</td>
                      <td className="p-3 align-top">{row.vecto}</td>
                      <td className="p-3 align-top text-muted-foreground">{row.trainerize}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-10 space-y-4">
            <h2 className="text-xl font-bold">The Ruler: no-backdating, ever</h2>
            <p className="text-muted-foreground">
              Vecto's calendar is a hard rule, not a suggestion. Clients log{" "}
              <strong className="text-foreground">only today</strong>. Yesterday's box is
              closed. Tomorrow's is your plan, not their scoreboard. Trainerize lets
              clients fill workouts three days later "because life happened" — which is
              exactly how the "chalta hai" habit forms. Vecto refuses to encode that
              habit into the product.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 flex-none text-primary" /> Missed day stays red. That red tile is tomorrow's motivation.</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 flex-none text-primary" /> Trainer can only pre-log for today and future days — mirrors the discipline they demand.</li>
              <li className="flex items-start gap-2"><X className="mt-0.5 h-4 w-4 flex-none text-destructive" /> No "log this workout for last Monday" button. It doesn't exist.</li>
            </ul>
          </section>

          <section className="mt-10 space-y-4">
            <h2 className="text-xl font-bold">The Sage: the mirror doesn't lie</h2>
            <p className="text-muted-foreground">
              Every workout, meal, weight, and step is a datapoint that either shows up
              on the calendar or doesn't. No streaks to negotiate. No badges that reward
              partial effort. Trainerize is optimised for engagement metrics; Vecto is
              optimised for one metric: <strong className="text-foreground">did the
              client show up today, yes or no</strong>. That's the metric that turns into
              results, testimonials, and referrals — which is how you actually keep the
              client past month three.
            </p>
          </section>

          <section className="mt-10 space-y-4">
            <h2 className="text-xl font-bold">Who should stay on Trainerize</h2>
            <p className="text-muted-foreground">
              If you run a studio with 30+ clients, need a content library, group
              challenges, community feed, and integrated payments across geographies —
              stay on Trainerize. It's a mature product built for that scale. Vecto is
              deliberately narrower.
            </p>
            <h2 className="text-xl font-bold">Who should switch to Vecto</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><ArrowRight className="mt-0.5 h-4 w-4 flex-none text-primary" /> You're an independent 1:1 remote personal trainer with 2–15 clients.</li>
              <li className="flex items-start gap-2"><ArrowRight className="mt-0.5 h-4 w-4 flex-none text-primary" /> Your churn is at month 3–6, not at signup.</li>
              <li className="flex items-start gap-2"><ArrowRight className="mt-0.5 h-4 w-4 flex-none text-primary" /> You've decided that content and messaging aren't the problem — compliance is.</li>
              <li className="flex items-start gap-2"><ArrowRight className="mt-0.5 h-4 w-4 flex-none text-primary" /> You want fewer clients, longer LTV, more referrals — not a bigger app.</li>
            </ul>
          </section>

          <section className="mt-12 rounded-2xl border border-border bg-muted/20 p-6 text-center">
            <h2 className="text-xl font-bold">Try the binary calendar on your own clients</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
              First 3 clients free. No credit card. If a client can't be held to a red
              tile, Trainerize won't save them either.
            </p>
            <Button asChild size="lg" className="mt-5 font-bold">
              <Link to="/auth">Start free</Link>
            </Button>
          </section>

          <section className="mt-12">
            <h2 className="mb-3 text-xl font-bold">FAQ</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-semibold text-foreground">Is Vecto a Trainerize replacement?</p>
                <p className="mt-1 text-muted-foreground">
                  Only if your bottleneck is retention. If you need a full studio-management
                  suite, no — Vecto is intentionally narrower.
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Can I import my Trainerize clients?</p>
                <p className="mt-1 text-muted-foreground">
                  Vecto onboarding is manual today. It takes about 2 minutes per client —
                  you send an invite link, they set up their own profile.
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Does Vecto have a mobile app?</p>
                <p className="mt-1 text-muted-foreground">
                  Vecto is a PWA — installs to the home screen on iOS and Android, sends
                  push notifications, and works offline for viewing logs.
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground">What about remote coaching without a gym?</p>
                <p className="mt-1 text-muted-foreground">
                  Vecto is built for exactly this — remote 1:1 personal trainers whose
                  clients train at their own gym. The trainer never needs to be on the
                  floor.
                </p>
              </div>
            </div>
          </section>
        </article>
      </main>
      <LandingFooter />
    </div>
  );
}
