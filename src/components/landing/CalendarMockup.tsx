import { motion } from 'framer-motion';
import { Check, X, Dumbbell, Utensils, Footprints, Palmtree } from 'lucide-react';

type DayStatus = 'completed' | 'skipped' | 'pending' | 'leave' | 'future' | 'empty';

type DayCell = {
  day: number;
  status: DayStatus;
  weekday: number;
  // which activities were logged that day
  activities?: { workout?: boolean; food?: boolean; steps?: boolean };
};

// March 2026 starts on Sunday (weekday 0). "Today" = 23.
const calendarData: DayCell[] = (() => {
  const startDay = 0;
  const daysInMonth = 31;

  const cells: DayCell[] = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    status: 'future',
    weekday: (startDay + i) % 7,
  }));

  const set = (day: number, status: DayStatus, activities?: DayCell['activities']) => {
    cells[day - 1].status = status;
    cells[day - 1].activities = activities;
  };

  // Week 1
  set(1, 'completed', { workout: true, food: true, steps: true });
  set(2, 'completed', { workout: true, food: true });
  set(3, 'completed', { workout: true, food: true, steps: true });
  set(4, 'skipped');
  set(5, 'completed', { workout: true, food: true });
  set(6, 'completed', { workout: true, steps: true });
  set(7, 'leave'); // Sunday holiday
  // Week 2
  set(8, 'completed', { workout: true, food: true, steps: true });
  set(9, 'completed', { food: true, steps: true });
  set(10, 'skipped');
  set(11, 'completed', { workout: true, food: true });
  set(12, 'completed', { workout: true, food: true, steps: true });
  set(13, 'completed', { workout: true, steps: true });
  set(14, 'leave');
  // Week 3
  set(15, 'completed', { workout: true, food: true, steps: true });
  set(16, 'completed', { workout: true, food: true });
  set(17, 'completed', { workout: true, food: true, steps: true });
  set(18, 'completed', { workout: true, food: true });
  set(19, 'skipped');
  set(20, 'completed', { workout: true, steps: true });
  set(21, 'leave');
  // Week 4
  set(22, 'completed', { workout: true, food: true, steps: true });
  set(23, 'pending'); // today

  return cells;
})();

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const cellBgFor = (status: DayStatus) => {
  switch (status) {
    case 'completed': return 'bg-success/15 border-success/40';
    case 'skipped': return 'bg-destructive/15 border-destructive/40';
    case 'pending': return 'border-primary/40';
    case 'leave': return 'bg-muted/40 border-muted';
    case 'future': return 'bg-card/40 border-transparent';
    default: return 'bg-card border-transparent';
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

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
              {d}
            </div>
          ))}

          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {calendarData.map((cell, i) => {
            const isToday = cell.day === todayDate;
            const isFuture = cell.status === 'future';
            const acts = cell.activities;

            return (
              <motion.div
                key={cell.day}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-start p-0.5 text-[11px] font-medium border transition-all ${
                  isToday
                    ? 'bg-primary text-primary-foreground border-primary ring-2 ring-primary/40 ring-offset-1 ring-offset-background'
                    : cellBgFor(cell.status)
                } ${isFuture ? 'text-muted-foreground/50' : 'text-foreground'}`}
                initial={{ opacity: 0, scale: 0.7 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.012, duration: 0.2 }}
              >
                <span className={`leading-none mt-0.5 ${isToday ? 'font-bold' : ''}`}>{cell.day}</span>

                {/* Activity icons row */}
                {!isToday && acts && (
                  <div className="absolute bottom-0.5 left-0 right-0 flex items-center justify-center gap-0.5">
                    {acts.workout && <Dumbbell className="w-2 h-2 text-success" />}
                    {acts.food && <Utensils className="w-2 h-2 text-primary" />}
                    {acts.steps && <Footprints className="w-2 h-2 text-primary" />}
                  </div>
                )}

                {/* Skipped marker */}
                {cell.status === 'skipped' && (
                  <div className="absolute bottom-0.5 rounded-full bg-destructive p-0.5">
                    <X className="w-2 h-2 text-foreground" />
                  </div>
                )}

                {/* Leave marker */}
                {cell.status === 'leave' && (
                  <div className="absolute bottom-0.5">
                    <Palmtree className="w-2.5 h-2.5 text-muted-foreground" />
                  </div>
                )}

                {/* Today marker */}
                {isToday && (
                  <div className="absolute bottom-0.5 flex items-center gap-0.5">
                    <Dumbbell className="w-2 h-2 text-primary-foreground" />
                    <Utensils className="w-2 h-2 text-primary-foreground" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3 px-1">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-success/60 border border-success/40" />
            <span className="text-[10px] text-muted-foreground">Done</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-destructive/60 border border-destructive/40" />
            <span className="text-[10px] text-muted-foreground">Missed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full border border-primary/40" />
            <span className="text-[10px] text-muted-foreground">Today</span>
          </div>
          <div className="flex items-center gap-1">
            <Dumbbell className="w-2.5 h-2.5 text-success" />
            <Utensils className="w-2.5 h-2.5 text-primary" />
            <Footprints className="w-2.5 h-2.5 text-primary" />
            <span className="text-[10px] text-muted-foreground">Workout · Food · Steps</span>
          </div>
          <div className="flex items-center gap-1">
            <Palmtree className="w-2.5 h-2.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Leave / Holiday</span>
          </div>
        </div>

        <p className="mt-2 text-center text-[10px] text-muted-foreground italic">
          Total visibility on why your client is (or isn't) winning.
        </p>
      </div>
    </motion.div>
  );
}
