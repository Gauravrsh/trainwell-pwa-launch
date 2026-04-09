import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { Footprints } from 'lucide-react';
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

  const latestLogged = useMemo(() => {
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].steps !== null) return data[i];
    }
    return null;
  }, [data]);

  const latestSteps = latestLogged?.steps ?? 0;
  const progressPercent = Math.min((latestSteps / STEP_TARGET) * 100, 100);
  const estimatedKm = (latestSteps * 0.0008).toFixed(1);
  const estimatedKcal = Math.round(latestSteps * 0.04);

  if (!data.some(d => d.steps !== null)) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
        <Footprints className="w-12 h-12 mb-2 opacity-50" />
        <p>No steps data</p>
        <p className="text-sm">Start logging your daily steps</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Latest day summary */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold text-foreground">
            {latestSteps.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            {latestLogged ? format(parseISO(latestLogged.date), 'dd MMM yyyy') : '—'}
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

      {/* Bar chart */}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
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
      </div>
    </div>
  );
}
