import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Crown, Sparkles, ChevronDown, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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

// Whitelist of valid Razorpay button IDs - SECURITY: Never use user-controllable values
const VALID_RAZORPAY_BUTTON_IDS = new Set([
  'pl_S6cIGsJyU7Owle', // Monthly plan
  'pl_S6ccDIYhIw1AaB', // Annual plan
]);

const getRazorpayPaymentUrl = (buttonId: string): string | null => {
  if (!VALID_RAZORPAY_BUTTON_IDS.has(buttonId)) {
    console.error('Invalid Razorpay button ID - rejected for security');
    return null;
  }

  return `https://razorpay.com/payment-button/${buttonId}/view`;
};

const plans = [
  {
    id: 'monthly' as const,
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
    id: 'annual' as const,
    name: 'Annual',
    price: 5988,
    originalPrice: 5988,
    period: '/year',
    description: 'Pay for 12 months, get 14 months access',
    badge: 'BEST VALUE',
    razorpayButtonId: 'pl_S6ccDIYhIw1AaB',
    features: [
      'Get 3 months extra validity every time you refer a trainer on annual plan',
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
}: PlanSelectionModalProps) {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [awaitingPayment, setAwaitingPayment] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check if scroll is needed
  const checkScrollHint = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const hasMoreContent = container.scrollHeight > container.clientHeight;
      const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 10;
      setShowScrollHint(hasMoreContent && !isAtBottom);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setSelectedPlan('annual');
      setAwaitingPayment(false);
      setIsProcessing(false);
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [open]);

  // Check scroll hint on open and resize
  useEffect(() => {
    if (open) {
      window.setTimeout(checkScrollHint, 100);
      window.addEventListener('resize', checkScrollHint);
      return () => window.removeEventListener('resize', checkScrollHint);
    }
  }, [open, checkScrollHint]);

  // Poll for subscription activation after payment window opens
  const startPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (5s intervals)
    
    pollingRef.current = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = null;
        setAwaitingPayment(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (!profile) return;

        const { data: sub } = await supabase
          .from('trainer_platform_subscriptions')
          .select('status')
          .eq('trainer_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sub && sub.status === 'active') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          setAwaitingPayment(false);
          toast.success('Payment successful! Your plan is now active.');
          onClose();
          navigate('/home');
        }
      } catch {
        // Silently continue polling
      }
    }, 5000);
  }, [onClose, navigate]);

  const selectedPlanConfig = plans.find((plan) => plan.id === selectedPlan) ?? plans[1];

  const handleProceedToPayment = useCallback(async () => {
    setIsProcessing(true);
    
    try {
      // Step 1: Create pending_payment record in DB so webhook can match it
      await onSelectPlan(selectedPlan);
      
      // Step 2: Open Razorpay payment page
      const paymentUrl = getRazorpayPaymentUrl(selectedPlanConfig.razorpayButtonId);
      if (!paymentUrl) {
        setIsProcessing(false);
        return;
      }

      const paymentWindow = window.open(paymentUrl, '_blank', 'noopener,noreferrer');
      if (!paymentWindow) {
        window.location.assign(paymentUrl);
        return;
      }

      // Step 3: Start polling for subscription activation
      setAwaitingPayment(true);
      setIsProcessing(false);
      startPolling();
      
    } catch (error) {
      console.error('Error creating subscription record:', error);
      toast.error('Failed to initiate payment. Please try again.');
      setIsProcessing(false);
    }
  }, [onSelectPlan, selectedPlan, selectedPlanConfig.razorpayButtonId, startPolling]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && !isProcessing) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        onClose();
      }
    }}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden max-h-[90vh] flex flex-col"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle className="text-xl font-bold">
            {isRenewal ? 'Renew Your Plan' : 'Choose Your Plan'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {awaitingPayment 
              ? 'Complete payment on the Razorpay page. We\'ll activate your plan automatically.'
              : isRenewal 
                ? 'Select a plan to continue your subscription' 
                : 'Start growing your fitness business today'}
          </p>
        </DialogHeader>

        {/* Awaiting Payment State */}
        {awaitingPayment ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center gap-4 min-h-[200px]">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <div className="text-center space-y-2">
              <p className="font-semibold text-foreground">Waiting for payment confirmation...</p>
              <p className="text-sm text-muted-foreground">
                Complete your payment on the Razorpay page. This screen will update automatically once confirmed.
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                if (pollingRef.current) clearInterval(pollingRef.current);
                pollingRef.current = null;
                setAwaitingPayment(false);
              }}
              className="mt-4 text-muted-foreground"
            >
              Cancel waiting
            </Button>
          </div>
        ) : (
          <>
            {/* Scrollable Content */}
            <div 
              ref={scrollContainerRef}
              onScroll={checkScrollHint}
              className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-4"
            >
              {plans.map((plan) => (
                <motion.button
                  key={plan.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPlan(plan.id)}
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

              {/* Razorpay Checkout CTA */}
              <div className="w-full py-2 flex flex-col items-center gap-3">
                <div className="w-full rounded-2xl border border-border bg-secondary/40 p-4 space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Selected plan
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {selectedPlanConfig.name} · ₹{selectedPlanConfig.price.toLocaleString()}
                      <span className="text-muted-foreground font-normal">{selectedPlanConfig.period}</span>
                    </p>
                  </div>

                  <Button 
                    onClick={handleProceedToPayment} 
                    disabled={isProcessing}
                    className="w-full gap-2 min-h-12"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Proceed to Pay
                        <ExternalLink className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground mt-3">
                  Opens Razorpay&apos;s secure payment page. Your plan activates automatically after successful payment.
                </p>
              </div>

              {/* Legal Footer */}
              <div className="bg-muted/50 rounded-lg px-4 py-3">
                <p className="text-sm text-muted-foreground text-center leading-relaxed">
                  <span className="font-medium">IMP:</span> Vecto is a health and wellness brand owned and managed by SG Enviro Social Services. All Rights Reserved. TnC Apply.
                </p>
              </div>
            </div>

            {/* Scroll Hint Indicator */}
            {showScrollHint && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute bottom-0 left-0 right-0 flex justify-center pb-2 pointer-events-none bg-gradient-to-t from-background/90 to-transparent pt-6"
              >
                <motion.div
                  animate={{ y: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                  className="flex flex-col items-center text-muted-foreground"
                >
                  <span className="text-xs mb-1">Scroll for more</span>
                  <ChevronDown className="w-5 h-5" />
                </motion.div>
              </motion.div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
