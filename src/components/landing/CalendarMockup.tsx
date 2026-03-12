import { motion } from 'framer-motion';
import { Check, X, Dumbbell } from 'lucide-react';

type DayStatus = 'completed' | 'skipped' | 'pending' | 'empty' | 'future';

// Simulated month data — a realistic client calendar for March 2026
const calendarData: { day: number; status: DayStatus; weekday: number }[] = (() => {
  // March 2026 starts on Sunday (weekday 0)
  const startDay = 0; // Sunday
  const daysInMonth = 31;
  const todayDate = 23; // Simulate "today" as March 23

  const statuses: DayStatus[] = [
    // Week 1 (1-7): Strong start
    'completed', 'completed', 'completed', 'skipped', 'completed', 'completed', 'completed',
    // Week 2 (8-14): One slip
    'completed', 'completed', 'skipped', 'completed', 'completed', 'completed', 'completed',
    // Week 3 (15-21): Mostly on track
    'completed', 'completed', 'completed', 'completed', 'skipped', 'completed', 'completed',
    // Week 4 (22-23): current
    'completed', 'pending',
    // Rest are future
    'future', 'future', 'future', 'future', 'future', 'future', 'future', 'future',
  ];

  return Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    status: statuses[i] || 'future',
    weekday: (startDay + i) % 7,
  }));
})();

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getStatusStyles = (status: DayStatus) => {
  switch (status) {
    case 'completed':
      return {
        icon: <Check className="w-2.5 h-2.5" />,
        dotBg: 'bg-success',
        dotText: 'text-foreground',
        cellBg: 'bg-success/20 border-success/40',
      };
    case 'skipped':
      return {
        icon: <X className="w-2.5 h-2.5" />,
        dotBg: 'bg-destructive',
        dotText: 'text-foreground',
        cellBg: 'bg-destructive/20 border-destructive/40',
      };
    case 'pending':
      return {
        icon: <Dumbbell className="w-2 h-2" />,
        dotBg: 'bg-primary/80',
        dotText: 'text-primary-foreground',
        cellBg: 'border-primary/30',
      };
    default:
      return null;
  }
};

export default function CalendarMockup() {
  const todayDate = 23;

  // Calculate leading empty cells for the first week
  const firstWeekday = calendarData[0]?.weekday ?? 0;

  return (
    <motion.div
      className="mx-auto w-full max-w-sm"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* Outer card mimicking the app's calendar section */}
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 shadow-2xl">
        {/* Month header */}
        <div className="mb-2 flex items-center justify-between px-1">
          <div>
            <p className="text-xs text-muted-foreground">Client: Rahul M.</p>
            <p className="text-lg font-bold text-foreground">March 2026</p>
          </div>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
            85% Compliance
          </span>
        </div>

        {/* 7-col grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Weekday headers */}
          {weekDays.map((d, i) => (
            <div key={i} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
              {d}
            </div>
          ))}

          {/* Leading empty cells */}
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Day cells */}
          {calendarData.map((cell, i) => {
            const isToday = cell.day === todayDate;
            const styles = getStatusStyles(cell.status);
            const isFuture = cell.status === 'future';

            return (
              <motion.div
                key={cell.day}
                className={`
                  relative aspect-square rounded-xl flex flex-col items-center justify-center
                  text-[11px] font-medium border-2 transition-all
                  ${isToday
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background border-primary'
                    : styles
                      ? styles.cellBg
                      : isFuture
                        ? 'bg-card/50 text-muted-foreground/50 border-transparent'
                        : 'bg-card text-foreground border-transparent'
                  }
                `}
                initial={{ opacity: 0, scale: 0.7 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.012, duration: 0.2 }}
              >
                <span className={isToday ? 'font-bold' : ''}>{cell.day}</span>

                {/* Status icon at bottom — matches real app */}
                {styles && !isToday && (
                  <div className={`absolute bottom-0.5 rounded-full p-0.5 ${styles.dotBg} ${styles.dotText}`}>
                    {styles.icon}
                  </div>
                )}

                {/* Today's workout indicator */}
                {isToday && cell.status === 'pending' && (
                  <div className="absolute bottom-0.5">
                    <Dumbbell className="w-2.5 h-2.5 text-primary-foreground" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Legend — matches real app */}
        <div className="flex flex-wrap gap-3 mt-3 px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-success flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-foreground" />
            </div>
            <span className="text-[10px] text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-destructive flex items-center justify-center">
              <X className="w-2.5 h-2.5 text-foreground" />
            </div>
            <span className="text-[10px] text-muted-foreground">Missed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-primary/80 flex items-center justify-center">
              <Dumbbell className="w-2 h-2 text-primary-foreground" />
            </div>
            <span className="text-[10px] text-muted-foreground">Pending</span>
          </div>
        </div>

        {/* Caption */}
        <p className="mt-2 text-center text-[10px] text-muted-foreground italic">
          Total visibility on why your client is (or isn't) winning.
        </p>
      </div>
    </motion.div>
  );
}
