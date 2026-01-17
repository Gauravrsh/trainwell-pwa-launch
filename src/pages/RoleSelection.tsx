import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dumbbell, Users, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sanitizeErrorMessage, logError } from '@/lib/errorUtils';

const RoleSelection = () => {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'trainer' | 'client' | null>(null);
  const [autoProcessing, setAutoProcessing] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user came from trainer invite - auto-assign client role
  useEffect(() => {
    const inviteTrainerCode = localStorage.getItem('inviteTrainerCode');
    if (inviteTrainerCode && user && !loading && !autoProcessing) {
      setAutoProcessing(true);
      // Auto-select client role for invited users
      handleRoleSelect('client');
    }
  }, [user]);

  const handleRoleSelect = async (role: 'trainer' | 'client') => {
    if (!user || loading) return;
    
    setLoading(true);
    setSelectedRole(role);

    try {
      // Generate unique ID based on role
      const { data: newId, error: idError } = await supabase
        .rpc('generate_unique_id', { p_role: role });
      
      if (idError) throw idError;

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            role,
            unique_id: newId 
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        // Insert new profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ 
            user_id: user.id,
            role,
            unique_id: newId 
          });

        if (insertError) throw insertError;
      }

      // Store role in localStorage temporarily for profile setup page
      localStorage.setItem('selectedRole', role);
      
      // Navigate to profile setup instead of home
      navigate('/profile-setup');
    } catch (error: unknown) {
      logError('RoleSelection.handleRoleSelect', error);
      toast({
        title: "Error",
        description: sanitizeErrorMessage(error),
        variant: "destructive",
      });
      setSelectedRole(null);
      setAutoProcessing(false);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state when auto-processing invited client
  if (autoProcessing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">
            Setting up your account...
          </h1>
          <p className="text-muted-foreground">
            You're being connected to your trainer
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6"
          >
            <Dumbbell className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Choose Your Role
          </h1>
          <p className="text-muted-foreground">
            How will you be using TrainWell?
          </p>
        </div>

        {/* Role Tiles */}
        <div className="space-y-4">
          {/* Trainer Tile */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => handleRoleSelect('trainer')}
            disabled={loading}
            className={`w-full p-6 rounded-2xl border-2 transition-all duration-200 text-left group ${
              selectedRole === 'trainer'
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:border-primary/50 hover:bg-card/80'
            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
                selectedRole === 'trainer' 
                  ? 'bg-primary' 
                  : 'bg-secondary group-hover:bg-primary/20'
              }`}>
                <Dumbbell className={`w-7 h-7 ${
                  selectedRole === 'trainer' 
                    ? 'text-primary-foreground' 
                    : 'text-foreground group-hover:text-primary'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  I'm a Trainer
                </h3>
                <p className="text-sm text-muted-foreground">
                  Create workout plans, track client progress, and manage subscriptions
                </p>
              </div>
              {loading && selectedRole === 'trainer' && (
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </motion.button>

          {/* Client Tile */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => handleRoleSelect('client')}
            disabled={loading}
            className={`w-full p-6 rounded-2xl border-2 transition-all duration-200 text-left group ${
              selectedRole === 'client'
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:border-primary/50 hover:bg-card/80'
            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
                selectedRole === 'client' 
                  ? 'bg-primary' 
                  : 'bg-secondary group-hover:bg-primary/20'
              }`}>
                <Users className={`w-7 h-7 ${
                  selectedRole === 'client' 
                    ? 'text-primary-foreground' 
                    : 'text-foreground group-hover:text-primary'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  I'm a Client
                </h3>
                <p className="text-sm text-muted-foreground">
                  Follow workout plans, log meals, and track your fitness journey
                </p>
              </div>
              {loading && selectedRole === 'client' && (
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </motion.button>
        </div>

        {/* Referral Notice */}
        {localStorage.getItem('ref') && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-sm text-muted-foreground mt-6"
          >
            🔗 You have a trainer referral code. Select "I'm a Client" to connect.
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};

export default RoleSelection;
