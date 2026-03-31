import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

const plans = [
  {
    name: 'Monthly',
    subtitle: 'FOR SMART TRAINERS',
    price: '₹499',
    period: '/month',
    equiv: 'Pay Monthly',
    highlight: false,
    features: ['Unlimited clients', 'Progress graphs for clients', '30 days validity + 3-day grace', 'UPI & Card payments'],
    cta: 'Start Monthly',
  },
  {
    name: 'Annual',
    subtitle: 'For Elite Trainers',
    price: '₹5,988',
    period: '/year',
    equiv: 'Pay Annual',
    highlight: true,
    badge: '💪 Choice of Top Trainers',
    features: ['Everything in Monthly +', '2 months free', '+90 days per annual referral', 'Invite to workshops'],
    cta: 'Go Annual — Invest in your Career',
  },
];

export default function PricingSection() {
  return (
    <section className="px-4 py-16 sm:py-24 bg-secondary/20" id="pricing">
      <div className="mx-auto max-w-3xl">
        <motion.h2
          className="text-center text-2xl font-extrabold sm:text-3xl"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp} custom={0}
        >
          Small Investment For{' '}
          <span className="text-gradient">Big Returns</span>
        </motion.h2>
        <motion.p
          className="mx-auto mt-3 max-w-lg text-center text-sm sm:text-base text-muted-foreground"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp} custom={0.5}
        >
          That social media post where your client flaunts the results, and gives you the credit — what would you pay for that? It's priceless right? Focus on what truly matters and what will get your clients' results. Cutting corners on that is, well, a bad career decision!!
        </motion.p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
              variants={fadeUp} custom={i + 1}
            >
              <Card
                className={`relative h-full ${
                  p.highlight
                    ? 'border-primary shadow-[0_0_40px_-10px_hsl(var(--primary)/0.3)]'
                    : 'border-border'
                }`}
              >
                {p.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground whitespace-nowrap">
                    {p.badge}
                  </span>
                )}
                <CardHeader className="pb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{p.subtitle}</p>
                  <CardTitle className="text-lg mt-1">{p.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-4xl font-extrabold">{p.price}</span>
                    <span className="text-sm text-muted-foreground">{p.period}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{p.equiv}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className="mt-6 w-full gap-2"
                    variant={p.highlight ? 'default' : 'outline'}
                    size="lg"
                  >
                    <Link to="/auth">
                      {p.cta} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.p
          className="mt-8 text-center text-xs text-muted-foreground"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp} custom={3}
        >
          Start with a free 14-day trial — 3 clients, all features. No card needed.
        </motion.p>
      </div>
    </section>
  );
}
