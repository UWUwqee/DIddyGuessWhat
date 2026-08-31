import React from 'react';
import { motion } from 'motion/react';

interface GWLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  animate?: boolean;
}

export const GWLogo: React.FC<GWLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  animate = true,
}) => {
  // Size dimensions
  const badgeDimensions = {
    xs: { width: 32, height: 32, iconScale: 0.75 },
    sm: { width: 42, height: 42, iconScale: 1 },
    md: { width: 56, height: 56, iconScale: 1.3 },
    lg: { width: 78, height: 78, iconScale: 1.8 },
    xl: { width: 104, height: 104, iconScale: 2.4 },
  }[size];

  const textSizeClasses = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-4xl sm:text-5xl',
  }[size];

  const subtextSizeClasses = {
    xs: 'text-[9px]',
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base',
  }[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Y2K Graffiti Liquid Gold GW Badge */}
      <motion.div
        whileHover={animate ? { scale: 1.08, rotate: -2 } : undefined}
        whileTap={animate ? { scale: 0.94 } : undefined}
        className="relative flex items-center justify-center shrink-0 cursor-pointer group"
        style={{ width: badgeDimensions.width, height: badgeDimensions.height }}
      >
        {/* Y2K Cyberpunk Glow Auras */}
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 rounded-2xl blur-md opacity-70 group-hover:opacity-100 transition-opacity" />
        <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-300 via-amber-500 to-yellow-200 rounded-2xl opacity-60 group-hover:opacity-90 blur-xs transition-opacity" />

        {/* Outer Dark Cyber Shield Container */}
        <div className="relative w-full h-full bg-gradient-to-b from-slate-900 via-slate-950 to-black rounded-2xl border-2 border-yellow-400/80 shadow-2xl overflow-hidden flex items-center justify-center">
          {/* Subtle Y2K Grid Pattern */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: 'radial-gradient(rgba(250, 204, 21, 0.6) 1px, transparent 0)',
              backgroundSize: '6px 6px',
            }}
          />

          {/* SVG Vector Graffiti "GW" with 3D Extrusion and Liquid Gold Highlights */}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full p-1"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Rich Liquid Gold Gradient */}
              <linearGradient id="goldGraffitiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFBEB" />
                <stop offset="18%" stopColor="#FEF08A" />
                <stop offset="42%" stopColor="#FACC15" />
                <stop offset="68%" stopColor="#EAB308" />
                <stop offset="88%" stopColor="#CA8A04" />
                <stop offset="100%" stopColor="#854D0E" />
              </linearGradient>

              {/* 3D Deep Shadow & Bevel Gradient */}
              <linearGradient id="goldShadowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#713F12" />
                <stop offset="100%" stopColor="#1E1B4B" />
              </linearGradient>

              {/* Chrome Rim Highlight */}
              <linearGradient id="chromeGlint" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#FEF9C3" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#EAB308" stopOpacity="0" />
              </linearGradient>

              {/* Glow Filter */}
              <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#F59E0B" floodOpacity="0.6" />
              </filter>
            </defs>

            {/* Y2K Retro Orbit Rings */}
            <ellipse
              cx="50"
              cy="50"
              rx="44"
              ry="20"
              transform="rotate(-25 50 50)"
              stroke="url(#goldGraffitiGrad)"
              strokeWidth="1.8"
              strokeDasharray="4 3"
              opacity="0.65"
            />

            {/* 3D Graffiti Shadow / Extrusion Layer */}
            <g transform="translate(3, 4)" opacity="0.9">
              {/* "G" 3D Base */}
              <path
                d="M 44 26 C 30 23 16 32 14 47 C 12 62 22 75 38 75 C 47 75 51 70 51 63 L 51 53 L 34 53 L 34 45 L 59 45 L 59 66 C 59 78 49 84 36 84 C 15 84 3 67 6 46 C 9 24 28 13 47 16 Z"
                fill="url(#goldShadowGrad)"
              />
              {/* "W" 3D Base */}
              <path
                d="M 46 22 L 57 74 L 69 41 L 79 74 L 92 22 L 81 22 L 74 54 L 65 24 L 59 24 L 52 54 L 46 22 Z"
                fill="url(#goldShadowGrad)"
              />
            </g>

            {/* Main Graffiti "GW" Letters (Liquid Gold Fill + Thick Stroke) */}
            <g filter="url(#goldGlow)">
              {/* Graffiti Letter "G" */}
              <path
                d="M 43 25 C 29 22 15 31 13 46 C 11 61 21 74 37 74 C 46 74 50 69 50 62 L 50 52 L 33 52 L 33 44 L 58 44 L 58 65 C 58 77 48 83 35 83 C 14 83 2 66 5 45 C 8 23 27 12 46 15 Z"
                fill="url(#goldGraffitiGrad)"
                stroke="#0F172A"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />

              {/* Graffiti Letter "W" (Interlocked / Overlapping Wildstyle) */}
              <path
                d="M 45 20 L 56 72 L 68 39 L 78 72 L 91 20 L 80 20 L 73 52 L 64 22 L 58 22 L 51 52 L 45 20 Z"
                fill="url(#goldGraffitiGrad)"
                stroke="#0F172A"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />

              {/* Inner High-Gleam Metallic Highlights (G) */}
              <path
                d="M 41 27 C 30 25 18 33 16 45 C 15 54 21 63 30 67"
                stroke="url(#chromeGlint)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />

              {/* Inner High-Gleam Metallic Highlights (W) */}
              <path
                d="M 48 25 L 54 55 M 69 41 L 76 66 M 82 25 L 88 50"
                stroke="url(#chromeGlint)"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </g>

            {/* Y2K Signature 4-Point Chrome Sparkle Stars (✦) */}
            {/* Top-Right Star */}
            <path
              d="M 88 12 Q 88 18 94 18 Q 88 18 88 24 Q 88 18 82 18 Q 88 18 88 12 Z"
              fill="#FFFFFF"
              stroke="#FEF08A"
              strokeWidth="0.8"
            />
            {/* Bottom-Left Mini Star */}
            <path
              d="M 12 75 Q 12 79 16 79 Q 12 79 12 83 Q 12 79 8 79 Q 12 79 12 75 Z"
              fill="#FFFFFF"
              stroke="#FEF08A"
              strokeWidth="0.5"
            />
            {/* Center Flare */}
            <circle cx="68" cy="39" r="2.2" fill="#FFFFFF" opacity="0.9" />
          </svg>
        </div>
      </motion.div>

      {/* Brand Text (Guess What? with Y2K Gold Accent) */}
      {showText && (
        <div className="hidden sm:flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <h1
              className={`${textSizeClasses} font-black tracking-tight bg-gradient-to-r from-white via-amber-100 to-amber-400 bg-clip-text text-transparent flex items-center gap-1`}
            >
              <span>Guess What?</span>
            </h1>
            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] font-black tracking-wider uppercase">
              GW
            </span>
          </div>
          <span
            className={`${subtextSizeClasses} font-bold text-amber-400/90 tracking-wider uppercase pt-0.5 flex items-center gap-1`}
          >
            <span>Arcade Party</span>
            <span className="text-[10px] text-amber-300">✦</span>
          </span>
        </div>
      )}
    </div>
  );
};
