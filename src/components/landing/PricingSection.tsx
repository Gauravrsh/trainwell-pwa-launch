import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Sparkles, Crown, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

type Plan = {
  id: 'smart' | 'monthly' | 'annual';
  name: string;
  icon: typeof Sparkles;
  price: string;
  period: string;
  description: string;
  badge?: string;
  highlight?: boolean;
  features: string[];
  cta: string;
};

const plans: Plan[] = [
  {
    id: 'smart',
    name: 'Smart',
    icon: Sparkles,
    price: '₹0',
    period: ' forever',
    description: 'Up to 3 active clients · All features unlocked',
    features: [
      'Up to 3 active clients',
      'All features unlocked',
      'No card required',
      'Upgrade only when you scale',
    ],
    cta: 'Start Smart',
  },
  {
    id: 'monthly',
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
  },
  {
    id: 'annual',
    name: 'Elite',
    icon: Crown,
    price: '₹9,999',
    period: '/year',
    description: '~₹714/month · Unlimited clients\n~28% less than monthly plan',
    badge: 'BEST VALUE',
    highlight: true,
    features: [
      'Everything in Pro',
      '14 months for the price of 12',
      'Referral rewards (annual)',
      'Priority support',
      'Get invite to in-person meetups with elite trainers',
    ],
    cta: 'Go Elite',
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

        {/* Beta Banner — moved here, just above the plan grid */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp} custom={0.8}
          className="mx-auto mt-8 mb-6 flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 w-fit"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            Special Beta Pricing<sup>*</sup>
          </span>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.id}
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
                variants={fadeUp} custom={i + 1}
                className={`relative w-full p-5 rounded-2xl border-2 text-left transition-all ${
                  plan.highlight
                    ? 'border-primary bg-primary/5 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.3)]'
                    : 'border-border bg-card'
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold text-primary-foreground whitespace-nowrap">
                    {plan.badge}
                  </span>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-semibold text-foreground">{plan.name}</span>
                </div>

                <div className="mb-2">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>

                <p className="text-sm text-muted-foreground mb-4 whitespace-pre-line min-h-[40px]">
                  {plan.description}
                </p>

                <ul className="space-y-1.5 mb-5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-success flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={`w-full ${
                    plan.highlight
                      ? ''
                      : 'bg-background text-foreground border-2 border-primary hover:bg-primary/10 hover:text-foreground'
                  }`}
                  variant={plan.highlight ? 'default' : 'outline'}
                  size="lg"
                >
                  <Link to="/auth">{plan.cta}</Link>
                </Button>
              </motion.div>
            );
          })}
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
