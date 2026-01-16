import { motion } from 'framer-motion';
import { Play, Clock, Flame, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const stats = [
  { icon: Clock, label: 'Minutes', value: '0' },
  { icon: Flame, label: 'Calories', value: '0' },
  { icon: Trophy, label: 'Workouts', value: '0' },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen px-4 pt-12 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <p className="text-muted-foreground text-sm font-medium mb-1">
          Welcome back
        </p>
        <h1 className="text-2xl font-bold text-foreground">
          Ready to train?
        </h1>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3 mb-8"
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="bg-card rounded-2xl p-4 text-center border border-border"
            >
              <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Today's Workout Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl p-6 mb-6 border border-primary/20"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">
              Today's Workout
            </p>
            <h2 className="text-xl font-bold text-foreground">
              Full Body Strength
            </h2>
          </div>
          <div className="bg-primary/20 rounded-xl px-3 py-1">
            <span className="text-sm font-semibold text-primary">30 min</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Build strength and endurance with this full-body routine designed for all fitness levels.
        </p>

        <Button className="w-full h-14 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl">
          <Play className="w-5 h-5 mr-2" />
          Start Workout
        </Button>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Quick Actions
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          {['Browse Workouts', 'Track Progress', 'Set Goals', 'Find Coach'].map((action, index) => (
            <motion.button
              key={action}
              whileTap={{ scale: 0.95 }}
              className="bg-card rounded-2xl p-4 text-left border border-border hover:border-primary/50 transition-colors"
            >
              <span className="text-sm font-medium text-foreground">{action}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}