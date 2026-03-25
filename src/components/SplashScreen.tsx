import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [phase, setPhase] = useState<'welcome' | 'project' | 'done'>('welcome');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('project'), 2500);
    const t2 = setTimeout(() => setPhase('done'), 5000);
    const t3 = setTimeout(() => onComplete(), 5500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sidebar overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-sidebar-foreground" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-4"
            >
              <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--sidebar-primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19l7-7 3 3-7 7-3-3z" />
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                  <path d="M2 2l7.586 7.586" />
                  <circle cx="11" cy="11" r="2" />
                </svg>
              </div>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-sidebar-foreground tracking-tight">
              Welcome to
            </h1>
            <h2 className="text-3xl md:text-4xl font-bold text-sidebar-primary mt-2">
              Smart Drawing Machine
            </h2>
          </motion.div>
        )}

        {phase === 'project' && (
          <motion.div
            key="project"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center px-4"
          >
            <p className="text-xl md:text-2xl text-sidebar-foreground font-medium">
              A Mini Project by
            </p>
            <p className="text-2xl md:text-3xl font-bold text-sidebar-primary mt-3">
              EAL Lab
            </p>
            <p className="text-lg text-sidebar-foreground/70 mt-2">
              Embedded Automation Lab — Batch 6
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip button */}
      <button
        onClick={onComplete}
        className="absolute bottom-8 text-sidebar-foreground/40 hover:text-sidebar-foreground/70 text-sm transition-colors"
      >
        Skip →
      </button>
    </div>
  );
};
