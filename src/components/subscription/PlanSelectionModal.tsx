import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Sparkles, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

// Safe DOM clearing function - avoids innerHTML for security
const clearContainer = (element: HTMLElement): void => {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
};

// Inject a Razorpay button script into a container
const injectRazorpayButton = (container: HTMLElement, buttonId: string, onLoad?: () => void) => {
  if (!VALID_RAZORPAY_BUTTON_IDS.has(buttonId)) {
    console.error('Invalid Razorpay button ID - rejected for security');
    return;
  }
  clearContainer(container);
  const form = document.createElement('form');
  form.style.width = '100%';
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/payment-button.js';
  script.setAttribute('data-payment_button_id', buttonId);
  script.async = true;
  if (onLoad) script.onload = onLoad;
  form.appendChild(script);
  container.appendChild(form);
};

export function PlanSelectionModal({
  open,
  onClose,
  onSelectPlan,
  isRenewal,
  currentPlan,
}: PlanSelectionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [isRazorpayActive, setIsRazorpayActive] = useState(false);
  const [buttonsLoaded, setButtonsLoaded] = useState(false);
  const monthlyContainerRef = useRef<HTMLDivElement>(null);
  const annualContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Detect Razorpay checkout popup appearing/disappearing in the DOM
  useEffect(() => {
    if (!open) {
      setIsRazorpayActive(false);
      return;
    }

    const observer = new MutationObserver(() => {
      const razorpayFrame = document.querySelector('.razorpay-container, .razorpay-checkout-frame, iframe[src*="razorpay"]');
      setIsRazorpayActive(!!razorpayFrame);
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [open]);

  // Close/remove the Razorpay popup programmatically
  const handleCancelPayment = useCallback(() => {
    const razorpayElements = document.querySelectorAll(
      '.razorpay-container, .razorpay-checkout-frame, .razorpay-backdrop, iframe[src*="razorpay"]'
    );
    razorpayElements.forEach(el => el.remove());
    setIsRazorpayActive(false);

    // Re-inject the button for the selected plan
    const container = selectedPlan === 'monthly' ? monthlyContainerRef.current : annualContainerRef.current;
    const buttonId = plans.find(p => p.id === selectedPlan)?.razorpayButtonId;
    if (container && buttonId) {
      injectRazorpayButton(container, buttonId);
    }
  }, [selectedPlan]);

  // Check if scroll is needed
  const checkScrollHint = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const hasMoreContent = container.scrollHeight > container.clientHeight;
      const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 10;
      setShowScrollHint(hasMoreContent && !isAtBottom);
    }
  }, []);

  // Preload BOTH Razorpay buttons once when modal opens
  useEffect(() => {
    if (!open) {
      setButtonsLoaded(false);
      return;
    }

    let loadCount = 0;
    const onScriptLoad = () => {
      loadCount++;
      if (loadCount >= 2) {
        setButtonsLoaded(true);
        setTimeout(checkScrollHint, 100);
      }
    };

    // Inject monthly button
    if (monthlyContainerRef.current) {
      const monthlyPlan = plans.find(p => p.id === 'monthly');
      if (monthlyPlan) {
        injectRazorpayButton(monthlyContainerRef.current, monthlyPlan.razorpayButtonId, onScriptLoad);
      }
    }

    // Inject annual button
    if (annualContainerRef.current) {
      const annualPlan = plans.find(p => p.id === 'annual');
      if (annualPlan) {
        injectRazorpayButton(annualContainerRef.current, annualPlan.razorpayButtonId, onScriptLoad);
      }
    }

    return () => {
      if (monthlyContainerRef.current) clearContainer(monthlyContainerRef.current);
      if (annualContainerRef.current) clearContainer(annualContainerRef.current);
    };
  }, [open, checkScrollHint]);

  // Check scroll hint on open and resize
  useEffect(() => {
    if (open) {
      setTimeout(checkScrollHint, 100);
      window.addEventListener('resize', checkScrollHint);
      return () => window.removeEventListener('resize', checkScrollHint);
    }
  }, [open, checkScrollHint]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && isRazorpayActive) return;
      if (!isOpen) onClose();
    }}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden max-h-[90vh] flex flex-col"
        onInteractOutside={(e) => {
          if (isRazorpayActive) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isRazorpayActive) e.preventDefault();
        }}
        onOpenAutoFocus={(e) => {
          // Prevent Dialog from stealing focus — lets Razorpay iframe receive input
          e.preventDefault();
        }}
      >
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle className="text-xl font-bold">
            {isRenewal ? 'Renew Your Plan' : 'Choose Your Plan'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {isRenewal 
              ? 'Select a plan to continue your subscription' 
              : 'Start growing your fitness business today'}
          </p>
        </DialogHeader>

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

          {/* Razorpay Payment Button Containers — both always mounted, CSS toggles visibility */}
          <div className="w-full py-2 flex flex-col items-center">
            <div
              ref={monthlyContainerRef}
              className={`flex justify-center items-center w-full [&_form]:flex [&_form]:justify-center [&_form]:w-full [&_.razorpay-payment-button]:mx-auto ${
                selectedPlan === 'monthly' ? 'block' : 'hidden'
              }`}
            />
            <div
              ref={annualContainerRef}
              className={`flex justify-center items-center w-full [&_form]:flex [&_form]:justify-center [&_form]:w-full [&_.razorpay-payment-button]:mx-auto ${
                selectedPlan === 'annual' ? 'block' : 'hidden'
              }`}
            />
            {isRazorpayActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelPayment}
                className="mt-3 gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Cancel Payment
              </Button>
            )}
            <p className="text-xs text-center text-muted-foreground mt-3">
              Secure payment via Razorpay
            </p>
          </div>

          {/* Legal Footer */}
          <div className="bg-muted/50 rounded-lg px-4 py-3">
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              <span className="font-medium">IMP:</span> TrainWell is a health and wellness brand owned and managed by SG Enviro Social Services. All Rights Reserved. TnC Apply.
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
      </DialogContent>
    </Dialog>
  );
}
