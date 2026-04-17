import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
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
    key: 'smart',
    name: 'Smart',
    subtitle: 'FREE FOREVER',
    price: '₹0',
    period: '',
    equiv: 'Stay free, forever',
    highlight: false,
    features: [
      'Up to 3 active clients',
      'All features unlocked',
      'No card required',
      'Upgrade only when you scale',
    ],
    cta: 'Start Free',
  },
  {
    key: 'pro',
    name: 'Pro',
    subtitle: 'FOR GROWING TRAINERS',
    price: '₹999',
    period: '/month',
    equiv: 'Pay monthly · 30 days + 3 grace',
    highlight: false,
    features: [
      'Unlimited active clients',
      'All features unlocked',
      'UPI & card payments',
      'Cancel anytime',
    ],
    cta: 'Go Pro',
  },
  {
    key: 'elite',
    name: 'Elite',
    subtitle: 'FOR ELITE TRAINERS',
    price: '₹9,999',
    period: '/year',
    equiv: '12 + 2 bonus months · ~₹714/mo',
    highlight: true,
    badge: '💪 Best Value',
    features: [
      'Everything in Pro',
      '14 months for the price of 12',
      'Referral rewards (annual)',
      'Priority support',
    ],
    cta: 'Go Elite',
  },
];

const PricingSection = forwardRef<HTMLElement>((_, ref) => {
  return (
    <section className="px-4 py-16 sm:py-24 bg-secondary/20" id="pricing">
      <div className="mx-auto max-w-5xl">
        {/* Beta Banner */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp} custom={0}
          className="mx-auto mb-8 max-w-2xl rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-center"
        >
          <p className="text-sm font-semibold text-foreground flex items-center justify-center gap-2 flex-wrap">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Special Pricing<sup>*</sup> for Beta Users</span>
            <span className="text-muted-foreground font-normal">— Lock in these rates while you can.</span>
          </p>
        </motion.div>

        <motion.h2
          className="text-center text-2xl font-extrabold sm:text-3xl"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp} custom={0}
        >
          Small Investment{' '}
          <span className="text-gradient">Big Returns</span>
        </motion.h2>
        <motion.p
          className="mx-auto mt-3 max-w-lg text-center text-sm sm:text-base text-muted-foreground whitespace-pre-line"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp} custom={0.5}
        >
          {`That social media post where your client flaunts the results, and gives you the credit — what would you pay for that? It's priceless right? \nFocus on what truly matters and what will get your clients' results. Cutting corners on that is, well, a bad career decision!!`}
        </motion.p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((p, i) => (
            <motion.div
              key={p.key}
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
                    {p.period && <span className="text-sm text-muted-foreground">{p.period}</span>}
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
          variants={fadeUp} custom={4}
        >
          <sup>*</sup> Beta launch pricing. Subject to revision. Existing paid subscribers continue at their paid rate until renewal.
        </motion.p>
      </div>
    </section>
  );
});

PricingSection.displayName = 'PricingSection';

export default PricingSection;
