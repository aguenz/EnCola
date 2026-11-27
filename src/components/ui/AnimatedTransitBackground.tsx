import React, {useId} from 'react';
import {motion} from 'motion/react';

interface AnimatedTransitBackgroundProps {
  variant?: 'splash' | 'auth' | 'surface';
}

/**
 * Subtle, technological animated background inspired by live Caracas transit corridors:
 * - Soft drifting emerald / cyan / amber aurora glows
 * - Ultra-fine radial-masked coordinate grid
 * - Delicate curved transit routes with gliding light pulses
 */
export const AnimatedTransitBackground: React.FC<
  AnimatedTransitBackgroundProps
> = ({variant = 'auth'}) => {
  const uid = useId().replace(/:/g, '');
  const lineGrad1 = `bg-route-1-${uid}`;
  const lineGrad2 = `bg-route-2-${uid}`;
  const lineGrad3 = `bg-route-3-${uid}`;

  const isSurface = variant === 'surface';
  const isSplash = variant === 'splash';
  const isAuth = variant === 'auth';

  // For auth, frame transit curves gracefully along the top & bottom margins
  // so they never slice behind the headline or form copy.
  const topTrackPath = isAuth
    ? 'M -40 86 C 140 36, 310 124, 490 64 C 555 44, 605 26, 650 42'
    : 'M -40 190 C 140 130, 260 310, 440 240 C 520 210, 580 150, 650 175';

  const bottomTrackPath = isAuth
    ? 'M -40 818 C 150 762, 300 868, 480 784 C 550 752, 600 728, 650 744'
    : 'M -40 650 C 160 590, 290 730, 470 610 C 540 565, 590 520, 650 540';

  const diagonalTrackPath =
    'M 90 -30 C 140 210, 40 430, 220 620 C 330 740, 470 790, 560 930';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none absolute inset-0 overflow-hidden"
    >
      {/* Ultra-fine Coordinate Grid masked softly toward edges */}
      <div
        className="absolute inset-0"
        style={{
          opacity: isSurface ? 0.04 : isAuth ? 0.055 : 0.075,
          backgroundImage:
            'linear-gradient(to right, rgba(148, 163, 184, 0.32) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.32) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: isAuth
            ? 'radial-gradient(ellipse 95% 60% at 50% 0%, black 15%, transparent 80%)'
            : 'radial-gradient(ellipse 80% 70% at 50% 45%, black 30%, transparent 100%)',
          WebkitMaskImage: isAuth
            ? 'radial-gradient(ellipse 95% 60% at 50% 0%, black 15%, transparent 80%)'
            : 'radial-gradient(ellipse 80% 70% at 50% 45%, black 30%, transparent 100%)',
        }}
      />

      {/* Drifting Ambient Emerald Orb */}
      <motion.div
        animate={{
          x: [0, 32, -20, 0],
          y: [0, -24, 18, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`absolute -top-28 -left-24 rounded-full blur-3xl ${
          isSplash
            ? 'w-[380px] h-[380px] bg-emerald-500/20'
            : isSurface
              ? 'w-[280px] h-[280px] bg-emerald-500/10'
              : 'w-[340px] h-[340px] bg-emerald-500/14'
        }`}
      />

      {/* Drifting Ambient Cyan Orb */}
      <motion.div
        animate={{
          x: [0, -28, 18, 0],
          y: [0, 26, -18, 0],
          scale: [1, 0.93, 1.08, 1],
        }}
        transition={{
          duration: 21,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`absolute ${
          isAuth ? '-top-12 -right-28' : 'top-1/3 -right-24'
        } rounded-full blur-3xl ${
          isSplash
            ? 'w-[360px] h-[360px] bg-cyan-500/18'
            : isSurface
              ? 'w-[260px] h-[260px] bg-cyan-500/9'
              : 'w-[280px] h-[280px] bg-cyan-500/10'
        }`}
      />

      {/* Subtle Warm Amber Beacon Orb */}
      <motion.div
        animate={{
          x: [0, 22, -16, 0],
          y: [0, -18, 14, 0],
          opacity: isSurface ? [0.05, 0.1, 0.05] : isAuth ? [0.06, 0.12, 0.06] : [0.1, 0.18, 0.1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -bottom-28 left-1/4 w-[280px] h-[280px] rounded-full bg-amber-400 blur-3xl"
      />

      {/* Delicate Animated Transit Flow Lines SVG */}
      <svg
        viewBox="0 0 600 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <linearGradient id={lineGrad1} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0" />
            <stop offset="50%" stopColor="#10B981" stopOpacity="0.78" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={lineGrad2} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0" />
            <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.68" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={lineGrad3} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0" />
            <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Static Hairline Route Tracks */}
        <path
          d={topTrackPath}
          stroke={isAuth ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.12)'}
          strokeWidth="1.1"
        />
        <path
          d={bottomTrackPath}
          stroke={isAuth ? 'rgba(56, 189, 248, 0.075)' : 'rgba(56, 189, 248, 0.1)'}
          strokeWidth="1.1"
        />
        {isSplash && (
          <path
            d={diagonalTrackPath}
            stroke="rgba(245, 158, 11, 0.08)"
            strokeWidth="1.2"
          />
        )}

        {/* Gliding Light Pulse 1 (Emerald -> Cyan) */}
        <motion.path
          d={topTrackPath}
          stroke={`url(#${lineGrad1})`}
          strokeWidth={isSurface ? '1.6' : isAuth ? '1.75' : '2.2'}
          strokeLinecap="round"
          initial={{pathLength: 0.2, pathOffset: 0, opacity: 0}}
          animate={{
            pathLength: 0.2,
            pathOffset: [0, 0.85],
            opacity: [0, isSurface ? 0.42 : isAuth ? 0.52 : 0.8, 0],
          }}
          transition={{
            duration: 7.2,
            repeat: Infinity,
            ease: 'easeInOut',
            repeatDelay: 1.6,
          }}
        />

        {/* Gliding Light Pulse 2 (Cyan -> Amber) */}
        <motion.path
          d={bottomTrackPath}
          stroke={`url(#${lineGrad2})`}
          strokeWidth={isSurface ? '1.5' : isAuth ? '1.65' : '2'}
          strokeLinecap="round"
          initial={{pathLength: 0.18, pathOffset: 0.85, opacity: 0}}
          animate={{
            pathLength: 0.18,
            pathOffset: [0.85, 0],
            opacity: [0, isSurface ? 0.36 : isAuth ? 0.48 : 0.7, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1.6,
            repeatDelay: 1.8,
          }}
        />

        {/* Gliding Light Pulse 3 (Diagonal Amber -> Emerald on Splash Only) */}
        {isSplash && (
          <motion.path
            d={diagonalTrackPath}
            stroke={`url(#${lineGrad3})`}
            strokeWidth="1.9"
            strokeLinecap="round"
            initial={{pathLength: 0.16, pathOffset: 0, opacity: 0}}
            animate={{
              pathLength: 0.16,
              pathOffset: [0, 0.88],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 8.2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2.2,
              repeatDelay: 1.8,
            }}
          />
        )}

        {/* Subtle Station Beacon Nodes */}
        {isSplash && (
          <>
            <motion.circle
              cx="170"
              cy="198"
              r="3"
              fill="#10B981"
              animate={{opacity: [0.25, 0.85, 0.25], scale: [0.9, 1.35, 0.9]}}
              transition={{duration: 3.2, repeat: Infinity, ease: 'easeInOut'}}
            />
            <motion.circle
              cx="442"
              cy="240"
              r="3"
              fill="#38BDF8"
              animate={{opacity: [0.25, 0.85, 0.25], scale: [0.9, 1.35, 0.9]}}
              transition={{
                duration: 3.8,
                delay: 0.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.circle
              cx="458"
              cy="618"
              r="3.2"
              fill="#F59E0B"
              animate={{opacity: [0.25, 0.9, 0.25], scale: [0.9, 1.4, 0.9]}}
              transition={{
                duration: 3.4,
                delay: 1.3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </>
        )}
      </svg>

      {/* Editorial Reading Zone Scrim on Auth for Crisp Text Contrast */}
      {isAuth && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 90% 52% at 50% 42%, rgba(9, 13, 20, 0.58) 0%, rgba(9, 13, 20, 0.18) 70%, transparent 100%)',
          }}
        />
      )}
    </div>
  );
};
