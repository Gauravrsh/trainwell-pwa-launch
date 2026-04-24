import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dumbbell, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sanitizeErrorMessage, logError } from '@/lib/errorUtils';


const RoleSelection = () => {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'trainer' | 'client' | null>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // TW-020: invited-client auto-link now lives in App.tsx → RoleSelectionRoute.
  // This page is reached only by trainer/non-invited flows, so handlers are
  // always responsive — no in-flight gating that swallows clicks.

  const handleRoleSelectInternal = async (role: 'trainer' | 'client') => {
    if (!user || loading) return;
    
    setLoading(true);
    setSelectedRole(role);

    try {
      // Generate unique ID based on role
      const { data: newId, error: idError } = await supabase
        .rpc('generate_unique_id', { p_role: role });
      
      if (idError) throw idError;

      // Check for trainer invite code (for client signups via invite link)
      const inviteTrainerCode = localStorage.getItem('inviteTrainerCode');
      let trainerId: string | null = null;

      if (role === 'client' && inviteTrainerCode) {
        // Look up the trainer by their unique_id to get trainer_id
        const { data: trainerData } = await supabase
          .rpc('lookup_trainer_by_unique_id', { p_unique_id: inviteTrainerCode });
        
        if (trainerData && trainerData.length > 0) {
          trainerId = trainerData[0].id;
        }
        // TW-011: Do NOT clear inviteTrainerCode here. ProfileSetup is the
        // definitive consume point — clearing now strands users on reload.
      }

      // Check for trainer referral code (for trainer signups)
      const referralTrainerCode = localStorage.getItem('referralTrainerCode');
      let referredByTrainerId: string | null = null;

      if (role === 'trainer' && referralTrainerCode) {
        // Look up the referrer trainer by their unique_id
        const { data: referrerData } = await supabase
          .rpc('lookup_trainer_by_unique_id', { p_unique_id: referralTrainerCode });
        
        if (referrerData && referrerData.length > 0) {
          referredByTrainerId = referrerData[0].id;
        }
        // TW-011: Defer cleanup to ProfileSetup completion.
      }

      // Use upsert to safely create or update profile (prevents duplicates)
      const profilePayload = {
        user_id: user.id,
        role,
        unique_id: newId,
        ...(trainerId && { trainer_id: trainerId }), // Link client to trainer
        ...(referredByTrainerId && { referred_by_trainer_id: referredByTrainerId })
      };

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'user_id' });

      if (upsertError) throw upsertError;

      // If this is a referred trainer, create the referral record
      if (role === 'trainer' && referredByTrainerId) {
        const { data: newProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (newProfile) {
          await supabase
            .from('trainer_referrals')
            .insert({
              referrer_id: referredByTrainerId,
              referee_id: newProfile.id,
              status: 'pending',
            });
        }
      }

      // Store role in localStorage temporarily for profile setup page
      localStorage.setItem('selectedRole', role);
      
      // Navigate to profile setup instead of home
      navigate('/profile-setup');
    } catch (error: unknown) {
      logError('RoleSelection.handleRoleSelect', error);
      
      // Check if this is a foreign key error (user doesn't exist in auth.users)
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as { code?: string })?.code;
      
      if (errorCode === '23503' || errorMessage.includes('foreign key constraint')) {
        // User was deleted - sign them out
        toast({
          title: "Session Expired",
          description: "Please sign in again to continue.",
          variant: "destructive",
        });
        await signOut();
        navigate('/auth');
        return;
      }
      
      toast({
        title: "Error",
        description: sanitizeErrorMessage(error),
        variant: "destructive",
      });
      setSelectedRole(null);
    } finally {
      setLoading(false);
    }
  };

  // Wrapper for manual button clicks
  const handleRoleSelect = (role: 'trainer' | 'client') => {
    if (role === 'client' && !localStorage.getItem('inviteTrainerCode')) {
      toast({
        title: "Incompatible Action",
        description: "Please use the Client Referral Link provided by your trainer to sign up.",
        variant: "destructive",
      });
      return;
    }
    handleRoleSelectInternal(role);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.h1
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-foreground mb-6"
          >
            <span className="text-primary">V</span>ECTO
          </motion.h1>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Choose Your Role
          </h1>
          <p className="text-muted-foreground">
            How will you be using Vecto?
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

        {/* Invite Notice for clients */}
        {localStorage.getItem('inviteTrainerCode') && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-sm text-muted-foreground mt-6"
          >
            🔗 You have a trainer invite. Select "I'm a Client" to connect with your trainer.
          </motion.p>
        )}
        
        {/* Referral Notice for trainers */}
        {localStorage.getItem('referralTrainerCode') && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-sm text-muted-foreground mt-6"
          >
            🔗 You have a referral code. Select "I'm a Trainer" to get started.
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};

export default RoleSelection;
