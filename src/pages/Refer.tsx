import { motion } from 'framer-motion';
import { Gift, Copy, Share2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function Refer() {
  const { toast } = useToast();
  const referralCode = 'TRAINWELL2024';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    toast({
      title: 'Copied!',
      description: 'Referral code copied to clipboard',
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join TrainWell',
          text: `Use my referral code ${referralCode} to get started on your fitness journey!`,
          url: window.location.origin,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="min-h-screen px-4 pt-12 pb-8">
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
          Invite Friends
        </h1>
        <p className="text-muted-foreground">
          Share TrainWell and earn rewards together
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
              {referralCode}
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleCopy}
            className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center"
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
          className="w-full h-14 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl"
        >
          <Share2 className="w-5 h-5 mr-2" />
          Share with Friends
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
          <p className="text-2xl font-bold text-foreground">0</p>
          <p className="text-sm text-muted-foreground">Friends Invited</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border">
          <Gift className="w-6 h-6 text-primary mb-2" />
          <p className="text-2xl font-bold text-foreground">0</p>
          <p className="text-sm text-muted-foreground">Rewards Earned</p>
        </div>
      </motion.div>

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
            'Share your referral code with friends',
            'They sign up using your code',
            'Both of you get premium features free',
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
    </div>
  );
}