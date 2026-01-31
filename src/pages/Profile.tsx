import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Settings, Bell, Shield, HelpCircle, LogOut, ChevronRight, FileText, Weight, AlertTriangle, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';
import { SubscriptionSection } from '@/components/subscription/SubscriptionSection';
import { WeightLogModal } from '@/components/modals/WeightLogModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays, format } from 'date-fns';

const menuItems = [
  { icon: Settings, label: 'Settings', href: '#' },
  { icon: Bell, label: 'Notifications', href: '#' },
  { icon: Shield, label: 'Privacy', href: '#' },
  { icon: FileText, label: 'Terms & Conditions', href: '/terms' },
  { icon: HelpCircle, label: 'Help & Support', href: '#' },
];

export default function Profile() {
  const { user, signOut } = useAuth();
  const { profile, refetchProfile, isClient } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [bmrInput, setBmrInput] = useState('');
  
  // Sync BMR input with profile when profile loads
  useEffect(() => {
    if (profile?.bmr) {
      setBmrInput(profile.bmr.toString());
    }
  }, [profile?.bmr]);
  const [savingBmr, setSavingBmr] = useState(false);

  // Check if BMR is stale
  const bmrUpdatedAt = profile?.bmr_updated_at ? new Date(profile.bmr_updated_at) : null;
  const isBmrStale = bmrUpdatedAt ? differenceInDays(new Date(), bmrUpdatedAt) > 90 : false;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleSaveBmr = async () => {
    if (!profile?.id) return;
    
    const bmrValue = parseInt(bmrInput, 10);
    if (isNaN(bmrValue) || bmrValue < 500 || bmrValue > 10000) {
      toast({
        title: 'Invalid BMR',
        description: 'Please enter a BMR between 500 and 10,000 kcal',
        variant: 'destructive',
      });
      return;
    }

    setSavingBmr(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ bmr: bmrValue, bmr_updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: 'BMR updated',
        description: `Your BMR has been set to ${bmrValue} kcal/day`,
      });
      refetchProfile();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update BMR',
        variant: 'destructive',
      });
    } finally {
      setSavingBmr(false);
    }
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
          {profile?.full_name || user?.email || 'TrainWell User'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {profile?.unique_id ? `ID: ${profile.unique_id}` : `Member since ${new Date().getFullYear()}`}
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3 mb-8"
      >
        {[
          { label: 'Workouts', value: '0' },
          { label: 'Streak', value: '0' },
          { label: 'Level', value: '1' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="bg-card rounded-2xl p-4 text-center border border-border"
          >
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
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
              <Input
                id="bmr"
                type="number"
                min={500}
                max={10000}
                placeholder="e.g. 1800"
                value={bmrInput}
                onChange={(e) => setBmrInput(e.target.value)}
                className="mb-2 text-lg font-bold"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveBmr}
                disabled={savingBmr || !bmrInput}
                className="mt-auto w-full gap-2"
              >
                <Activity className="w-4 h-4" />
                {savingBmr ? 'Saving...' : 'Log BMR'}
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
          onNavigateToClientPlans={() => {
            console.log('Navigate to client plans');
          }}
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
          const isClickable = item.href !== '#';
          return (
            <motion.button
              key={item.label}
              whileTap={{ scale: 0.98 }}
              onClick={() => isClickable && navigate(item.href)}
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
    </div>
  );
}
