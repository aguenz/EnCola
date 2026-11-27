import React, {useEffect} from 'react';
import {motion} from 'motion/react';
import {AnimatedTransitBackground} from './AnimatedTransitBackground';
import {EnColaLogo} from './EnColaLogo';

interface SplashIntroProps {
  onComplete: () => void;
  durationMs?: number;
}

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const SplashIntro: React.FC<SplashIntroProps> = ({
  onComplete,
  durationMs = 3600,
}) => {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, durationMs);
    return () => window.clearTimeout(timer);
  }, [onComplete, durationMs]);

  return (
    <motion.div
      role="presentation"
      onClick={onComplete}
      initial={{opacity: 1}}
      animate={{opacity: 1}}
      exit={{opacity: 0, scale: 1.04, filter: 'blur(6px)'}}
      transition={{duration: 0.55, ease: EASE}}
      className="fixed inset-0 z-[1400] bg-[#0C1017] flex flex-col items-center justify-center px-6 overflow-hidden cursor-pointer select-none"
    >
      {/* Animated Transit Routes & Aurora Background */}
      <AnimatedTransitBackground variant="splash" />

      {/* Subtle Ambient Radial Glow */}
      <motion.div
        aria-hidden="true"
        initial={{opacity: 0, scale: 0.75}}
        animate={{opacity: [0, 0.75, 0.55], scale: [0.75, 1.08, 1]}}
        transition={{duration: 1.8, ease: EASE}}
        className="pointer-events-none absolute w-[320px] h-[320px] rounded-full bg-gradient-to-tr from-emerald-500/20 via-cyan-500/15 to-amber-400/15 blur-3xl"
      />

      {/* Centered Large Animated Logo + Wordmark */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{scale: 0.82, opacity: 0, y: 8}}
          animate={{scale: 1, opacity: 1, y: 0}}
          transition={{duration: 0.55, ease: EASE}}
        >
          <EnColaLogo size={118} />
        </motion.div>

        <motion.h1
          initial={{opacity: 0, y: 14}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.5, delay: 0.42, ease: EASE}}
          className="mt-6 font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-none"
        >
          En<span className="text-emerald-400">Cola</span>
        </motion.h1>

        <motion.p
          initial={{opacity: 0, y: 8}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.45, delay: 0.68, ease: EASE}}
          className="mt-2.5 text-xs sm:text-sm text-slate-400 tracking-wide"
        >
          Camioneticas · Metro · Metrobús
        </motion.p>

        {/* Minimalist Tempo Line */}
        <div className="mt-8 w-28 h-[2px] rounded-full bg-white/[0.08] overflow-hidden">
          <motion.div
            initial={{scaleX: 0}}
            animate={{scaleX: 1}}
            transition={{duration: (durationMs - 250) / 1000, ease: 'easeInOut'}}
            style={{transformOrigin: 'left'}}
            className="h-full w-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400"
          />
        </div>
      </div>
    </motion.div>
  );
};
