import { useState, useEffect } from 'react';
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

  // Capture trainer invite param and store in localStorage
  useEffect(() => {
    const trainerCode = searchParams.get('trainer');
    if (trainerCode) {
      localStorage.setItem('inviteTrainerCode', trainerCode);
      // If coming from invite, default to signup mode
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

  const handleSubmit = async () => {
    if (mode === 'forgot') {
      if (!validateEmail()) return;
      
      setLoading(true);
      const { error } = await resetPassword(email);
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

    if (!validateInputs()) return;

    setLoading(true);
    
    const { error } = mode === 'signin' 
      ? await signIn(email, password)
      : await signUp(email, password);
    
    setLoading(false);

    if (error) {
      toast({
        title: mode === 'signin' ? 'Sign in failed' : 'Sign up failed',
        description: sanitizeErrorMessage(error),
        variant: 'destructive',
      });
      return;
    }

    if (mode === 'signup') {
      toast({
        title: 'Account created!',
        description: 'You can now sign in with your credentials.',
      });
      setMode('signin');
    } else {
      navigate('/');
    }
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