import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, addDays, differenceInDays } from 'date-fns';
import { Calendar as CalendarIcon, Dumbbell, Utensils, IndianRupee, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { CreatePlanData } from '@/hooks/useTrainingPlans';
import type { Database } from '@/integrations/supabase/types';

type ServiceType = Database['public']['Enums']['service_type'];
type BillingModel = Database['public']['Enums']['billing_model'];

interface Client {
  id: string;
  unique_id: string;
  full_name: string | null;
}

interface CreatePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  onSubmit: (data: CreatePlanData) => Promise<void>;
  isSubmitting?: boolean;
  preselectedClientId?: string;
}

export function CreatePlanModal({
  open,
  onOpenChange,
  clients,
  onSubmit,
  isSubmitting = false,
  preselectedClientId,
}: CreatePlanModalProps) {
  const [clientId, setClientId] = useState(preselectedClientId || '');
  const [planName, setPlanName] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('both');
  const [billingModel, setBillingModel] = useState<BillingModel>('prepaid');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 30));
  const [totalSessions, setTotalSessions] = useState(12);
  const [totalAmount, setTotalAmount] = useState(5000);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (preselectedClientId) {
      setClientId(preselectedClientId);
    }
  }, [preselectedClientId]);

  // Calculate plan duration
  const planDuration = differenceInDays(endDate, startDate) + 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId) {
      return;
    }

    await onSubmit({
      clientId,
      planName: planName || `${serviceType === 'both' ? 'Training' : serviceType === 'workout' ? 'Workout' : 'Nutrition'} Plan`,
      serviceType,
      billingModel,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      totalSessions,
      totalAmount,
      notes: notes || undefined,
    });

    // Reset form
    setPlanName('');
    setServiceType('both');
    setBillingModel('prepaid');
    setStartDate(new Date());
    setEndDate(addDays(new Date(), 30));
    setTotalSessions(12);
    setTotalAmount(5000);
    setNotes('');
    if (!preselectedClientId) {
      setClientId('');
    }
    
    onOpenChange(false);
  };

  const selectedClient = clients.find(c => c.id === clientId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            Create Training Plan
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label>Client</Label>
            <Select value={clientId} onValueChange={setClientId} disabled={!!preselectedClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client">
                  {selectedClient && (
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {selectedClient.full_name || `Client #${selectedClient.unique_id}`}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.full_name || `Client #${client.unique_id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Plan Name */}
          <div className="space-y-2">
            <Label>Plan Name (Optional)</Label>
            <Input
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="e.g., Weight Loss Program, Muscle Building"
            />
          </div>

          {/* Service Type */}
          <div className="space-y-2">
            <Label>Service Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'workout', label: 'Workout', icon: Dumbbell, isBoth: false },
                { value: 'nutrition', label: 'Nutrition', icon: Utensils, isBoth: false },
                { value: 'both', label: 'Both', icon: null, isBoth: true },
              ].map(option => (
                <motion.button
                  key={option.value}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setServiceType(option.value as ServiceType)}
                  className={cn(
                    'p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-colors',
                    serviceType === option.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card hover:border-primary/50'
                  )}
                >
                  {option.isBoth ? (
                    <div className="flex items-center gap-1.5">
                      <Dumbbell className="w-5 h-5" />
                      <Utensils className="w-5 h-5" />
                    </div>
                  ) : (
                    <option.icon className="w-5 h-5" />
                  )}
                  <span className="text-xs font-medium">{option.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'MMM d, yyyy') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      if (date) {
                        setStartDate(date);
                        if (date > endDate) {
                          setEndDate(addDays(date, 30));
                        }
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'MMM d, yyyy') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    disabled={(date) => date < startDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Plan Duration: <span className="font-semibold text-foreground">{planDuration} days</span>
          </p>

          {/* Sessions & Pricing */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Total Sessions</Label>
              <Input
                type="number"
                min={1}
                value={totalSessions}
                onChange={(e) => setTotalSessions(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5" />
                Total Amount
              </Label>
              <Input
                type="number"
                min={0}
                step={100}
                value={totalAmount}
                onChange={(e) => setTotalAmount(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Billing Model */}
          <div className="space-y-2">
            <Label>Billing Model</Label>
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setBillingModel('prepaid')}
                className={cn(
                  'p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-colors',
                  billingModel === 'prepaid'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card hover:border-primary/50'
                )}
              >
                <span className="text-sm font-medium">Prepaid</span>
                <span className="text-xs text-muted-foreground">Pay before start</span>
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setBillingModel('postpaid')}
                className={cn(
                  'p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-colors',
                  billingModel === 'postpaid'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card hover:border-primary/50'
                )}
              >
                <span className="text-sm font-medium">Postpaid</span>
                <span className="text-xs text-muted-foreground">Pay after sessions</span>
              </motion.button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details about the plan..."
              rows={3}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!clientId || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
