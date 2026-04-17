import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Sparkles, Crown, Rocket, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    icon: Sparkles,
    price: '₹0',
    period: ' forever',
    description: 'Up to 3 active clients · All features unlocked',
    subnote: 'Stay free, or upgrade when you scale.',
    features: [
      'Up to 3 active clients',
      'All features unlocked',
      'No card required',
      'Cancel anytime',
    ],
    cta: 'Start Free',
    highlight: false,
    ctaVariant: 'outline' as const,
  },
  {
    key: 'pro',
    name: 'Pro',
    icon: Rocket,
    price: '₹999',
    period: '/month',
    description: '30 days + 3-day grace · Unlimited clients',
    features: [
      'Unlimited active clients',
      'All features unlocked',
      'UPI & card payments',
      'Cancel anytime',
      'Get invite to learning webinars',
    ],
    cta: 'Go Pro',
    highlight: false,
    ctaVariant: 'outline' as const,
  },
  {
    key: 'elite',
    name: 'Elite',
    icon: Crown,
    price: '₹9,999',
    period: '/year',
    description: '~₹714/month · Unlimited clients\n~28% less than monthly plan',
    badge: 'BEST VALUE',
    features: [
      'Everything in Pro',
      '14 months for the price of 12',
      'Referral rewards (annual)',
      'Priority support',
      'Get invite to in-person meetups with elite trainers',
    ],
    cta: 'Go Elite',
    highlight: true,
    ctaVariant: 'default' as const,
  },
];

const PricingSection = forwardRef<HTMLElement>((_, ref) => {
  return (
    <section ref={ref} className="px-4 py-16 sm:py-24 bg-secondary/20" id="pricing">
      <div className="mx-auto max-w-5xl">
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

        {/* Beta Pricing Pill — moved below paragraph, above Smart plan */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp} custom={1}
          className="mt-8 flex justify-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground">Special Beta Pricing<sup>*</sup></span>
          </div>
        </motion.div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {plans.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.key}
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
                variants={fadeUp} custom={i + 2}
                className={`relative w-full p-5 rounded-2xl border-2 text-left transition-all bg-card flex flex-col ${
                  p.highlight
                    ? 'border-primary bg-primary/5 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4)]'
                    : 'border-border'
                }`}
              >
                {p.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded whitespace-nowrap">
                    {p.badge}
                  </span>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-semibold text-foreground">{p.name}</span>
                </div>

                <div className="mb-2">
                  <span className="text-2xl font-bold text-foreground">{p.price}</span>
                  <span className="text-muted-foreground">{p.period}</span>
                </div>

                <p className="text-sm text-muted-foreground mb-3 whitespace-pre-line">{p.description}</p>

                <ul className="space-y-1.5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 w-4 h-4 text-success flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={`mt-5 w-full ${
                    p.ctaVariant === 'outline'
                      ? 'border-primary text-primary bg-background hover:bg-primary/10'
                      : ''
                  }`}
                  variant={p.ctaVariant}
                  size="lg"
                >
                  <Link to="/auth">{p.cta}</Link>
                </Button>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          className="mt-8 text-center text-xs text-muted-foreground"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp} custom={5}
        >
          <sup>*</sup> Beta launch pricing. Subject to revision. Existing paid subscribers continue at their paid rate until renewal.
        </motion.p>
      </div>
    </section>
  );
});

PricingSection.displayName = 'PricingSection';

export default PricingSection;
