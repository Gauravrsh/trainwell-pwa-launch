import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { DailyProgress } from '@/hooks/useProgressData';

interface OutcomeChartProps {
  data: DailyProgress[];
}

export const OutcomeChart = ({ data }: OutcomeChartProps) => {
  const chartData = useMemo(() => {
    // Filter and map data, keeping weight as-is (null when not logged)
    // The line will connect existing entries only
    return data.map((day) => ({
      ...day,
      displayDate: format(parseISO(day.date), 'MMM d'),
      weightValue: day.weight,
      deficitValue: day.netDeficit,
    }));
  }, [data]);

  // Calculate weight domain for better visualization
  const weightDomain = useMemo(() => {
    const weights = chartData
      .filter((d) => d.weightValue !== null)
      .map((d) => d.weightValue as number);
    
    if (weights.length === 0) return [0, 100];
    
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const padding = (max - min) * 0.1 || 5;
    
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    const dayData = payload[0]?.payload;
    
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          {dayData?.weightValue !== null ? (
            <p className="text-sky-400">
              Weight: {dayData.weightValue} kg
            </p>
          ) : (
            <p className="text-muted-foreground italic">
              No weight logged
            </p>
          )}
          <p className={dayData?.netDeficit >= 0 ? 'text-lime-400' : 'text-amber-500'}>
            Net: {dayData?.netDeficit >= 0 ? 'Deficit' : 'Surplus'} {Math.abs(dayData?.netDeficit || 0)} kcal
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
        >
          <defs>
            <linearGradient id="deficitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(75, 100%, 50%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(75, 100%, 50%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="displayDate"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="left"
            domain={weightDomain}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            label={{
              value: 'Weight (kg)',
              angle: -90,
              position: 'insideLeft',
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 12,
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            label={{
              value: 'Net Deficit',
              angle: 90,
              position: 'insideRight',
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 12,
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: 10 }}
            formatter={(value) => (
              <span className="text-foreground text-sm">{value}</span>
            )}
          />
          
          {/* Zero reference line for deficit */}
          <ReferenceLine yAxisId="right" y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
          
          {/* Deficit area - shows surplus zone below 0 */}
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="deficitValue"
            name="Net Deficit"
            stroke="hsl(75, 100%, 50%)"
            strokeWidth={2}
            fill="url(#deficitGradient)"
            connectNulls
          />
          
          {/* Weight line - connects only existing entries */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="weightValue"
            name="Weight"
            stroke="hsl(200, 98%, 60%)"
            strokeWidth={3}
            dot={{ fill: 'hsl(200, 98%, 60%)', strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, fill: 'hsl(200, 98%, 60%)' }}
            connectNulls // This connects dots between existing entries
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
