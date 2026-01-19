import { motion } from 'framer-motion';
import { Gift, Copy, Share2, Users, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTrainerReferral } from '@/hooks/useTrainerReferral';
import { ReferralTermsAccordion } from '@/components/referral/ReferralTermsAccordion';

export default function Refer() {
  const { toast } = useToast();
  const { stats, loading, getReferralCode, getReferralLink } = useTrainerReferral();
  
  const referralCode = getReferralCode();
  const referralLink = getReferralLink();

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink || referralCode);
    toast({
      title: 'Copied!',
      description: 'Referral link copied to clipboard',
    });
  };

  const handleShare = async () => {
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
      handleCopy();
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
        className="text-center mb-8"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-6"
        >
          <Gift className="w-10 h-10 text-primary" />
        </motion.div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Invite Fellow Trainers
        </h1>
        <p className="text-muted-foreground">
          Grow together and earn validity extensions
        </p>
      </motion.div>

      {/* Referral Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-3xl p-6 mb-6 border border-border"
      >
        <p className="text-sm text-muted-foreground mb-3">Your referral code</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-secondary rounded-xl px-4 py-3">
            <span className="text-xl font-bold text-foreground tracking-wider">
              {referralCode || '------'}
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleCopy}
            disabled={!referralCode}
            className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center disabled:opacity-50"
          >
            <Copy className="w-5 h-5 text-foreground" />
          </motion.button>
        </div>
      </motion.div>

      {/* Share Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          onClick={handleShare}
          disabled={!referralLink}
          className="w-full h-14 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl"
        >
          <Share2 className="w-5 h-5 mr-2" />
          Share Referral Link
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 grid grid-cols-2 gap-4"
      >
        <div className="bg-card rounded-2xl p-4 border border-border">
          <Users className="w-6 h-6 text-primary mb-2" />
          <p className="text-2xl font-bold text-foreground">{stats.totalReferrals}</p>
          <p className="text-sm text-muted-foreground">Trainers Invited</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border">
          <Gift className="w-6 h-6 text-primary mb-2" />
          <p className="text-2xl font-bold text-foreground">{stats.completedReferrals}</p>
          <p className="text-sm text-muted-foreground">Rewards Earned</p>
        </div>
      </motion.div>

      {/* Reward Summary */}
      {stats.totalDaysEarned > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-4 bg-primary/10 rounded-2xl p-4 border border-primary/20"
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total validity earned</p>
              <p className="text-xl font-bold text-primary">+{stats.totalDaysEarned} days</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* How it Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8"
      >
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          How it Works
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
      </motion.div>

      {/* Reward Matrix Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8"
      >
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Reward Matrix
        </h3>
        <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Your Plan → Their Plan</span>
            <span className="text-muted-foreground font-medium">Reward</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between items-center text-sm">
            <span className="text-foreground">Monthly → Monthly</span>
            <span className="text-primary font-semibold">+15 Days</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-foreground">Monthly → Annual</span>
            <span className="text-primary font-semibold">+30 Days</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-foreground">Annual → Monthly</span>
            <span className="text-primary font-semibold">+30 Days</span>
          </div>
          <div className="flex justify-between items-center text-sm bg-primary/5 -mx-4 px-4 py-2 rounded-xl">
            <span className="text-foreground font-medium">Annual → Annual</span>
            <span className="text-primary font-bold">+90 Days ⭐</span>
          </div>
        </div>
      </motion.div>

      {/* Referral Terms */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8"
      >
        <ReferralTermsAccordion />
      </motion.div>
    </div>
  );
}
