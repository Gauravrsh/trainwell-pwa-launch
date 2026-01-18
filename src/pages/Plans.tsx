import { useProfile } from '@/hooks/useProfile';
import { PlansList } from '@/components/training-plans';
import { AppLayout } from '@/components/layout/AppLayout';
import { Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const Plans = () => {
  const { profile, loading, isTrainer, isClient } = useProfile();

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background p-4 pt-12 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
          <div className="space-y-4 mt-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  // Only trainers can access this page
  if (isClient) {
    return <Navigate to="/" replace />;
  }

  return (
    <AppLayout>
      <PlansList />
    </AppLayout>
  );
};

export default Plans;
