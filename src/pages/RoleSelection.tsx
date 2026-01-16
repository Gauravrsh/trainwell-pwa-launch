import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dumbbell, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const RoleSelection = () => {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'trainer' | 'client' | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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

      if (role === 'trainer') {
        toast({
          title: "Welcome, Trainer!",
          description: `Your trainer ID is: ${newId}`,
        });
      } else {
        // Client role - check for referral
        const refCode = localStorage.getItem('ref');
        
        if (refCode) {
          // Look up trainer by unique_id using the public view
          const { data: trainer, error: trainerError } = await supabase
            .from('trainers_public')
            .select('id')
            .eq('unique_id', refCode)
            .maybeSingle();

          if (trainerError) throw trainerError;

          if (trainer) {
            // Link client to trainer
            const { error: linkError } = await supabase
              .from('profiles')
              .update({ trainer_id: trainer.id })
              .eq('user_id', user.id);

            if (linkError) throw linkError;

            toast({
              title: "Connected to Trainer!",
              description: "You've been linked to your trainer successfully.",
            });

            localStorage.removeItem('ref');
          } else {
            toast({
              title: "Trainer not found",
              description: "The referral code was invalid. You can connect with a trainer later.",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Welcome!",
            description: "You can connect with a trainer later from your profile.",
          });
        }
      }

      navigate('/');
    } catch (error: any) {
      console.error('Role selection error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to set up your profile. Please try again.",
        variant: "destructive",
      });
      setSelectedRole(null);
    } finally {
      setLoading(false);
    }
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
