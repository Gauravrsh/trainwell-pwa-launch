import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, ClipboardList, TrendingUp, CreditCard,
  Dumbbell, Camera, Scale, ChevronRight, Check,
  ArrowRight, Zap, Shield, Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

/* ───────────────────────── Hero ───────────────────────── */
const Hero = () => (
  <section className="relative overflow-hidden px-4 pt-20 pb-16 sm:pt-28 sm:pb-24">
    {/* Glow */}
    <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-primary/10 blur-[120px]" />

    <div className="relative mx-auto max-w-3xl text-center">
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Zap className="h-3 w-3" /> Built for Indian trainers
        </span>
      </motion.div>

      <motion.h1
        className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
        initial="hidden" animate="visible" variants={fadeUp} custom={1}
      >
        Run your training business{' '}
        <span className="text-gradient">from your phone</span>
      </motion.h1>

      <motion.p
        className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg"
        initial="hidden" animate="visible" variants={fadeUp} custom={2}
      >
        Manage clients, training plans, payments, and progress — all in one pocket-sized platform. Your clients stay accountable with daily logging &amp; AI-powered food analysis.
      </motion.p>

      <motion.div
        className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
        initial="hidden" animate="visible" variants={fadeUp} custom={3}
      >
        <Button asChild size="lg" className="w-full sm:w-auto gap-2 text-base font-semibold">
          <Link to="/auth">
            Start Free Trial <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-base">
          <Link to="/auth">Sign In</Link>
        </Button>
      </motion.div>

      <motion.p
        className="mt-4 text-xs text-muted-foreground"
        initial="hidden" animate="visible" variants={fadeUp} custom={4}
      >
        14-day free trial · No credit card required · 3 clients included
      </motion.p>
    </div>
  </section>
);

/* ───────────────────── How It Works ────────────────────── */
const steps = [
  { num: '01', title: 'Sign up & set up', desc: 'Create your trainer profile in under a minute. Your unique ID is generated instantly.' },
  { num: '02', title: 'Invite clients', desc: 'Share your invite link via WhatsApp. Clients sign up free and link to your profile.' },
  { num: '03', title: 'Train & track', desc: 'Create plans, log sessions, monitor progress charts, and collect payments — all from one dashboard.' },
];

const HowItWorks = () => (
  <section className="px-4 py-16 sm:py-24">
    <div className="mx-auto max-w-4xl">
      <h2 className="text-center text-2xl font-bold sm:text-3xl">
        Get started in <span className="text-primary">3 steps</span>
      </h2>

      <div className="mt-12 grid gap-8 sm:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.num}
            className="relative rounded-2xl border border-border bg-card p-6"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
            variants={fadeUp} custom={i}
          >
            <span className="text-4xl font-black text-primary/20">{s.num}</span>
            <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ───────────────────── Features ────────────────────────── */
const trainerFeatures = [
  { icon: Users, title: 'Client Management', desc: 'Invite via WhatsApp, view daily status at a glance — workouts done, food logged.' },
  { icon: ClipboardList, title: 'Training Plans', desc: 'Workout, nutrition, or both. Prepaid or postpaid. Full lifecycle from draft to completion.' },
  { icon: TrendingUp, title: 'Progress Monitoring', desc: 'Calorie in vs out, weight trends, and missed-day tracking with date-range filters.' },
  { icon: CreditCard, title: 'Payments & UPI', desc: 'Track billing cycles and request payments via UPI. Razorpay integration built in.' },
];

const clientFeatures = [
  { icon: Dumbbell, title: 'Workout Logging', desc: 'Pick from a curated exercise database. Log sets, reps, and weight in seconds.' },
  { icon: Camera, title: 'AI Food Analysis', desc: 'Snap a photo or describe your meal — get instant calorie & macro breakdown.' },
  { icon: Scale, title: 'Weight & BMR Tracking', desc: 'Daily weight logs with trend charts. BMR warnings when data gets stale.' },
  { icon: TrendingUp, title: 'Progress Charts', desc: 'See your net caloric balance and weight trend over any date range.' },
];

const Features = () => (
  <section className="px-4 py-16 sm:py-24 bg-secondary/30">
    <div className="mx-auto max-w-5xl">
      {/* Trainer */}
      <div>
        <h2 className="text-center text-2xl font-bold sm:text-3xl">
          Everything a trainer <span className="text-primary">needs</span>
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {trainerFeatures.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
              variants={fadeUp} custom={i}
            >
              <Card className="h-full border-border bg-card">
                <CardHeader className="flex flex-row items-start gap-3 pb-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Client */}
      <div className="mt-20">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">
          Your clients stay <span className="text-primary">accountable</span>
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {clientFeatures.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
              variants={fadeUp} custom={i}
            >
              <Card className="h-full border-border bg-card">
                <CardHeader className="flex flex-row items-start gap-3 pb-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

/* ───────────────────── Pricing ─────────────────────────── */
const plans = [
  {
    name: 'Trial',
    price: 'Free',
    period: '14 days',
    highlight: false,
    features: ['All features unlocked', 'Up to 3 clients', 'AI food analysis', 'No credit card needed'],
  },
  {
    name: 'Monthly',
    price: '₹499',
    period: '/month',
    highlight: true,
    features: ['Unlimited clients', 'All features', '30 days + 3-day grace', 'UPI & Razorpay payments'],
  },
  {
    name: 'Annual',
    price: '₹5,988',
    period: '/year',
    highlight: false,
    features: ['14 months access', 'Unlimited clients', '+3 months per referral', 'Best value'],
  },
];

const Pricing = () => (
  <section className="px-4 py-16 sm:py-24" id="pricing">
    <div className="mx-auto max-w-4xl">
      <h2 className="text-center text-2xl font-bold sm:text-3xl">
        Simple, transparent <span className="text-primary">pricing</span>
      </h2>
      <p className="mx-auto mt-3 max-w-md text-center text-sm text-muted-foreground">
        Trainers pay. Clients use TrainWell for free — always.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {plans.map((p, i) => (
          <motion.div
            key={p.name}
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
            variants={fadeUp} custom={i}
          >
            <Card
              className={`relative h-full border ${
                p.highlight
                  ? 'border-primary shadow-[0_0_30px_-10px_hsl(var(--primary)/0.35)]'
                  : 'border-border'
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">
                  Most Popular
                </span>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{p.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-extrabold">{p.price}</span>
                  <span className="text-sm text-muted-foreground">{p.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="mt-6 w-full"
                  variant={p.highlight ? 'default' : 'outline'}
                >
                  <Link to="/auth">Get Started</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ───────────────────── FAQ ─────────────────────────────── */
const faqs = [
  { q: 'Is TrainWell free for clients?', a: 'Yes — clients never pay for the app. Only trainers subscribe to manage their business.' },
  { q: 'What happens after the 14-day trial?', a: 'Your account enters a read-only grace period. Upgrade to monthly or annual to continue managing clients.' },
  { q: 'How does AI food analysis work?', a: 'Clients describe or photograph a meal. Our AI returns a per-item calorie and macronutrient breakdown within seconds.' },
  { q: 'Can I collect payments through TrainWell?', a: 'Yes. Set your UPI ID and send payment requests to clients. Razorpay integration handles online payments.' },
  { q: 'Is my data secure?', a: 'All data is encrypted, access-controlled with row-level security, and webhook endpoints are HMAC-verified.' },
  { q: 'Does the referral program stack?', a: 'Yes. Each annual referral earns you 3 extra months. There is no cap on referral rewards.' },
];

const FAQ = () => (
  <section className="px-4 py-16 sm:py-24">
    <div className="mx-auto max-w-2xl">
      <h2 className="text-center text-2xl font-bold sm:text-3xl">
        Frequently asked <span className="text-primary">questions</span>
      </h2>

      <Accordion type="single" collapsible className="mt-10">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left text-sm sm:text-base">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

/* ───────────────────── CTA Banner ──────────────────────── */
const CTABanner = () => (
  <section className="px-4 py-16">
    <div className="mx-auto max-w-3xl rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center sm:p-12">
      <h2 className="text-2xl font-bold sm:text-3xl">
        Ready to level up your coaching?
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
        Join trainers across India who manage their entire business from TrainWell. Start your free 14-day trial today.
      </p>
      <Button asChild size="lg" className="mt-6 gap-2 text-base font-semibold">
        <Link to="/auth">
          Start Free Trial <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  </section>
);

/* ───────────────────── Footer ──────────────────────────── */
const Footer = () => (
  <footer className="border-t border-border px-4 py-8">
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
      <div>
        <span className="text-lg font-bold">train<span className="text-primary">well</span></span>
        <p className="mt-1 text-xs text-muted-foreground">© {new Date().getFullYear()} TrainWell. All rights reserved.</p>
      </div>
      <div className="flex gap-6 text-sm text-muted-foreground">
        <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
        <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        <Link to="/auth" className="hover:text-foreground transition-colors">Sign In</Link>
      </div>
    </div>
  </footer>
);

/* ───────────────────── Navbar ──────────────────────────── */
const LandingNav = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border safe-top">
    <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
      <Link to="/" className="text-lg font-bold">
        train<span className="text-primary">well</span>
      </Link>
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <a href="#pricing">Pricing</a>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link to="/auth">Sign In</Link>
        </Button>
        <Button asChild size="sm" className="hidden sm:inline-flex">
          <Link to="/auth">Start Free Trial</Link>
        </Button>
      </div>
    </div>
  </nav>
);

/* ───────────────────── Page ────────────────────────────── */
export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />
      <Hero />
      <HowItWorks />
      <Features />
      <Pricing />
      <FAQ />
      <CTABanner />
      <Footer />
    </div>
  );
}
