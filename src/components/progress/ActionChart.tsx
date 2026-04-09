import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { DailyProgress } from '@/hooks/useProgressData';

interface ActionChartProps {
  data: DailyProgress[];
}

export const ActionChart = ({ data }: ActionChartProps) => {
  const chartData = useMemo(() => {
    return data.map((day) => ({
      ...day,
      displayDate: format(parseISO(day.date), 'MMM d'),
      // For stacked bar, we show intake and expenditure separately
      intakeValue: day.intake ?? 0,
      expenditureValue: day.totalExpenditure,
      deficitValue: day.netDeficit,
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    const dayData = payload[0]?.payload;
    
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground mb-2">{label}</p>
        {dayData?.isMissed ? (
          <p className="text-destructive text-sm font-medium">Missed</p>
        ) : (
          <div className="space-y-1 text-sm">
            <p className="text-orange-400">
              Intake: {dayData?.intake ?? 0} kcal
            </p>
            <p className="text-emerald-400">
              Expenditure: {dayData?.totalExpenditure} kcal (BMR: {dayData?.bmr}{dayData?.stepCalories > 0 ? ` + Steps: ${dayData.stepCalories}` : ''})
            </p>
            {dayData?.steps !== null && dayData?.steps !== undefined && (
              <p className="text-blue-400">
                Steps: {dayData.steps.toLocaleString()} (~{dayData.stepCalories} kcal)
              </p>
            )}
            <p className={dayData?.netDeficit >= 0 ? 'text-lime-400' : 'text-amber-500'}>
              Net: {dayData?.netDeficit >= 0 ? 'Deficit' : 'Surplus'} {Math.abs(dayData?.netDeficit)} kcal
            </p>
          </div>
        )}
      </div>
    );
  };

  // Custom bar to show "Missed" label
  const MissedLabel = ({ x, y, width, height, value, payload }: any) => {
    if (!payload?.isMissed) return null;
    
    return (
      <text
        x={x + width / 2}
        y={y + height / 2}
        fill="hsl(var(--destructive))"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={10}
        fontWeight={600}
      >
        Missed
      </text>
    );
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
        >
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
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            label={{
              value: 'Calories',
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
          <ReferenceLine yAxisId="right" y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
          
          {/* Intake bars */}
          <Bar
            yAxisId="left"
            dataKey="intakeValue"
            name="Intake"
            fill="hsl(25, 95%, 60%)"
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isMissed ? 'hsl(0, 72%, 51%)' : 'hsl(25, 95%, 60%)'}
              />
            ))}
          </Bar>
          
          {/* Expenditure bars */}
          <Bar
            yAxisId="left"
            dataKey="expenditureValue"
            name="Total Expenditure"
            fill="hsl(142, 76%, 50%)"
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
            label={<MissedLabel />}
          />
          
          {/* Net deficit line */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="deficitValue"
            name="Net Deficit"
            stroke="hsl(75, 100%, 50%)"
            strokeWidth={2}
            dot={{ fill: 'hsl(75, 100%, 50%)', strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, fill: 'hsl(75, 100%, 50%)' }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
