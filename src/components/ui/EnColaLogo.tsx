import React, {useId} from 'react';
import {motion} from 'motion/react';

interface EnColaLogoProps {
  size?: number;
  className?: string;
}

const UNDER_PATH =
  'M 24.5 51 C 39 54, 62 52, 76 39 C 88 28, 86 12, 70 11';

const OVER_PATH =
  'M 70 11 C 52 10, 41 28, 42 52 C 43 76, 62 86, 80 78 C 89 74, 96 67, 102 57';

const FULL_ROUTE_PATH =
  'M 24.5 51 C 39 54, 62 52, 76 39 C 88 28, 86 12, 70 11 C 52 10, 41 28, 42 52 C 43 76, 62 86, 80 78 C 89 74, 96 67, 102 57';

const CROSSING_SHADOW_PATH = 'M 46 33 C 42.5 42, 41.8 50, 42.6 62';

/**
 * Official Animated EnCola Brand Mark
 * Cursive "e" route ribbon with emerald origin ring, animated transit light pulse,
 * and pulsing amber destination beacon.
 */
export const EnColaLogo: React.FC<EnColaLogoProps> = ({
  size = 44,
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const underGradId = `encola-under-${uid}`;
  const overGradId = `encola-over-${uid}`;
  const pulseGradId = `encola-pulse-${uid}`;
  const beaconGlowId = `encola-beacon-${uid}`;
  const shadowBlurId = `encola-shadow-${uid}`;

  const width = Math.round(size * 1.24);
  const height = size;

  return (
    <motion.svg
      width={width}
      height={height}
      viewBox="0 0 120 96"
      fill="none"
      aria-label="EnCola logo"
      whileHover={{scale: 1.07}}
      whileTap={{scale: 0.94}}
      transition={{type: 'spring', stiffness: 420, damping: 24}}
      className={`shrink-0 overflow-visible select-none ${className}`}
    >
      <defs>
        {/* Horizontal bar to upper cyan loop */}
        <linearGradient
          id={underGradId}
          x1="24"
          y1="52"
          x2="86"
          y2="14"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#1FC78E" />
          <stop offset="45%" stopColor="#089CC5" />
          <stop offset="85%" stopColor="#0EB6D9" />
          <stop offset="100%" stopColor="#15C49E" />
        </linearGradient>

        {/* Descending emerald stroke to golden-amber destination tail */}
        <linearGradient
          id={overGradId}
          x1="66"
          y1="12"
          x2="102"
          y2="62"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#14C4A2" />
          <stop offset="42%" stopColor="#1FC78E" />
          <stop offset="72%" stopColor="#48BF76" />
          <stop offset="90%" stopColor="#B8A938" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        {/* Traveling luminous route signal */}
        <linearGradient
          id={pulseGradId}
          x1="20"
          y1="50"
          x2="104"
          y2="58"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#A7F3D0" />
          <stop offset="50%" stopColor="#E0F2FE" />
          <stop offset="100%" stopColor="#FDE68A" />
        </linearGradient>

        {/* Soft radial halo behind amber beacon */}
        <radialGradient
          id={beaconGlowId}
          cx="50%"
          cy="50%"
          r="50%"
          fx="50%"
          fy="50%"
        >
          <stop offset="0%" stopColor="#FFB020" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#F59E0B" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>

        {/* Subtle overlap shadow where vertical ribbon crosses horizontal bar */}
        <filter
          id={shadowBlurId}
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
        >
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>

      {/* Layer 1: Under-stroke (Origin bar -> upper-right cyan loop) */}
      <motion.path
        d={UNDER_PATH}
        stroke={`url(#${underGradId})`}
        strokeWidth="10.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{pathLength: 0, opacity: 0.4}}
        animate={{pathLength: 1, opacity: 1}}
        transition={{duration: 0.55, ease: [0.16, 1, 0.3, 1]}}
      />

      {/* Layer 2: Authentic 3D crossing shadow under the descending stroke */}
      <motion.path
        d={CROSSING_SHADOW_PATH}
        stroke="#070A10"
        strokeWidth="13.5"
        strokeLinecap="round"
        opacity={0.55}
        filter={`url(#${shadowBlurId})`}
        initial={{opacity: 0}}
        animate={{opacity: 0.55}}
        transition={{duration: 0.4, delay: 0.35}}
      />

      {/* Layer 3: Over-stroke (Upper-left descent -> bottom emerald curve -> amber tail) */}
      <motion.path
        d={OVER_PATH}
        stroke={`url(#${overGradId})`}
        strokeWidth="10.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{pathLength: 0, opacity: 0.4}}
        animate={{pathLength: 1, opacity: 1}}
        transition={{duration: 0.65, delay: 0.32, ease: [0.16, 1, 0.3, 1]}}
      />

      {/* Layer 4: Continuous Animated Transit Signal gliding along the cursive "e" */}
      <motion.path
        d={FULL_ROUTE_PATH}
        stroke={`url(#${pulseGradId})`}
        strokeWidth="3.6"
        strokeLinecap="round"
        initial={{pathLength: 0.18, pathOffset: 0, opacity: 0}}
        animate={{
          pathLength: 0.18,
          pathOffset: [0, 0.84],
          opacity: [0, 0.9, 0.9, 0],
        }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: 'easeInOut',
          repeatDelay: 0.45,
          delay: 0.9,
        }}
      />

      {/* Layer 5: Left Hollow Emerald Origin Ring */}
      <motion.circle
        cx="17"
        cy="51"
        r="7.4"
        fill="#0C1017"
        stroke="#1FC78E"
        strokeWidth="5.2"
        initial={{scale: 0.6, opacity: 0}}
        animate={{scale: [1, 1.06, 1], opacity: 1}}
        transition={{
          scale: {duration: 3.6, repeat: Infinity, ease: 'easeInOut'},
          opacity: {duration: 0.3},
        }}
        style={{transformOrigin: '17px 51px'}}
      />

      {/* Layer 6: Right Glowing Amber Destination Beacon + Animated Radar Halo */}
      <motion.circle
        cx="102"
        cy="57"
        r="15.5"
        fill={`url(#${beaconGlowId})`}
        initial={{scale: 0.85, opacity: 0.35}}
        animate={{scale: [0.9, 1.24, 0.9], opacity: [0.42, 0.85, 0.42]}}
        transition={{
          duration: 2.6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{transformOrigin: '102px 57px'}}
      />
      <motion.circle
        cx="102"
        cy="57"
        r="10.2"
        fill="#F59E0B"
        fillOpacity="0.28"
        initial={{scale: 0.95}}
        animate={{scale: [0.96, 1.12, 0.96]}}
        transition={{
          duration: 2.6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{transformOrigin: '102px 57px'}}
      />
      <motion.circle
        cx="102"
        cy="57"
        r="6.4"
        fill="#FFA812"
        initial={{scale: 0}}
        animate={{scale: 1}}
        transition={{
          type: 'spring',
          stiffness: 380,
          damping: 20,
          delay: 0.65,
        }}
        style={{transformOrigin: '102px 57px'}}
      />
    </motion.svg>
  );
};
