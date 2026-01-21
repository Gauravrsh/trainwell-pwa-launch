import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Sparkles, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
    description: 'Pay for 12 months at ₹499/month',
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
  const [isLoading, setIsLoading] = useState(false);

  // Load Razorpay script when modal opens
  useEffect(() => {
    if (open) {
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/payment-button.js"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/payment-button.js';
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, [open]);

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await onSelectPlan(selectedPlan);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {isRenewal ? 'Renew Your Plan' : 'Choose Your Plan'}
            </DialogTitle>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
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

          {/* Razorpay Payment Button */}
          {selectedPlanData?.razorpayButtonId ? (
            <div className="w-full">
              <form className="w-full">
                <script 
                  src="https://checkout.razorpay.com/v1/payment-button.js" 
                  data-payment_button_id={selectedPlanData.razorpayButtonId}
                  async
                />
              </form>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Secure payment via Razorpay
              </p>
            </div>
          ) : (
            <>
              <Button
                onClick={handleConfirm}
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground py-6 text-base font-semibold"
              >
                {isLoading 
                  ? 'Processing...' 
                  : isRenewal 
                  ? 'Renew Now' 
                  : 'Subscribe Now'}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Payment gateway integration coming soon.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
