import { useProfile } from '@/hooks/useProfile';
import { TrainerDashboard } from '@/components/dashboard/TrainerDashboard';
import { ClientDashboard } from '@/components/dashboard/ClientDashboard';
import { InstallPromptModal } from '@/components/modals/InstallPromptModal';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

export default function Home() {
  const { profile, loading, isTrainer } = useProfile();
  const { shouldShow, dismiss, remindLater } = useInstallPrompt(profile?.created_at ?? null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show appropriate dashboard based on role
  if (isTrainer) {
    return (
      <>
        <TrainerDashboard />
        <InstallPromptModal open={shouldShow} onClose={dismiss} onRemindLater={remindLater} />
      </>
    );
  }

  return (
    <>
      <ClientDashboard />
      <InstallPromptModal open={shouldShow} onClose={dismiss} onRemindLater={remindLater} />
    </>
  );
}