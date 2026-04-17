import { motion } from 'framer-motion';
import { Check, Dumbbell, Palmtree, UserX, CalendarOff } from 'lucide-react';

type DayStatus =
  | 'completed'    // green border only
  | 'pending'      // today, awaiting log
  | 'client_leave' // CL — red border
  | 'trainer_leave'// TL — amber border
  | 'holiday'      // HL — muted border
  | 'empty'        // past day, nothing logged (blank tile)
  | 'future';      // future day, dimmed

// Simulated month — March 2026 (starts Sunday). "Today" = Mar 23.
const calendarData: { day: number; status: DayStatus; weekday: number }[] = (() => {
  const startDay = 0;
  const daysInMonth = 31;

  const statuses: DayStatus[] = [
    // Week 1 (1-7)
    'completed', 'completed', 'completed', 'empty', 'completed', 'completed', 'holiday',
    // Week 2 (8-14)
    'completed', 'completed', 'client_leave', 'completed', 'completed', 'completed', 'completed',
    // Week 3 (15-21)
    'completed', 'completed', 'completed', 'trainer_leave', 'empty', 'completed', 'completed',
    // Week 4 (22-23)
    'completed', 'pending',
    // Future
    'future', 'future', 'future', 'future', 'future', 'future', 'future', 'future',
  ];

  return Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    status: statuses[i] || 'future',
    weekday: (startDay + i) % 7,
  }));
})();

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getCellStyles = (status: DayStatus) => {
  switch (status) {
    case 'completed':
      return { border: 'border-success', icon: <Check className="w-2.5 h-2.5 text-success" /> };
    case 'client_leave':
      return { border: 'border-destructive', icon: <UserX className="w-2.5 h-2.5 text-destructive" /> };
    case 'trainer_leave':
      return { border: 'border-warning', icon: <CalendarOff className="w-2.5 h-2.5 text-warning" /> };
    case 'holiday':
      return { border: 'border-muted-foreground/60', icon: <Palmtree className="w-2.5 h-2.5 text-muted-foreground" /> };
    default:
      return null;
  }
};

export default function CalendarMockup() {
  const todayDate = 23;
  const firstWeekday = calendarData[0]?.weekday ?? 0;

  return (
    <motion.div
      className="mx-auto w-full max-w-sm"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 shadow-2xl">
        {/* Header */}
        <div className="mb-2 flex items-center justify-between px-1">
          <div>
            <p className="text-xs text-muted-foreground">Client: Rahul M.</p>
            <p className="text-lg font-bold text-foreground">March 2026</p>
          </div>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
            85% Compliance
          </span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((d, i) => (
            <div key={i} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
              {d}
            </div>
          ))}

          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {calendarData.map((cell, i) => {
            const isToday = cell.day === todayDate;
            const styles = getCellStyles(cell.status);
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
                      ? `bg-card ${styles.border}`
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

                {styles && !isToday && (
                  <div className="absolute bottom-0.5">
                    {styles.icon}
                  </div>
                )}

                {isToday && cell.status === 'pending' && (
                  <div className="absolute bottom-0.5">
                    <Dumbbell className="w-2.5 h-2.5 text-primary-foreground" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Legend — mirrors real app (boundary-only, marks included) */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3 px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded border-2 border-success" />
            <span className="text-[10px] text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded border-2 border-primary bg-primary/20" />
            <span className="text-[10px] text-muted-foreground">Today / Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded border-2 border-destructive" />
            <span className="text-[10px] text-muted-foreground">Client Leave</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded border-2 border-warning" />
            <span className="text-[10px] text-muted-foreground">Trainer Leave</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded border-2 border-muted-foreground/60" />
            <span className="text-[10px] text-muted-foreground">Holiday</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded border-2 border-transparent bg-card" />
            <span className="text-[10px] text-muted-foreground">Missed (blank)</span>
          </div>
        </div>

        <p className="mt-2 text-center text-[10px] text-muted-foreground italic">
          Total visibility on why your client is (or isn't) winning.
        </p>
      </div>
    </motion.div>
  );
}
