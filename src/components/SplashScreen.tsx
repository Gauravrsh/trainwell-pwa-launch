import { motion } from "framer-motion";
import logoVecto from "@/assets/logo-vecto.png";

interface SplashScreenProps {
  onComplete?: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      onAnimationComplete={onComplete}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center gap-8"
      >
        <motion.div
          className="w-32 h-32 rounded-2xl overflow-hidden shadow-lg"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
        >
          <img
            src={logoVecto}
            alt="Vecto Logo"
            className="w-full h-full object-cover"
          />
        </motion.div>

        <motion.h1
          className="text-4xl font-bold text-foreground tracking-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <span className="text-primary">V</span>ECTO
        </motion.h1>

        <motion.p
          className="text-lg text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          Effort | Direction | Discipline
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
