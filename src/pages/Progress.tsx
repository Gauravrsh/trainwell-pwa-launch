import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, BarChart3, Scale, Footprints } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfile } from '@/hooks/useProfile';
import { useProgressData } from '@/hooks/useProgressData';
import { ActionChart, OutcomeChart, DateRangeFilter, ClientSelector, StepsChart } from '@/components/progress';
import { differenceInDays } from 'date-fns';

export default function Progress() {
  const { profile, isTrainer } = useProfile();
  const [dateRange, setDateRange] = useState(30);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    isTrainer ? null : profile?.id || null
  );

  // For trainers, use selected client; for clients, use own profile
  const targetClientId = isTrainer ? selectedClientId : profile?.id || null;
  
  const { data, loading, error } = useProgressData(targetClientId, dateRange);

  // Check if BMR is stale (>90 days old)
  const bmrUpdatedAt = profile?.bmr_updated_at ? new Date(profile.bmr_updated_at) : null;
  const isBmrStale = bmrUpdatedAt ? differenceInDays(new Date(), bmrUpdatedAt) > 90 : !profile?.bmr;

  // Calculate summary stats
  const stats = {
    avgDeficit: data.length > 0
      ? Math.round(data.reduce((sum, d) => sum + d.netDeficit, 0) / data.length)
      : 0,
    missedDays: data.filter(d => d.isMissed).length,
    loggedDays: data.filter(d => !d.isMissed).length,
    weightChange: (() => {
      const weights = data.filter(d => d.weight !== null).map(d => d.weight as number);
      if (weights.length < 2) return null;
      return (weights[weights.length - 1] - weights[0]).toFixed(1);
    })(),
  };

  return (
    <div className="min-h-screen px-4 pt-6 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          Progress
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track your consistency and results
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center gap-4 mb-6"
      >
        {isTrainer && (
          <ClientSelector
            value={selectedClientId}
            onChange={setSelectedClientId}
          />
        )}
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </motion.div>

      {/* BMR Warning */}
      {isBmrStale && !isTrainer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">BMR may be outdated</p>
            <p className="text-xs text-muted-foreground">
              Consider updating your BMR in Profile for more accurate calculations
            </p>
          </div>
        </motion.div>
      )}

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
      >
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {stats.avgDeficit >= 0 ? '+' : ''}{stats.avgDeficit}
            </p>
            <p className="text-xs text-muted-foreground">Avg Daily Deficit</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.loggedDays}</p>
            <p className="text-xs text-muted-foreground">Days Logged</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{stats.missedDays}</p>
            <p className="text-xs text-muted-foreground">Days Missed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {stats.weightChange !== null
                ? `${parseFloat(stats.weightChange) > 0 ? '+' : ''}${stats.weightChange} kg`
                : '—'}
            </p>
            <p className="text-xs text-muted-foreground">Weight Change</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Action: Intake vs Expenditure
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            {loading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                Failed to load data
              </div>
            ) : data.length === 0 ? (
              <div className="h-80 flex flex-col items-center justify-center text-muted-foreground">
                <BarChart3 className="w-12 h-12 mb-2 opacity-50" />
                <p>No data available</p>
                <p className="text-sm">Start logging your meals and workouts</p>
              </div>
            ) : (
              <ActionChart data={data} />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Steps Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="mb-6"
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Footprints className="w-4 h-4 text-emerald-500" />
              Steps
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Failed to load data
              </div>
            ) : (
              <StepsChart data={data} />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Outcome Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              Outcome: Weight Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            {loading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                Failed to load data
              </div>
            ) : data.length === 0 ? (
              <div className="h-80 flex flex-col items-center justify-center text-muted-foreground">
                <Scale className="w-12 h-12 mb-2 opacity-50" />
                <p>No weight data</p>
                <p className="text-sm">Log your weight in Profile to track progress</p>
              </div>
            ) : (
              <OutcomeChart data={data} />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
