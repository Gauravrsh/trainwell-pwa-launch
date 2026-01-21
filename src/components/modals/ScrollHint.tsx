import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface ScrollHintProps {
  visible: boolean;
  onClick?: () => void;
}

export const ScrollHint = ({ visible, onClick }: ScrollHintProps) => {
  if (!visible) return null;

  return (
    <motion.button
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      onClick={onClick}
      className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 px-4 py-2 rounded-full bg-primary/20 border border-primary/40 backdrop-blur-sm"
      aria-label="Scroll down for analysis results"
    >
      <span className="text-xs font-medium text-primary">See analysis below</span>
      <motion.div
        animate={{ y: [0, 4, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="w-4 h-4 text-primary" />
      </motion.div>
    </motion.button>
  );
};
