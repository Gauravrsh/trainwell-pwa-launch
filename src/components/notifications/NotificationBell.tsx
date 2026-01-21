import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTrainerNotifications } from '@/hooks/useTrainerNotifications';
import { NotificationInbox } from './NotificationInbox';

interface NotificationBellProps {
  onOpenPlanSelection?: () => void;
}

export function NotificationBell({ onOpenPlanSelection }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount } = useTrainerNotifications();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(true)}
      >
        <Bell className="w-5 h-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      <NotificationInbox
        open={isOpen}
        onOpenChange={setIsOpen}
        onOpenPlanSelection={onOpenPlanSelection}
      />
    </>
  );
}
