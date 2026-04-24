import { motion } from 'framer-motion';
import { ArrowLeft, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMyTrainerProfile } from '@/hooks/useMyTrainerProfile';
import { TrainerProfileCard } from '@/components/trainer-profile/TrainerProfileCard';
import { useProfile } from '@/hooks/useProfile';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Item 6 — Client-facing "My Trainer" / "Meet Your Coach" page.
 * Surfaced from /profile menu when the user is a client and has a mapped trainer.
 */
export default function MyTrainer() {
  const navigate = useNavigate();
  const { profile, isClient } = useProfile();
  const { data: trainer, isLoading } = useMyTrainerProfile();

  return (
    <div className="min-h-screen px-4 pt-12 pb-24">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold text-foreground">My Trainer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          The person designing and reviewing your plan.
        </p>
      </motion.div>

      {!isClient && (
        <p className="text-sm text-muted-foreground">This page is for clients.</p>
      )}

      {isClient && !profile?.trainer_id && (
        <div className="bg-card border border-border rounded-2xl p-6 text-center">
          <UserX className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-foreground font-medium">No trainer linked yet.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Use the invite link your trainer sent you to get connected.
          </p>
        </div>
      )}

      {isClient && profile?.trainer_id && isLoading && (
        <Skeleton className="h-64 w-full rounded-2xl" />
      )}

      {isClient && profile?.trainer_id && !isLoading && trainer && (
        <TrainerProfileCard trainer={trainer} />
      )}

      {isClient && profile?.trainer_id && !isLoading && !trainer && (
        <div className="bg-card border border-border rounded-2xl p-6 text-center">
          <p className="text-sm text-muted-foreground">
            We couldn't load your trainer's profile right now.
          </p>
        </div>
      )}
    </div>
  );
}