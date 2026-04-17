import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Crown, Sparkles, ChevronDown, ExternalLink, Loader2, Zap } from 'lucide-react';
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
  'pl_S6cIGsJyU7Owle', // Pro / Monthly plan (₹999/month)
  'pl_S6ccDIYhIw1AaB', // Elite / Annual plan (₹9,999/year)
]);

const getRazorpayPaymentUrl = (buttonId: string): string | null => {
  if (!VALID_RAZORPAY_BUTTON_IDS.has(buttonId)) {
    console.error('Invalid Razorpay button ID - rejected for security');
    return null;
  }
  return `https://razorpay.com/payment-button/${buttonId}/view`;
};

const paidPlans = [
  {
    id: 'monthly' as const,
    name: 'Pro',
    price: 999,
    period: '/month',
    description: '30 days + 3-day grace · Unlimited clients',
    razorpayButtonId: 'pl_S6cIGsJyU7Owle',
    features: [
      'Unlimited active clients',
      'All features unlocked',
      'UPI & card payments',
      'Cancel anytime',
    ],
  },
  {
    id: 'annual' as const,
    name: 'Elite',
    price: 9999,
    period: '/year',
    description: '12 + 2 bonus months (425 days) · Unlimited clients',
    badge: 'BEST VALUE',
    razorpayButtonId: 'pl_S6ccDIYhIw1AaB',
    features: [
      'Everything in Pro',
      '14 months for the price of 12',
      'Referral rewards (annual)',
      'Priority support',
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

  useEffect(() => {
    if (open) {
      window.setTimeout(checkScrollHint, 100);
      window.addEventListener('resize', checkScrollHint);
      return () => window.removeEventListener('resize', checkScrollHint);
    }
  }, [open, checkScrollHint]);

  const startPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    let attempts = 0;
    const maxAttempts = 60;

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

  const selectedPlanConfig = paidPlans.find((plan) => plan.id === selectedPlan) ?? paidPlans[1];

  const handleProceedToPayment = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await onSelectPlan(selectedPlan);
      const paymentUrl = getRazorpayPaymentUrl(selectedPlanConfig.razorpayButtonId);
      if (!paymentUrl) {
        setIsProcessing(false);
        return;
      }

      const paymentWindow = window.open(paymentUrl, '_blank', 'noopener,noreferrer');
      if (!paymentWindow) {
        toast.error('Pop-up blocked. Please allow pop-ups for this site and try again.');
        setIsProcessing(false);
        return;
      }

      setAwaitingPayment(true);
      startPolling();
      // Re-enable button after 2s in case the user cancels checkout and retries
      window.setTimeout(() => setIsProcessing(false), 2000);
    } catch (error) {
      console.error('Error creating subscription record:', error);
      toast.error('Failed to initiate payment. Please try again.');
      setIsProcessing(false);
    }
  }, [isProcessing, onSelectPlan, selectedPlan, selectedPlanConfig.razorpayButtonId, startPolling]);

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
        onOpenAutoFocus={(e) => { e.preventDefault(); }}
      >
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle className="text-xl font-bold">
            {isRenewal ? 'Upgrade Your Plan' : 'Choose Your Plan'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {awaitingPayment
              ? 'Complete payment on the Razorpay page. We\'ll activate your plan automatically.'
              : isRenewal
                ? 'Unlock unlimited clients and stay ahead'
                : 'Free forever or unlock unlimited clients'}
          </p>
        </DialogHeader>

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
            <div
              ref={scrollContainerRef}
              onScroll={checkScrollHint}
              className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-4"
            >
              {/* Beta Pricing Pill */}
              <div className="flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 mb-2">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">Special Beta Pricing</span>
              </div>

              {/* Free / Smart Plan card (informational) */}
              <div className="w-full p-4 rounded-2xl border-2 border-dashed border-border bg-muted/30 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-muted-foreground" />
                  <span className="font-semibold text-foreground">Smart (Free)</span>
                  <span className="px-2 py-0.5 bg-success/20 text-success text-xs font-bold rounded">CURRENT</span>
                </div>
                <div className="mb-2">
                  <span className="text-2xl font-bold text-foreground">₹0</span>
                  <span className="text-muted-foreground"> forever</span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Up to 3 active clients · All features unlocked</p>
                <p className="text-xs text-muted-foreground">Upgrade below to remove the 3-client cap.</p>
              </div>

              {paidPlans.map((plan) => (
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

              <div className="bg-muted/50 rounded-lg px-4 py-3">
                <p className="text-sm text-muted-foreground text-center leading-relaxed">
                  <span className="font-medium">IMP:</span> Vecto is a health and wellness brand owned and managed by SG Enviro Social Services. All Rights Reserved. TnC Apply.
                </p>
              </div>
            </div>

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
