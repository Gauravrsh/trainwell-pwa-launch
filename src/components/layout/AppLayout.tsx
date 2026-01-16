import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { motion } from 'framer-motion';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <motion.main
        className="flex-1 pb-20 safe-top"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.main>
      <BottomNav />
    </div>
  );
};