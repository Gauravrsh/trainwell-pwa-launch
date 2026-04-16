import { motion } from 'framer-motion';
import { format, differenceInDays, isPast } from 'date-fns';
import { 
  Dumbbell, 
  Calendar, 
  IndianRupee, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle,
  MoreVertical,
  Trash2,
  User,
  Banknote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { TrainingPlanWithClient } from '@/hooks/useTrainingPlans';
import type { Database } from '@/integrations/supabase/types';

type TrainingPlanStatus = Database['public']['Enums']['training_plan_status'];

interface PlanCardProps {
  plan: TrainingPlanWithClient;
  onActivate?: (planId: string) => void;
  onPause?: (planId: string) => void;
  onResume?: (planId: string) => void;
  onCancel?: (planId: string) => void;
  onComplete?: (planId: string) => void;
  onDelete?: (planId: string) => void;
  onViewDetails?: (plan: TrainingPlanWithClient) => void;
  onRecordPayment?: (plan: TrainingPlanWithClient) => void;
}

const statusConfig: Record<TrainingPlanStatus, { label: string; color: string; icon: typeof Play }> = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground', icon: Calendar },
  active: { label: 'Active', color: 'bg-success/20 text-success', icon: Play },
  paused: { label: 'Paused', color: 'bg-warning/20 text-warning', icon: Pause },
  completed: { label: 'Completed', color: 'bg-primary/20 text-primary', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/20 text-destructive', icon: XCircle },
};


export function PlanCard({
  plan,
  onActivate,
  onPause,
  onResume,
  onCancel,
  onComplete,
  onDelete,
  onViewDetails,
  onRecordPayment,
}: PlanCardProps) {
  const status = statusConfig[plan.status];
  const StatusIcon = status.icon;
  
  const startDate = new Date(plan.start_date);
  const endDate = new Date(plan.end_date);
  const today = new Date();
  
  const totalDays = differenceInDays(endDate, startDate) + 1;
  const daysElapsed = Math.max(0, differenceInDays(today, startDate));
  const daysRemaining = Math.max(0, differenceInDays(endDate, today));
  const progressPercent = plan.status === 'active' 
    ? Math.min(100, (daysElapsed / totalDays) * 100)
    : plan.status === 'completed' ? 100 : 0;

  const sessionsCompleted = plan.completed_sessions || 0;
  const sessionsMissed = plan.missed_sessions || 0;
  const sessionsRemaining = plan.total_sessions - sessionsCompleted - sessionsMissed;

  const amountPaid = plan.amount_paid || 0;
  const amountDue = plan.amount_due || 0;

  const clientName = plan.client?.full_name || `Client #${plan.client?.unique_id || 'Unknown'}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-4 hover:border-primary/30 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/20">
            <Dumbbell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground line-clamp-1">{plan.plan_name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {clientName}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={cn('text-xs', status.color)}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {plan.status === 'draft' && (
                <>
                  <DropdownMenuItem onClick={() => onActivate?.(plan.id)}>
                    <Play className="w-4 h-4 mr-2" />
                    Activate Plan
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(plan.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Draft
                  </DropdownMenuItem>
                </>
              )}
              {plan.status === 'active' && (
                <>
                  <DropdownMenuItem onClick={() => onRecordPayment?.(plan)}>
                    <Banknote className="w-4 h-4 mr-2" />
                    Record Payment
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onPause?.(plan.id)}>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause Plan
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onComplete?.(plan.id)}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Complete
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onCancel?.(plan.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Plan
                  </DropdownMenuItem>
                </>
              )}
              {plan.status === 'paused' && (
                <>
                  <DropdownMenuItem onClick={() => onRecordPayment?.(plan)}>
                    <Banknote className="w-4 h-4 mr-2" />
                    Record Payment
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onResume?.(plan.id)}>
                    <Play className="w-4 h-4 mr-2" />
                    Resume Plan
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onCancel?.(plan.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Plan
                  </DropdownMenuItem>
                </>
              )}
              {plan.status === 'paused' && (
                <>
                  <DropdownMenuItem onClick={() => onResume?.(plan.id)}>
                    <Play className="w-4 h-4 mr-2" />
                    Resume Plan
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onCancel?.(plan.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Plan
                  </DropdownMenuItem>
                </>
              )}
              {(plan.status === 'completed' || plan.status === 'cancelled') && (
                <DropdownMenuItem 
                  onClick={() => onDelete?.(plan.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Plan
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Date Range */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
        <Calendar className="w-4 h-4" />
        <span>
          {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
        </span>
        {plan.status === 'active' && (
          <span className="ml-auto text-xs">
            {daysRemaining} days left
          </span>
        )}
      </div>

      {/* Progress Bar (for active plans) */}
      {plan.status === 'active' && (
        <div className="mb-3">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center p-2 bg-muted/50 rounded-xl">
          <p className="text-lg font-bold text-foreground">{sessionsCompleted}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
        <div className="text-center p-2 bg-muted/50 rounded-xl">
          <p className="text-lg font-bold text-foreground">{sessionsRemaining}</p>
          <p className="text-xs text-muted-foreground">Remaining</p>
        </div>
        <div className="text-center p-2 bg-muted/50 rounded-xl">
          <p className="text-lg font-bold text-destructive">{sessionsMissed}</p>
          <p className="text-xs text-muted-foreground">Missed</p>
        </div>
      </div>

      {/* Payment Info */}
      <div className="flex items-center justify-between text-sm border-t border-border pt-3">
        <div className="flex items-center gap-1">
          <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">
            {plan.billing_model === 'prepaid' ? 'Prepaid' : 'Postpaid'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-success font-medium">₹{amountPaid.toLocaleString()} paid</span>
          {amountDue > 0 && (
            <span className="text-destructive font-medium">₹{amountDue.toLocaleString()} due</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
