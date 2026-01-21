import { motion } from 'framer-motion';
import { X, Clock, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import type { TrainerNotification } from '@/hooks/useTrainerNotifications';

interface NotificationCardProps {
  notification: TrainerNotification;
  onCTAClick: () => void;
  onDismiss: () => void;
  onMarkRead: () => void;
}

export function NotificationCard({
  notification,
  onCTAClick,
  onDismiss,
  onMarkRead,
}: NotificationCardProps) {
  const { day_offset, is_read, title, body, cta_text, scheduled_for } = notification;

  // Determine urgency level based on day_offset
  const getUrgencyStyles = () => {
    if (day_offset >= 1) {
      // Grace period (T+1, T+2, T+3) - most urgent
      return {
        border: 'border-destructive/50',
        bg: is_read ? 'bg-card' : 'bg-destructive/5',
        icon: AlertCircle,
        iconColor: 'text-destructive',
      };
    } else if (day_offset === 0) {
      // Expiry day (T)
      return {
        border: 'border-warning/50',
        bg: is_read ? 'bg-card' : 'bg-warning/5',
        icon: AlertTriangle,
        iconColor: 'text-warning',
      };
    } else if (day_offset >= -2) {
      // T-1, T-2 - approaching urgency
      return {
        border: 'border-warning/30',
        bg: is_read ? 'bg-card' : 'bg-warning/5',
        icon: Clock,
        iconColor: 'text-warning',
      };
    } else {
      // T-3 - gentle reminder
      return {
        border: 'border-border',
        bg: is_read ? 'bg-card' : 'bg-primary/5',
        icon: Info,
        iconColor: 'text-primary',
      };
    }
  };

  const urgency = getUrgencyStyles();
  const Icon = urgency.icon;

  const handleCardClick = () => {
    if (!is_read) {
      onMarkRead();
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={handleCardClick}
      className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${urgency.border} ${urgency.bg}`}
    >
      {/* Dismiss Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Unread Indicator */}
      {!is_read && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 left-4 w-2 h-2 bg-primary rounded-full"
        />
      )}

      <div className="flex gap-3 pl-4">
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center ${urgency.iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <h4 className="font-semibold text-foreground text-sm mb-1 line-clamp-1">
            {title}
          </h4>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {body}
          </p>

          <div className="flex items-center justify-between gap-2">
            {cta_text && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onCTAClick();
                }}
                className="h-8 text-xs"
              >
                {cta_text}
              </Button>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {format(parseISO(scheduled_for), 'MMM d')}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
