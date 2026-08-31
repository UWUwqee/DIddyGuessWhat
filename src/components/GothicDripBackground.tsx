import React from 'react';

export const GothicDripBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 1. Subtle Radial / Ambient Drip Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/[0.03] dark:via-purple-900/[0.06] to-pink-500/[0.03] dark:to-slate-950" />

      {/* 2. Top Edge Gothic Drips SVG (Subtle low transparency) */}
      <svg
        className="absolute top-0 left-0 w-full h-20 sm:h-28 text-slate-400/10 dark:text-purple-400/15 fill-current"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        <path d="M0,0 L1200,0 L1200,30 Q1160,32 1140,75 Q1130,95 1120,70 Q1100,25 1070,30 Q1040,35 1020,95 Q1010,118 1000,90 Q980,30 950,28 Q920,25 900,65 Q880,30 840,32 Q810,35 790,110 Q780,120 770,95 Q750,25 710,30 Q670,35 650,80 Q640,105 630,75 Q610,25 570,30 Q540,35 520,115 Q510,125 500,95 Q480,28 440,30 Q410,32 390,75 Q370,25 330,30 Q300,35 280,105 Q270,120 260,85 Q240,25 200,30 Q170,35 150,70 Q130,25 90,30 Q60,35 40,95 Q30,115 20,80 Q10,30 0,32 Z" />
      </svg>

      {/* 3. Authentic Y2K Gothic Graffiti Tags & Stencils (Subtle low transparency: ~8-12%) */}
      <div className="absolute inset-0 opacity-[0.07] dark:opacity-[0.14] text-slate-800 dark:text-purple-300 font-black tracking-widest pointer-events-none transition-opacity duration-300">
        
        {/* Top-Left Tag: GUESSWHAT */}
        <div className="absolute top-12 left-4 sm:left-12 rotate-[-12deg] text-3xl sm:text-6xl font-black uppercase tracking-tighter filter blur-[0.5px] border-b-2 border-current pb-1">
          ☠ GUESS WHAT ⚔
        </div>

        {/* Top-Right Tag: Y2K DRIP */}
        <div className="absolute top-16 right-4 sm:right-16 rotate-[14deg] text-2xl sm:text-5xl font-black uppercase tracking-widest text-pink-500/80 dark:text-pink-400">
          ✦ Y2K DRIP ✦
        </div>

        {/* Center-Left Stencil: DĄMON */}
        <div className="absolute top-[35%] left-2 sm:left-8 rotate-[-90deg] origin-left text-4xl sm:text-7xl font-extrabold tracking-widest uppercase">
          ⛓ DĄMON ⛓
        </div>

        {/* Center-Right Gothic Cross & Barbed Graffiti */}
        <div className="absolute top-[40%] right-3 sm:right-12 rotate-[90deg] origin-right text-3xl sm:text-6xl font-black tracking-widest uppercase">
          ✞ ROCKHESTRA ✞
        </div>

        {/* Mid Background Spray Splatters & Symbols */}
        <div className="absolute top-[55%] left-[20%] text-5xl sm:text-8xl rotate-[8deg] opacity-60">
          ⚔ ✧ ☠
        </div>

        <div className="absolute top-[65%] right-[18%] text-4xl sm:text-7xl rotate-[-10deg] opacity-60">
          🩸 BATTLE HYMN 🩸
        </div>

        {/* Bottom-Left Graffiti: CYBER GOTHIC */}
        <div className="absolute bottom-16 left-6 sm:left-20 rotate-[6deg] text-3xl sm:text-6xl font-black uppercase tracking-tight">
          ★ CYBER GOTHIC ★
        </div>

        {/* Bottom-Right Graffiti: HIGH ROLLER งip */}
        <div className="absolute bottom-20 right-6 sm:right-24 rotate-[-8deg] text-2xl sm:text-5xl font-black uppercase tracking-wider text-amber-500/80">
          ⚡ งip SUPREME ⚡
        </div>
      </div>

      {/* 4. Bottom Edge Gothic Drips SVG (Inverted) */}
      <svg
        className="absolute bottom-0 left-0 w-full h-14 sm:h-20 text-slate-400/10 dark:text-purple-400/10 fill-current rotate-180"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        <path d="M0,0 L1200,0 L1200,30 Q1160,32 1140,75 Q1130,95 1120,70 Q1100,25 1070,30 Q1040,35 1020,95 Q1010,118 1000,90 Q980,30 950,28 Q920,25 900,65 Q880,30 840,32 Q810,35 790,110 Q780,120 770,95 Q750,25 710,30 Q670,35 650,80 Q640,105 630,75 Q610,25 570,30 Q540,35 520,115 Q510,125 500,95 Q480,28 440,30 Q410,32 390,75 Q370,25 330,30 Q300,35 280,105 Q270,120 260,85 Q240,25 200,30 Q170,35 150,70 Q130,25 90,30 Q60,35 40,95 Q30,115 20,80 Q10,30 0,32 Z" />
      </svg>
    </div>
  );
};
