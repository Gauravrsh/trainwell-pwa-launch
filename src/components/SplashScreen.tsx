import { motion } from "framer-motion";

interface SplashScreenProps {
  onComplete?: () => void;
}

/**
 * Minimal splash: logo + tagline render immediately. Only the fade-out is animated
 * so we never force the user to watch a scripted entrance before content is ready.
 */
const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onAnimationComplete={onComplete}
    >
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-6xl font-bold text-foreground tracking-tight">
          <span className="text-primary">V</span>ECTO
        </h1>
        <p className="text-lg text-muted-foreground">
          Effort | Direction | Discipline
        </p>
      </div>
    </motion.div>
  );
};

export default SplashScreen;
