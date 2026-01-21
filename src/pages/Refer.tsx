import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Copy, Share2, Users, Calendar, Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTrainerReferral } from '@/hooks/useTrainerReferral';
import { useProfile } from '@/hooks/useProfile';
import { ReferralTermsAccordion } from '@/components/referral/ReferralTermsAccordion';

type TabType = 'client' | 'trainer';

export default function Refer() {
  const { toast } = useToast();
  const { profile } = useProfile();
  const { stats, loading, getReferralCode, getReferralLink } = useTrainerReferral();
  const [activeTab, setActiveTab] = useState<TabType>('client');
  
  const referralCode = getReferralCode();
  const referralLink = getReferralLink();

  // For client invites, we use the same trainer code
  const clientInviteLink = profile?.unique_id 
    ? `${window.location.origin}/auth?trainer=${profile.unique_id}`
    : '';

  const handleCopyTrainer = () => {
    navigator.clipboard.writeText(referralLink || referralCode);
    toast({
      title: 'Copied!',
      description: 'Trainer referral link copied to clipboard',
    });
  };

  const handleCopyClient = () => {
    navigator.clipboard.writeText(clientInviteLink || referralCode);
    toast({
      title: 'Copied!',
      description: 'Client invite link copied to clipboard',
    });
  };

  const handleShareTrainer = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join TrainWell as a Trainer',
          text: `Start your fitness training business with TrainWell! Use my referral link to get 14 bonus days on your first subscription.`,
          url: referralLink,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      handleCopyTrainer();
    }
  };

  const handleShareClient = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on TrainWell',
          text: `Track your workouts, nutrition, and progress with me on TrainWell! Use my invite link to get started.`,
          url: clientInviteLink,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      handleCopyClient();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-12 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4"
        >
          {activeTab === 'client' ? (
            <UserPlus className="w-8 h-8 text-primary" />
          ) : (
            <Gift className="w-8 h-8 text-primary" />
          )}
        </motion.div>
        <h1 className="text-2xl font-bold text-foreground mb-1">
          {activeTab === 'client' ? 'Invite Clients' : 'Refer Trainers'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {activeTab === 'client' 
            ? 'Grow your client base with TrainWell' 
            : 'Earn validity extensions by referring trainers'}
        </p>
      </motion.div>

      {/* Tab Switcher */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-2 p-1 bg-secondary rounded-2xl mb-6"
      >
        <button
          onClick={() => setActiveTab('client')}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'client'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <UserPlus className="w-4 h-4 inline-block mr-2" />
          Invite Client
        </button>
        <button
          onClick={() => setActiveTab('trainer')}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'trainer'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Gift className="w-4 h-4 inline-block mr-2" />
          Refer Trainer
        </button>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === 'client' ? (
          <motion.div
            key="client"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Client Stats */}
            <div className="mb-6">
              <div className="bg-card rounded-2xl p-4 border border-border">
                <Users className="w-6 h-6 text-primary mb-2" />
                <p className="text-2xl font-bold text-foreground">--</p>
                <p className="text-sm text-muted-foreground">Clients Invited</p>
              </div>
            </div>

            {/* Share Button */}
            <Button
              onClick={handleShareClient}
              disabled={!clientInviteLink}
              className="w-full h-14 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share Client Invite
            </Button>

            {/* How Client Invite Works */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                How Client Invite Works
              </h3>
              <div className="space-y-3">
                {[
                  'Share your invite link with potential clients',
                  'They sign up using your trainer code',
                  'They get automatically mapped to you',
                  'Start tracking their workouts & nutrition',
                ].map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">{index + 1}</span>
                    </div>
                    <p className="text-sm text-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="trainer"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Trainer Referral Card */}
            <div className="bg-card rounded-3xl p-6 mb-6 border border-border">
              <p className="text-sm text-muted-foreground mb-3">Your referral code</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-secondary rounded-xl px-4 py-3">
                  <span className="text-xl font-bold text-foreground tracking-wider">
                    {referralCode || '------'}
                  </span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCopyTrainer}
                  disabled={!referralCode}
                  className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center disabled:opacity-50"
                >
                  <Copy className="w-5 h-5 text-foreground" />
                </motion.button>
              </div>
            </div>

            {/* Share Button */}
            <Button
              onClick={handleShareTrainer}
              disabled={!referralLink}
              className="w-full h-14 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share Referral Link
            </Button>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="bg-card rounded-2xl p-4 border border-border">
                <Users className="w-6 h-6 text-primary mb-2" />
                <p className="text-2xl font-bold text-foreground">{stats.totalReferrals}</p>
                <p className="text-sm text-muted-foreground">Trainers Invited</p>
              </div>
              <div className="bg-card rounded-2xl p-4 border border-border">
                <Gift className="w-6 h-6 text-primary mb-2" />
                <p className="text-2xl font-bold text-foreground">{stats.completedReferrals}</p>
                <p className="text-sm text-muted-foreground">Rewards Unlocked</p>
              </div>
            </div>

            {/* Reward Summary */}
            {stats.totalDaysEarned > 0 && (
              <div className="mt-4 bg-primary/10 rounded-2xl p-4 border border-primary/20">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total validity earned</p>
                    <p className="text-xl font-bold text-primary">+{stats.totalDaysEarned} days</p>
                  </div>
                </div>
              </div>
            )}

            {/* How Trainer Referral Works */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                How Trainer Referral Works
              </h3>
              <div className="space-y-3">
                {[
                  'Share your referral link with fellow trainers',
                  'They sign up and subscribe to a paid plan',
                  'You earn 15-90 days validity based on plans',
                  'They get 14 bonus days on their first subscription',
                ].map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">{index + 1}</span>
                    </div>
                    <p className="text-sm text-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reward Matrix Preview */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Reward Matrix
              </h3>
              <div className="rounded-2xl overflow-hidden border border-border">
                {/* Table Header */}
                <div className="grid grid-cols-3 bg-secondary/80 text-xs font-semibold text-muted-foreground text-center">
                  <div className="px-3 py-2.5 border-r border-border">Your Plan</div>
                  <div className="px-3 py-2.5 border-r border-border">Their Plan</div>
                  <div className="px-3 py-2.5">Your Reward</div>
                </div>
                {/* Table Body */}
                <div className="divide-y divide-border bg-card">
                  <div className="grid grid-cols-3 text-sm text-center">
                    <div className="px-3 py-3 border-r border-border text-foreground">Monthly</div>
                    <div className="px-3 py-3 border-r border-border text-foreground">Monthly</div>
                    <div className="px-3 py-3 text-primary font-semibold">+15 Days</div>
                  </div>
                  <div className="grid grid-cols-3 text-sm text-center">
                    <div className="px-3 py-3 border-r border-border text-foreground">Monthly</div>
                    <div className="px-3 py-3 border-r border-border text-foreground">Annual</div>
                    <div className="px-3 py-3 text-primary font-semibold">+30 Days</div>
                  </div>
                  <div className="grid grid-cols-3 text-sm text-center">
                    <div className="px-3 py-3 border-r border-border text-foreground">Annual</div>
                    <div className="px-3 py-3 border-r border-border text-foreground">Monthly</div>
                    <div className="px-3 py-3 text-primary font-semibold">+30 Days</div>
                  </div>
                  {/* Elite Trainer Reward Row */}
                  <div className="grid grid-cols-3 text-sm text-center bg-primary/5 border-l-2 border-l-primary">
                    <div className="px-3 py-4 border-r border-border text-foreground font-medium">Annual</div>
                    <div className="px-3 py-4 border-r border-border text-foreground font-medium">Annual</div>
                    <div className="px-3 py-4 flex flex-col items-center gap-1">
                      <span className="text-primary font-bold">+90 Days</span>
                      <span className="text-xs text-primary font-medium">⭐ Elite Trainer Reward</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Referral Terms */}
            <div className="mt-8">
              <ReferralTermsAccordion />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
