import { motion } from 'framer-motion';

type DayStatus = 'green' | 'red' | 'pending' | 'empty' | 'future';

const calendarData: { day: number; status: DayStatus }[] = [
  // Week 1 (Mon-Sun)
  { day: 1, status: 'green' }, { day: 2, status: 'green' }, { day: 3, status: 'red' },
  { day: 4, status: 'green' }, { day: 5, status: 'green' }, { day: 6, status: 'green' },
  { day: 7, status: 'red' },
  // Week 2
  { day: 8, status: 'green' }, { day: 9, status: 'green' }, { day: 10, status: 'green' },
  { day: 11, status: 'green' }, { day: 12, status: 'red' }, { day: 13, status: 'green' },
  { day: 14, status: 'green' },
  // Week 3
  { day: 15, status: 'green' }, { day: 16, status: 'green' }, { day: 17, status: 'green' },
  { day: 18, status: 'red' }, { day: 19, status: 'green' }, { day: 20, status: 'green' },
  { day: 21, status: 'green' },
  // Week 4
  { day: 22, status: 'green' }, { day: 23, status: 'pending' }, { day: 24, status: 'pending' },
  { day: 25, status: 'future' }, { day: 26, status: 'future' }, { day: 27, status: 'future' },
  { day: 28, status: 'future' },
  // Remaining
  { day: 29, status: 'future' }, { day: 30, status: 'future' }, { day: 31, status: 'future' },
];

const statusColors: Record<DayStatus, string> = {
  green: 'bg-success',
  red: 'bg-destructive',
  pending: 'bg-warning',
  empty: 'bg-secondary',
  future: 'bg-secondary/40',
};

const statusLabels: Record<string, { color: string; label: string }> = {
  green: { color: 'bg-success', label: 'Logged' },
  red: { color: 'bg-destructive', label: 'Missed' },
  pending: { color: 'bg-warning', label: 'Pending' },
};

const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function CalendarMockup() {
  return (
    <motion.div
      className="mx-auto w-full max-w-sm rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-2xl"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Client: Rahul M.</p>
          <p className="text-sm font-bold text-foreground">March 2026</p>
        </div>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
          85% Compliance
        </span>
      </div>

      {/* Weekday headers */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {weekDays.map((d, i) => (
          <span key={i} className="text-center text-[10px] font-medium text-muted-foreground">{d}</span>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarData.map((cell, i) => (
          <motion.div
            key={cell.day}
            className={`flex aspect-square items-center justify-center rounded-md text-[11px] font-semibold ${statusColors[cell.status]} ${
              cell.status === 'green' || cell.status === 'red' || cell.status === 'pending'
                ? 'text-foreground'
                : 'text-muted-foreground'
            }`}
            initial={{ opacity: 0, scale: 0.7 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.015, duration: 0.25 }}
          >
            {cell.day}
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-4">
        {Object.entries(statusLabels).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${val.color}`} />
            <span className="text-[10px] text-muted-foreground">{val.label}</span>
          </div>
        ))}
      </div>

      {/* Caption */}
      <p className="mt-3 text-center text-[10px] text-muted-foreground italic">
        Total visibility on why your client is (or isn't) winning.
      </p>
    </motion.div>
  );
}
