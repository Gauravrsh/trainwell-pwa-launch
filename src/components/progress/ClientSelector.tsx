import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users } from 'lucide-react';
import { logError } from '@/lib/errorUtils';

interface Client {
  id: string;
  full_name: string | null;
  unique_id: string;
}

interface ClientSelectorProps {
  value: string | null;
  onChange: (clientId: string) => void;
}

export const ClientSelector = ({ value, onChange }: ClientSelectorProps) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase.rpc('get_trainer_clients');
        
        if (error) throw error;
        
        setClients(data || []);
        
        // Auto-select first client if none selected
        if (!value && data && data.length > 0) {
          onChange(data[0].id);
        }
      } catch (err) {
        logError('ClientSelector.fetchClients', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  if (loading) {
    return (
      <div className="h-10 w-48 bg-secondary/50 rounded-md animate-pulse" />
    );
  }

  if (clients.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Users className="w-4 h-4" />
        No clients found
      </div>
    );
  }

  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="w-56">
        <Users className="w-4 h-4 mr-2 text-muted-foreground" />
        <SelectValue placeholder="Select client" />
      </SelectTrigger>
      <SelectContent>
        {clients.map((client) => (
          <SelectItem key={client.id} value={client.id}>
            {client.full_name || `Client #${client.unique_id}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
