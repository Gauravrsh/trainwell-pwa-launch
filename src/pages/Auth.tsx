import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type AuthStep = 'phone' | 'otp';

export default function Auth() {
  const navigate = useNavigate();
  const { signInWithOtp, verifyOtp } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<AuthStep>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      toast({
        title: 'Invalid phone number',
        description: 'Please enter a valid phone number',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    const { error } = await signInWithOtp(formattedPhone);
    setLoading(false);

    if (error) {
      toast({
        title: 'Error sending OTP',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'OTP Sent',
      description: 'Check your phone for the verification code',
    });
    setStep('otp');
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter the 6-digit code',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    const { error } = await verifyOtp(formattedPhone, otp);
    setLoading(false);

    if (error) {
      toast({
        title: 'Verification failed',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6"
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M8 16L12 12L16 16L20 12L24 16" stroke="currentColor" className="text-primary" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 20L12 16L16 20L20 16L24 20" stroke="currentColor" className="text-primary" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
            </svg>
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground mb-2">TrainWell</h1>
          <p className="text-muted-foreground">Your fitness journey starts here</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'phone' ? (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-12 h-14 bg-secondary border-border text-lg"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  We'll send you a verification code
                </p>
              </div>

              <Button
                onClick={handleSendOtp}
                disabled={loading || !phone}
                className="w-full h-14 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-foreground mb-1">
                    Enter verification code
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Sent to {phone}
                  </p>
                </div>

                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="w-12 h-14 text-xl bg-secondary border-border" />
                      <InputOTPSlot index={1} className="w-12 h-14 text-xl bg-secondary border-border" />
                      <InputOTPSlot index={2} className="w-12 h-14 text-xl bg-secondary border-border" />
                      <InputOTPSlot index={3} className="w-12 h-14 text-xl bg-secondary border-border" />
                      <InputOTPSlot index={4} className="w-12 h-14 text-xl bg-secondary border-border" />
                      <InputOTPSlot index={5} className="w-12 h-14 text-xl bg-secondary border-border" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <button
                  onClick={() => setStep('phone')}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Change phone number
                </button>
              </div>

              <Button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                className="w-full h-14 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Verify
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full text-sm text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Resend code
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}