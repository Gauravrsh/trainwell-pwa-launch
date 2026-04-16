import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { logError } from '@/lib/errorUtils';
import type { Database } from '@/integrations/supabase/types';

type TrainingPlan = Database['public']['Tables']['client_training_plans']['Row'];
type TrainingPlanInsert = Database['public']['Tables']['client_training_plans']['Insert'];
type TrainingPlanUpdate = Database['public']['Tables']['client_training_plans']['Update'];
type BillingModel = Database['public']['Enums']['billing_model'];
type ServiceType = Database['public']['Enums']['service_type'];
type TrainingPlanStatus = Database['public']['Enums']['training_plan_status'];

export interface TrainingPlanWithClient extends TrainingPlan {
  client?: {
    id: string;
    unique_id: string;
    full_name: string | null;
  };
}

export interface CreatePlanData {
  clientId: string;
  planName: string;
  serviceType: ServiceType;
  billingModel: BillingModel;
  startDate: string;
  endDate: string;
  totalSessions: number;
  totalAmount: number;
  notes?: string;
}

export function useTrainingPlans() {
  const { profile, isTrainer } = useProfile();
  const queryClient = useQueryClient();

  // Fetch all training plans for the trainer
  const { data: plans = [], isLoading, error, refetch } = useQuery({
    queryKey: ['training-plans', profile?.id],
    queryFn: async () => {
      if (!profile || !isTrainer) return [];

      const { data, error } = await supabase
        .from('client_training_plans')
        .select('*')
        .eq('trainer_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch client info for each plan
      const clientIds = [...new Set(data.map(p => p.client_id))];
      const { data: clients } = await supabase.rpc('get_trainer_clients');

      const clientMap = new Map(
        (clients || []).map(c => [c.id, c])
      );

      return data.map(plan => ({
        ...plan,
        client: clientMap.get(plan.client_id) || undefined,
      })) as TrainingPlanWithClient[];
    },
    enabled: !!profile && isTrainer,
  });

  // Fetch plans for a specific client
  const getClientPlans = useCallback(async (clientId: string) => {
    const { data, error } = await supabase
      .from('client_training_plans')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as TrainingPlan[];
  }, []);

  // Create a new training plan
  const createPlanMutation = useMutation({
    mutationFn: async (planData: CreatePlanData) => {
      if (!profile) throw new Error('Profile not found');

      const insertData: TrainingPlanInsert = {
        trainer_id: profile.id,
        client_id: planData.clientId,
        plan_name: planData.planName,
        service_type: planData.serviceType,
        billing_model: planData.billingModel,
        start_date: planData.startDate,
        end_date: planData.endDate,
        total_sessions: planData.totalSessions,
        total_amount: planData.totalAmount,
        amount_paid: 0,
        notes: planData.notes || null,
        status: 'draft',
      };

      const { data, error } = await supabase
        .from('client_training_plans')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as TrainingPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
      toast.success('Training plan created successfully!');
    },
    onError: (error) => {
      logError('useTrainingPlans.create', error);
      toast.error('Failed to create training plan');
    },
  });

  // Update a training plan
  const updatePlanMutation = useMutation({
    mutationFn: async ({ planId, updates }: { planId: string; updates: TrainingPlanUpdate }) => {
      const { data, error } = await supabase
        .from('client_training_plans')
        .update(updates)
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;
      return data as TrainingPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
      toast.success('Training plan updated!');
    },
    onError: (error) => {
      logError('useTrainingPlans.update', error);
      toast.error('Failed to update training plan');
    },
  });

  // Activate a draft plan
  const activatePlan = useCallback(async (planId: string) => {
    return updatePlanMutation.mutateAsync({
      planId,
      updates: { status: 'active' },
    });
  }, [updatePlanMutation]);

  // Pause a plan
  const pausePlan = useCallback(async (planId: string) => {
    return updatePlanMutation.mutateAsync({
      planId,
      updates: { status: 'paused' },
    });
  }, [updatePlanMutation]);

  // Resume a paused plan
  const resumePlan = useCallback(async (planId: string) => {
    return updatePlanMutation.mutateAsync({
      planId,
      updates: { status: 'active' },
    });
  }, [updatePlanMutation]);

  // Cancel a plan
  const cancelPlan = useCallback(async (planId: string) => {
    return updatePlanMutation.mutateAsync({
      planId,
      updates: { 
        status: 'cancelled',
        termination_date: new Date().toISOString().split('T')[0],
        terminated_by: profile?.full_name || 'Trainer',
      },
    });
  }, [updatePlanMutation, profile]);

  // Complete a plan
  const completePlan = useCallback(async (planId: string) => {
    return updatePlanMutation.mutateAsync({
      planId,
      updates: { status: 'completed' },
    });
  }, [updatePlanMutation]);

  // Delete a draft plan
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from('client_training_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
      toast.success('Training plan deleted!');
    },
    onError: (error) => {
      logError('useTrainingPlans.delete', error);
      toast.error('Failed to delete training plan');
    },
  });

  // Filter plans by status
  const activePlans = plans.filter(p => p.status === 'active');
  const draftPlans = plans.filter(p => p.status === 'draft');
  const completedPlans = plans.filter(p => ['completed', 'cancelled'].includes(p.status));
  const pausedPlans = plans.filter(p => p.status === 'paused');

  // Mark payment as received (increment amount_paid)
  const markAsPaid = useCallback(async (planId: string, amount: number) => {
    // Get current plan to calculate new amount_paid
    const plan = plans.find(p => p.id === planId);
    if (!plan) throw new Error('Plan not found');
    
    const currentPaid = plan.amount_paid || 0;
    const newPaid = currentPaid + amount;
    
    return updatePlanMutation.mutateAsync({
      planId,
      updates: { amount_paid: newPaid },
    });
  }, [plans, updatePlanMutation]);

  return {
    plans,
    activePlans,
    draftPlans,
    completedPlans,
    pausedPlans,
    isLoading,
    error,
    refetch,
    createPlan: createPlanMutation.mutateAsync,
    updatePlan: updatePlanMutation.mutateAsync,
    deletePlan: deletePlanMutation.mutateAsync,
    activatePlan,
    pausePlan,
    resumePlan,
    cancelPlan,
    completePlan,
    markAsPaid,
    getClientPlans,
    isCreating: createPlanMutation.isPending,
    isUpdating: updatePlanMutation.isPending,
    isDeleting: deletePlanMutation.isPending,
  };
}
