import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { sanitizeErrorMessage } from '@/lib/errorUtils';
import { z } from 'zod';


type AuthMode = 'signin' | 'signup' | 'forgot';

const emailSchema = z.string().email('Please enter a valid email');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // Refs are used as a fallback for browser autofill: some Android keyboards and
  // password managers (Samsung Internet, Chrome on Android, 1Password) populate
  // <input> values WITHOUT firing React's onChange, leaving our state empty
  // even though the DOM has the value. Bug TW-013.
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Capture trainer invite param (for clients) and referral param (for trainers)
  useEffect(() => {
    const trainerCode = searchParams.get('trainer');
    const referralCode = searchParams.get('ref');
    
    if (trainerCode) {
      localStorage.setItem('inviteTrainerCode', trainerCode);
      // If coming from client invite, default to signup mode
      setMode('signup');
    }
    
    if (referralCode) {
      localStorage.setItem('referralTrainerCode', referralCode);
      // If coming from trainer referral, default to signup mode
      setMode('signup');
    }
  }, [searchParams]);

  const validateEmail = () => {
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast({
        title: 'Invalid email',
        description: emailResult.error.errors[0].message,
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const validateInputs = () => {
    if (!validateEmail()) return false;

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast({
        title: 'Invalid password',
        description: passwordResult.error.errors[0].message,
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Recover values that browser autofill set without firing onChange (TW-013).
    const domEmail = emailRef.current?.value ?? '';
    const domPassword = passwordRef.current?.value ?? '';
    const effectiveEmail = email || domEmail;
    const effectivePassword = password || domPassword;
    if (domEmail && domEmail !== email) setEmail(domEmail);
    if (domPassword && domPassword !== password) setPassword(domPassword);

    const emailResult = emailSchema.safeParse(effectiveEmail);
    if (!emailResult.success) {
      toast({
        title: 'Invalid email',
        description: emailResult.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    if (mode === 'forgot') {
      setLoading(true);
      const { error } = await resetPassword(effectiveEmail);
      setLoading(false);

      if (error) {
        toast({
          title: 'Error',
          description: sanitizeErrorMessage(error),
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Check your email',
        description: 'We sent you a password reset link.',
      });
      setMode('signin');
      return;
    }

    const passwordResult = passwordSchema.safeParse(effectivePassword);
    if (!passwordResult.success) {
      toast({
        title: 'Invalid password',
        description: passwordResult.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    const { error } = mode === 'signin' 
      ? await signIn(effectiveEmail, effectivePassword)
      : await signUp(effectiveEmail, effectivePassword);
    
    setLoading(false);

    if (error) {
      toast({
        title: mode === 'signin' ? 'Sign in failed' : 'Sign up failed',
        description: sanitizeErrorMessage(error),
        variant: 'destructive',
      });
      return;
    }

    // Both signup (auto-confirmed) and signin navigate directly
    navigate('/');
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setPassword('');
  };

  const getModeContent = () => {
    switch (mode) {
      case 'forgot':
        return {
          title: 'Reset password',
          subtitle: 'Enter your email to receive a reset link',
          buttonText: 'Send Reset Link',
        };
      case 'signup':
        return {
          title: 'Create account',
          subtitle: 'Start your fitness transformation',
          buttonText: 'Create Account',
        };
      default:
        return {
          title: 'Welcome back',
          subtitle: 'Sign in to continue your journey',
          buttonText: 'Sign In',
        };
    }
  };

  const content = getModeContent();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="text-4xl font-bold text-foreground mb-2"
          >
            <span className="text-primary">V</span>ECTO
          </motion.h1>
          <p className="text-muted-foreground">Effort | Direction | Discipline</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: mode === 'signin' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === 'signin' ? 20 : -20 }}
            className="space-y-5"
          >
            {mode === 'forgot' && (
              <button
                onClick={() => setMode('signin')}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </button>
            )}

            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                {content.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {content.subtitle}
              </p>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-14 bg-secondary border-border text-base"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Input - hide for forgot mode */}
            {mode !== 'forgot' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-14 bg-secondary border-border text-base"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Forgot Password Link - show only in signin mode */}
            {mode === 'signin' && (
              <div className="text-right">
                <button
                  onClick={() => setMode('forgot')}
                  className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={loading || !email || (mode !== 'forgot' && !password)}
              className="w-full h-14 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {content.buttonText}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            {/* Toggle Mode - hide for forgot mode */}
            {mode !== 'forgot' && (
              <div className="text-center pt-4">
                <button
                  onClick={toggleMode}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {mode === 'signin' ? (
                    <>
                      Don't have an account?{' '}
                      <span className="text-primary font-medium">Sign up</span>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <span className="text-primary font-medium">Sign in</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}