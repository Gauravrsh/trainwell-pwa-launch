import { useState } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, Copy, Check, QrCode, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface PaymentRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  clientId: string;
  trainerVpa?: string;
}

export const PaymentRequestModal = ({ 
  open, 
  onOpenChange, 
  clientName,
  clientId,
  trainerVpa = ''
}: PaymentRequestModalProps) => {
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const generateUPILink = () => {
    if (!trainerVpa || !amount) return '';
    const note = encodeURIComponent(`Training fee for ${clientName}`);
    return `upi://pay?pa=${trainerVpa}&pn=Trainer&am=${amount}&cu=INR&tn=${note}`;
  };

  const handleCopyLink = async () => {
    const link = generateUPILink();
    if (link) {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Payment link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendRequest = () => {
    if (!amount) {
      toast.error('Please enter an amount');
      return;
    }
    
    // In production, this would send the payment request to the client
    toast.success(`Payment request of ₹${amount} sent to ${clientName}`);
    onOpenChange(false);
    setAmount('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-primary" />
            Request Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Client Info */}
          <div className="p-4 rounded-xl bg-secondary/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Requesting from</p>
            <p className="font-semibold text-foreground">{clientName}</p>
            <p className="text-xs text-muted-foreground">ID: {clientId}</p>
          </div>

          {/* Amount Input */}
          <div>
            <Label htmlFor="amount" className="text-xs text-muted-foreground">
              Amount (₹)
            </Label>
            <div className="relative mt-1">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9 text-lg font-semibold"
              />
            </div>
          </div>

          {/* VPA Display */}
          {trainerVpa ? (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
              <p className="text-xs text-muted-foreground mb-1">Your UPI ID</p>
              <p className="font-mono text-sm text-foreground">{trainerVpa}</p>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
              <p className="text-xs text-warning">
                Please add your UPI ID in profile settings to enable payment requests
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button 
              className="w-full h-12 rounded-xl"
              onClick={handleSendRequest}
              disabled={!amount || !trainerVpa}
            >
              <IndianRupee className="w-4 h-4 mr-2" />
              Send Payment Request
            </Button>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleCopyLink}
                disabled={!amount || !trainerVpa}
              >
                {copied ? (
                  <Check className="w-4 h-4 mr-2 text-success" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                Copy UPI Link
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowQR(!showQR)}
                disabled={!amount || !trainerVpa}
              >
                <QrCode className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* QR Code Placeholder */}
          {showQR && amount && trainerVpa && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex flex-col items-center p-4 rounded-xl bg-white"
            >
              <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                <QrCode className="w-16 h-16 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Scan to pay ₹{amount}
              </p>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
