import { useState } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, Banknote, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { TrainingPlanWithClient } from '@/hooks/useTrainingPlans';

interface ManageBillingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: TrainingPlanWithClient;
  onMarkAsPaid: (planId: string, amount: number) => Promise<void>;
  isUpdating: boolean;
}

export function ManageBillingModal({
  open,
  onOpenChange,
  plan,
  onMarkAsPaid,
  isUpdating,
}: ManageBillingModalProps) {
  const [amount, setAmount] = useState('');

  const totalAmount = plan.total_amount || 0;
  const amountPaid = plan.amount_paid || 0;
  const amountDue = totalAmount - amountPaid;

  const handleSubmit = async () => {
    const paymentAmount = parseFloat(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    try {
      await onMarkAsPaid(plan.id, paymentAmount);
      toast.success(`₹${paymentAmount.toLocaleString()} recorded`);
      setAmount('');
      onOpenChange(false);
    } catch {
      toast.error('Failed to record payment');
    }
  };

  const clientName = plan.client?.full_name || `Client #${plan.client?.unique_id || 'Unknown'}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Record Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Client & Plan info */}
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{plan.plan_name}</span>
            {' · '}{clientName}
          </div>

          {/* Billing Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-muted/50 rounded-xl">
              <p className="text-lg font-bold text-foreground">₹{totalAmount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="text-center p-3 bg-success/10 rounded-xl">
              <p className="text-lg font-bold text-success">₹{amountPaid.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Paid</p>
            </div>
            <div className="text-center p-3 bg-destructive/10 rounded-xl">
              <p className="text-lg font-bold text-destructive">₹{Math.max(0, amountDue).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Due</p>
            </div>
          </div>

          {/* Payment Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Payment Amount</label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Enter amount received"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 h-12 bg-secondary border-border"
              />
            </div>
            {amountDue > 0 && (
              <button
                type="button"
                onClick={() => setAmount(amountDue.toString())}
                className="text-xs text-primary hover:underline"
              >
                Fill full due amount (₹{amountDue.toLocaleString()})
              </button>
            )}
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isUpdating || !amount || parseFloat(amount) <= 0}
            className="w-full h-12 gap-2"
          >
            {isUpdating ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                <Banknote className="w-4 h-4" />
              </motion.div>
            ) : (
              <Check className="w-4 h-4" />
            )}
            Mark as Paid
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
