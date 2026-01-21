import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PlanSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelectPlan: (planType: 'monthly' | 'annual') => Promise<void>;
  isRenewal: boolean;
  currentPlan?: string;
}

const plans = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 499,
    period: '/month',
    description: 'Pay as you go',
    razorpayButtonId: 'pl_S6cIGsJyU7Owle',
    features: [
      'Unlimited clients',
      'Workout & nutrition planning',
      'Client progress tracking',
      'Payment management',
      'In-app notifications',
    ],
  },
  {
    id: 'annual',
    name: 'Annual',
    price: 5988,
    originalPrice: 5988,
    period: '/year',
    description: 'Pay for 12 months, get 14 months access',
    badge: 'BEST VALUE',
    razorpayButtonId: 'pl_S6ccDIYhIw1AaB',
    features: [
      'Everything in Monthly',
      'Priority support',
      'Early access to new features',
    ],
  },
];

export function PlanSelectionModal({
  open,
  onClose,
  onSelectPlan,
  isRenewal,
  currentPlan,
}: PlanSelectionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const paymentContainerRef = useRef<HTMLDivElement>(null);

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  // Render Razorpay button when plan changes or modal opens
  useEffect(() => {
    if (open && selectedPlanData?.razorpayButtonId && paymentContainerRef.current) {
      // Clear previous button
      paymentContainerRef.current.innerHTML = '';
      
      // Create form element
      const form = document.createElement('form');
      form.style.width = '100%';
      
      // Create and append script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/payment-button.js';
      script.setAttribute('data-payment_button_id', selectedPlanData.razorpayButtonId);
      script.async = true;
      
      form.appendChild(script);
      paymentContainerRef.current.appendChild(form);
    }
    
    return () => {
      if (paymentContainerRef.current) {
        paymentContainerRef.current.innerHTML = '';
      }
    };
  }, [open, selectedPlan, selectedPlanData?.razorpayButtonId]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold">
            {isRenewal ? 'Renew Your Plan' : 'Choose Your Plan'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {isRenewal 
              ? 'Select a plan to continue your subscription' 
              : 'Start growing your fitness business today'}
          </p>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {plans.map((plan) => (
            <motion.button
              key={plan.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedPlan(plan.id as 'monthly' | 'annual')}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                selectedPlan === plan.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-muted-foreground/30'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {plan.id === 'annual' ? (
                    <Crown className="w-5 h-5 text-primary" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className="font-semibold text-foreground">{plan.name}</span>
                  {plan.badge && (
                    <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded">
                      {plan.badge}
                    </span>
                  )}
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedPlan === plan.id
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground/30'
                }`}>
                  {selectedPlan === plan.id && (
                    <Check className="w-3 h-3 text-primary-foreground" />
                  )}
                </div>
              </div>

              <div className="mb-2">
                <span className="text-2xl font-bold text-foreground">₹{plan.price.toLocaleString()}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>

              <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>

              <ul className="space-y-1.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.button>
          ))}

          {/* Razorpay Payment Button Container */}
          <div className="w-full py-2 flex flex-col items-center">
            <div ref={paymentContainerRef} className="flex justify-center items-center [&_form]:flex [&_form]:justify-center [&_form]:w-full [&_.razorpay-payment-button]:mx-auto" />
            <p className="text-xs text-center text-muted-foreground mt-3">
              Secure payment via Razorpay
            </p>
          </div>
        </div>

        {/* Legal Footer Strip */}
        <div className="bg-muted/50 border-t border-border px-4 py-3">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            <span className="font-medium">IMP:</span> TrainWell is a health and wellness brand owned and managed by SG Enviro Social Services. All Rights Reserved. TnC Apply.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
