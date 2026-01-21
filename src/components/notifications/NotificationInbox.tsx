import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, CheckCheck } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTrainerNotifications } from '@/hooks/useTrainerNotifications';
import { NotificationCard } from './NotificationCard';

interface NotificationInboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenPlanSelection?: () => void;
}

export function NotificationInbox({
  open,
  onOpenChange,
  onOpenPlanSelection,
}: NotificationInboxProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  } = useTrainerNotifications();

  const handleCTAClick = (action: string | null, notificationId: string) => {
    markAsRead(notificationId);
    
    if (action === 'open_plan_selection' && onOpenPlanSelection) {
      onOpenChange(false);
      onOpenPlanSelection();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-destructive text-destructive-foreground text-xs font-semibold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead()}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4 py-2">
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-3 py-2">
              <AnimatePresence mode="popLayout">
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <NotificationCard
                      notification={notification}
                      onCTAClick={() => handleCTAClick(notification.cta_action, notification.id)}
                      onDismiss={() => dismissNotification(notification.id)}
                      onMarkRead={() => markAsRead(notification.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">All caught up!</h3>
              <p className="text-sm text-muted-foreground">
                No new notifications at the moment
              </p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
