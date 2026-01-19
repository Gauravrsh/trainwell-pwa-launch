import { motion } from 'framer-motion';
import { User, Settings, Bell, Shield, HelpCircle, LogOut, ChevronRight, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';
import { SubscriptionSection } from '@/components/subscription/SubscriptionSection';

const menuItems = [
  { icon: Settings, label: 'Settings', href: '#' },
  { icon: Bell, label: 'Notifications', href: '#' },
  { icon: Shield, label: 'Privacy', href: '#' },
  { icon: FileText, label: 'Terms & Conditions', href: '/terms' },
  { icon: HelpCircle, label: 'Help & Support', href: '#' },
];

export default function Profile() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen px-4 pt-12 pb-24">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-8"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4"
        >
          <User className="w-12 h-12 text-primary" />
        </motion.div>
        <h1 className="text-xl font-bold text-foreground mb-1">
          {profile?.full_name || user?.email || 'TrainWell User'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {profile?.unique_id ? `ID: ${profile.unique_id}` : `Member since ${new Date().getFullYear()}`}
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3 mb-8"
      >
        {[
          { label: 'Workouts', value: '0' },
          { label: 'Streak', value: '0' },
          { label: 'Level', value: '1' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="bg-card rounded-2xl p-4 text-center border border-border"
          >
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Subscription Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6"
      >
        <SubscriptionSection 
          onNavigateToClientPlans={() => {
            // TODO: Navigate to client plans management page
            console.log('Navigate to client plans');
          }}
        />
      </motion.div>

      {/* Menu Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl border border-border overflow-hidden mb-6"
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isClickable = item.href !== '#';
          return (
            <motion.button
              key={item.label}
              whileTap={{ scale: 0.98 }}
              onClick={() => isClickable && navigate(item.href)}
              className="w-full flex items-center justify-between px-4 py-4 border-b border-border last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground font-medium">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          );
        })}
      </motion.div>

      {/* Sign Out */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-4 text-destructive font-medium"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </motion.div>
    </div>
  );
}
