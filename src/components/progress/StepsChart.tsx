import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { Progress } from '@/components/ui/progress';
import { DailyProgress } from '@/hooks/useProgressData';
import { format, parseISO } from 'date-fns';

const STEP_TARGET = 10000;

interface StepsChartProps {
  data: DailyProgress[];
}

export function StepsChart({ data }: StepsChartProps) {
  const chartData = useMemo(() =>
    data.map(d => ({
      date: d.date,
      label: format(parseISO(d.date), 'dd MMM'),
      steps: d.steps ?? 0,
      hasData: d.steps !== null,
    })),
    [data]
  );

  const hasAnySteps = data.some(d => d.steps !== null);

  const dayCount = data.length;
  const avgSteps = useMemo(() => {
    if (dayCount === 0) return 0;
    const total = data.reduce((sum, d) => sum + (d.steps ?? 0), 0);
    return Math.round(total / dayCount);
  }, [data, dayCount]);

  const progressPercent = Math.min((avgSteps / STEP_TARGET) * 100, 100);
  const estimatedKm = (avgSteps * 0.0008).toFixed(1);
  const estimatedKcal = Math.round(avgSteps * 0.04);

  return (
    <div className="space-y-4">
      {/* Latest day summary */}
      {hasAnySteps && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-foreground">
                {avgSteps.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                Avg steps per day, in last {dayCount} {dayCount === 1 ? 'day' : 'days'}
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <span>Goal: {STEP_TARGET.toLocaleString()}</span>
            </div>
          </div>

          {/* Progress bar */}
          <Progress
            value={progressPercent}
            className="h-2 bg-muted"
          />

          {/* Derived metrics */}
          <div className="flex items-center justify-around text-center">
            <div>
              <p className="text-lg font-semibold text-foreground">{estimatedKm}</p>
              <p className="text-xs text-muted-foreground">km</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <p className="text-lg font-semibold text-foreground">{estimatedKcal}</p>
              <p className="text-xs text-muted-foreground">kcal</p>
            </div>
          </div>
        </>
      )}

      {/* Bar chart - always shown with axes */}
      <div className="h-56 relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              domain={hasAnySteps ? ['auto', 'auto'] : [0, 12000]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
                fontSize: '12px',
              }}
              formatter={(value: number) => [value.toLocaleString(), 'Steps']}
              labelFormatter={(label) => label}
            />
            <ReferenceLine
              y={STEP_TARGET}
              stroke="hsl(142, 71%, 45%)"
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{
                value: '10k',
                position: 'right',
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 10,
              }}
            />
            <Bar
              dataKey="steps"
              radius={[3, 3, 0, 0]}
              fill="hsl(142, 71%, 45%)"
              fillOpacity={0.85}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Prompt when no data - overlaid on chart */}
        {!hasAnySteps && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-muted-foreground bg-card/80 px-3 py-1.5 rounded-md">
              Start logging your daily steps to see trends here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
