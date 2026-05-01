import { motion } from 'framer-motion';

// Boundary-only states matching the live Calendar page legend.
type DayStatus =
  | 'logged'         // green border — workout/food/steps logged
  | 'client_leave'   // red border — client missed/leave
  | 'trainer_leave'  // amber border — trainer leave
  | 'holiday'        // muted border — holiday
  | 'today'          // filled lime — today
  | 'future'         // empty future tile
  | 'past_blank';    // past day with no log (boundary calendar shows blank)

type DayCell = { day: number; status: DayStatus; weekday: number };

// March 2026 starts on Sunday (weekday 0). "Today" = 23.
const calendarData: DayCell[] = (() => {
  const startDay = 0;
  const daysInMonth = 31;
  const cells: DayCell[] = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    status: 'future',
    weekday: (startDay + i) % 7,
  }));
  const set = (day: number, status: DayStatus) => { cells[day - 1].status = status; };

  // Mostly logged streak with a few exceptions.
  // Week 1
  set(1, 'logged'); set(2, 'logged'); set(3, 'logged');
  set(4, 'client_leave'); set(5, 'logged'); set(6, 'logged');
  set(7, 'holiday');
  // Week 2
  set(8, 'logged'); set(9, 'logged'); set(10, 'trainer_leave');
  set(11, 'logged'); set(12, 'logged'); set(13, 'logged');
  set(14, 'holiday');
  // Week 3
  set(15, 'logged'); set(16, 'logged'); set(17, 'logged');
  set(18, 'logged'); set(19, 'client_leave'); set(20, 'logged');
  set(21, 'holiday');
  // Week 4
  set(22, 'logged');
  set(23, 'today');
  return cells;
})();

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const cellClassFor = (status: DayStatus, isToday: boolean) => {
  if (isToday) {
    return 'bg-primary border-2 border-primary text-primary-foreground font-bold';
  }
  switch (status) {
    case 'logged':        return 'border-2 border-success text-foreground';
    case 'client_leave':  return 'border-2 border-destructive text-foreground';
    case 'trainer_leave': return 'border-2 border-warning text-foreground';
    case 'holiday':       return 'border-2 border-muted-foreground/60 text-foreground';
    case 'future':        return 'border border-transparent bg-card/40 text-muted-foreground/60';
    case 'past_blank':    return 'border border-transparent bg-card/40 text-foreground';
    default:              return 'border border-transparent';
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
            return (
              <motion.div
                key={cell.day}
                className={`aspect-square rounded-xl flex items-center justify-center text-[11px] transition-all ${cellClassFor(cell.status, isToday)}`}
                initial={{ opacity: 0, scale: 0.7 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.012, duration: 0.2 }}
              >
                <span className="leading-none">{cell.day}</span>
              </motion.div>
            );
          })}
        </div>

        {/* Legend — matches live Calendar page (boundary swatches only) */}
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3 px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-md bg-primary border-2 border-primary" />
            <span className="text-[10px] text-muted-foreground">Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-md bg-transparent border-2 border-success" />
            <span className="text-[10px] text-muted-foreground">Logged</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-md bg-transparent border-2 border-muted-foreground/60" />
            <span className="text-[10px] text-muted-foreground">Holiday</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-md bg-transparent border-2 border-warning" />
            <span className="text-[10px] text-muted-foreground">Trainer Leave</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-md bg-transparent border-2 border-destructive" />
            <span className="text-[10px] text-muted-foreground">Client Leave</span>
          </div>
        </div>

        <p className="mt-2 text-center text-[10px] text-muted-foreground italic">
          Total visibility on why your client is (or isn't) winning.
        </p>
      </div>
    </motion.div>
  );
}
