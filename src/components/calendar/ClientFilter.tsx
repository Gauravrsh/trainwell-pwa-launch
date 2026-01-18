import { useState } from 'react';
import { ChevronDown, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Client {
  id: string;
  unique_id: string;
  full_name?: string | null;
}

interface ClientFilterProps {
  clients: Client[];
  selectedClientId: string | null;
  onSelectClient: (clientId: string | null) => void;
}

export const ClientFilter = ({
  clients,
  selectedClientId,
  onSelectClient,
}: ClientFilterProps) => {
  const selectedClient = clients.find(c => c.id === selectedClientId);
  
  const getClientDisplayName = (client: Client) => {
    return client.full_name || `Client #${client.unique_id}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between h-11 bg-card border-border"
        >
          <div className="flex items-center gap-2">
            {selectedClient ? (
              <>
                <User className="w-4 h-4 text-primary" />
                <span className="truncate">{getClientDisplayName(selectedClient)}</span>
              </>
            ) : (
              <>
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Select a client</span>
              </>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-[var(--radix-dropdown-menu-trigger-width)] bg-popover border-border z-50"
      >
        {clients.length === 0 ? (
          <div className="px-4 py-3 text-sm text-muted-foreground text-center">
            No clients yet
          </div>
        ) : (
          clients.map((client) => (
            <DropdownMenuItem
              key={client.id}
              onClick={() => onSelectClient(client.id)}
              className={`flex items-center gap-2 cursor-pointer ${
                selectedClientId === client.id ? 'bg-primary/10 text-primary' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-xs font-semibold">
                  {client.full_name?.charAt(0)?.toUpperCase() || client.unique_id.slice(0, 2)}
                </span>
              </div>
              <span>{getClientDisplayName(client)}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
