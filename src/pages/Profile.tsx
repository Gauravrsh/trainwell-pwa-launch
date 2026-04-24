import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, LogOut, ChevronRight, FileText, Weight, AlertTriangle, Activity, UserCog, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';
import { SubscriptionSection } from '@/components/subscription/SubscriptionSection';
import { WeightLogModal } from '@/components/modals/WeightLogModal';
import { BMRLogModal } from '@/components/modals/BMRLogModal';
import { TrainerProfileEditModal } from '@/components/trainer-profile/TrainerProfileEditModal';
import { Button } from '@/components/ui/button';
import { differenceInDays, format } from 'date-fns';

export default function Profile() {
  const { user, signOut } = useAuth();
  const { profile, refetchProfile, isClient, isTrainer } = useProfile();
  const navigate = useNavigate();
  
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [bmrModalOpen, setBmrModalOpen] = useState(false);
  const [trainerProfileOpen, setTrainerProfileOpen] = useState(false);

  // Item 6 — role-aware menu items.
  const menuItems: Array<{ icon: typeof FileText; label: string; onClick: () => void }> = [];
  if (isTrainer) {
    menuItems.push({
      icon: UserCog,
      label: 'Trainer Profile',
      onClick: () => setTrainerProfileOpen(true),
    });
  }
  if (isClient && profile?.trainer_id) {
    menuItems.push({
      icon: Users,
      label: 'My Trainer',
      onClick: () => navigate('/my-trainer'),
    });
  }
  menuItems.push({
    icon: FileText,
    label: 'Terms & Conditions',
    onClick: () => navigate('/terms'),
  });

  // Check if BMR is stale
  const bmrUpdatedAt = profile?.bmr_updated_at ? new Date(profile.bmr_updated_at) : null;
  const isBmrStale = bmrUpdatedAt ? differenceInDays(new Date(), bmrUpdatedAt) > 90 : false;

  const handleSignOut = async () => {
    await signOut();
    // TW-015: replace history entry so back button doesn't re-enter /profile
    // (which would then redirect to /auth, creating a "back is broken" loop).
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen px-4 pt-12 pb-24">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-8"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4"
        >
          <User className="w-12 h-12 text-primary" />
        </motion.div>
        <h1 className="text-xl font-bold text-foreground mb-1">
          {profile?.full_name || user?.email || 'Vecto User'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {profile?.unique_id ? `ID: ${profile.unique_id}` : `Member since ${new Date().getFullYear()}`}
        </p>
      </motion.div>


      {/* Body Metrics Section - Clients only */}
      {isClient && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-3">Body Metrics</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Weight Card */}
            <div className="bg-card rounded-2xl border border-border p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Weight className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Weight</span>
              </div>
              <p className="text-2xl font-bold text-foreground mb-3">
                {profile?.weight_kg ? `${profile.weight_kg} kg` : '—'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeightModalOpen(true)}
                className="mt-auto w-full gap-2"
              >
                <Weight className="w-4 h-4" />
                Log Weight
              </Button>
              {profile?.updated_at && profile?.weight_kg && (
                <p className="text-[10px] text-muted-foreground mt-1 text-center">
                  Updated: {format(new Date(profile.updated_at), 'MMM d')}
                </p>
              )}
            </div>

            {/* BMR Card */}
            <div className="bg-card rounded-2xl border border-border p-4 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">BMR</span>
                </div>
                {isBmrStale && (
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                )}
              </div>
              <p className="text-2xl font-bold text-foreground mb-3">
                {profile?.bmr ? `${profile.bmr}` : '—'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBmrModalOpen(true)}
                className="mt-auto w-full gap-2"
              >
                <Activity className="w-4 h-4" />
                Log BMR
              </Button>
              {bmrUpdatedAt && (
                <p className="text-[10px] text-muted-foreground mt-1 text-center">
                  Updated: {format(bmrUpdatedAt, 'MMM d')}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Subscription Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="mb-6"
      >
        <SubscriptionSection 
          onNavigateToClientPlans={() => navigate('/plans')}
        />
      </motion.div>

      {/* Menu Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="bg-card rounded-2xl border border-border overflow-hidden mb-6"
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.label}
              whileTap={{ scale: 0.98 }}
              onClick={item.onClick}
              className="w-full flex items-center justify-between px-4 py-4 border-b border-border last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground font-medium">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          );
        })}
      </motion.div>

      {/* Sign Out */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
      >
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-4 text-destructive font-medium"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </motion.div>

      {/* Weight Log Modal */}
      <WeightLogModal
        open={weightModalOpen}
        onOpenChange={setWeightModalOpen}
        onSuccess={refetchProfile}
      />

      {/* BMR Log Modal */}
      <BMRLogModal
        open={bmrModalOpen}
        onOpenChange={setBmrModalOpen}
        onSuccess={refetchProfile}
      />

      {/* Trainer Profile editor — trainers only */}
      {isTrainer && (
        <TrainerProfileEditModal
          open={trainerProfileOpen}
          onOpenChange={setTrainerProfileOpen}
          onSaved={refetchProfile}
        />
      )}
    </div>
  );
}
