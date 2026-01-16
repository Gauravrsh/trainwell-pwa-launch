import { useProfile } from '@/hooks/useProfile';
import { TrainerDashboard } from '@/components/dashboard/TrainerDashboard';
import { ClientDashboard } from '@/components/dashboard/ClientDashboard';

export default function Home() {
  const { profile, loading, isTrainer } = useProfile();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show appropriate dashboard based on role
  if (isTrainer) {
    return <TrainerDashboard />;
  }

  return <ClientDashboard />;
}