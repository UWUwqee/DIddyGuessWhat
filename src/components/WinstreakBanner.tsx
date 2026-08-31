import React from 'react';
import { Flame, Zap, Trophy, Crown, Sparkles, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NgipBadge } from './NgipBadge';

interface WinstreakBannerProps {
  variant?: 'compact' | 'badge' | 'card' | 'modal';
  className?: string;
  onOpenLeaderboard?: () => void;
}

export const WinstreakBanner: React.FC<WinstreakBannerProps> = ({
  variant = 'compact',
  className = '',
  onOpenLeaderboard,
}) => {
  const { user, isNgip } = useAuth();
  const streak = user?.stats?.currentStreak || 0;
  const bestStreak = user?.stats?.bestStreak || 0;

  // Streak status tiered titles and colors
  let tierTitle = 'Starting Out';
  let tierColor = 'from-slate-500 to-slate-700';
  let flameColor = 'text-slate-400';
  let bonusPercent = 0;

  if (streak >= 20) {
    tierTitle = '👑 GODLIKE DOMINATION';
    tierColor = 'from-amber-400 via-rose-500 to-purple-600';
    flameColor = 'text-amber-300 fill-amber-400';
    bonusPercent = 200;
  } else if (streak >= 10) {
    tierTitle = '⚡ UNSTOPPABLE STREAK';
    tierColor = 'from-purple-600 via-pink-600 to-rose-600';
    flameColor = 'text-purple-300 fill-purple-400';
    bonusPercent = 100;
  } else if (streak >= 5) {
    tierTitle = '🔥🔥 ON FIRE';
    tierColor = 'from-orange-500 via-rose-500 to-red-600';
    flameColor = 'text-rose-400 fill-rose-500';
    bonusPercent = 50;
  } else if (streak >= 3) {
    tierTitle = '🔥 HOT STREAK';
    tierColor = 'from-amber-500 to-orange-600';
    flameColor = 'text-amber-400 fill-amber-500';
    bonusPercent = 25;
  } else if (streak > 0) {
    tierTitle = 'Warming Up';
    tierColor = 'from-blue-500 to-indigo-600';
    flameColor = 'text-indigo-400';
    bonusPercent = 10;
  }

  // Variant: Badge (Small Pill for Header / Nav)
  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-black text-xs transition-all select-none ${
          streak > 0
            ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 text-orange-500 dark:text-orange-400 border border-orange-500/40 shadow-xs animate-pulse'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
        } ${className}`}
        title={`Current Winstreak: ${streak} | Best: ${bestStreak}`}
      >
        <Flame className={`w-3.5 h-3.5 ${streak > 0 ? 'text-amber-500 fill-amber-400 animate-bounce' : 'text-slate-400'}`} />
        <span className="font-mono tracking-tight font-black">{streak} Streak</span>
      </div>
    );
  }

  // Variant: Compact (Inside WalletBar or Card Header)
  if (variant === 'compact') {
    return (
      <div
        className={`flex items-center justify-between gap-3 p-2.5 rounded-2xl border transition-all ${
          streak >= 3
            ? 'bg-gradient-to-r from-slate-900 via-purple-950/60 to-slate-900 border-amber-500/50 shadow-md shadow-amber-500/5'
            : 'bg-slate-900/80 border-slate-800'
        } ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-tr ${tierColor}`}
          >
            <Flame className={`w-5 h-5 ${streak > 0 ? 'fill-current animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white">{streak}x Win Streak</span>
              {isNgip && <NgipBadge size="xs" />}
            </div>
            <p className="text-[10px] text-amber-300 font-extrabold">{tierTitle}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 block">Best Streak</span>
          <span className="text-xs font-mono font-black text-amber-400">{bestStreak} Wins</span>
        </div>
      </div>
    );
  }

  // Variant: Modal or Full Card (Game Victory & Profile View)
  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-4 sm:p-5 border-2 text-left space-y-3 transition-all ${
        streak >= 3
          ? 'bg-gradient-to-br from-slate-950 via-purple-950/60 to-slate-950 border-amber-400/80 shadow-xl shadow-amber-500/10'
          : 'bg-slate-950/90 border-slate-800'
      } ${className}`}
    >
      {/* Background glow */}
      {streak >= 3 && (
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-tr ${tierColor}`}
          >
            <Flame className={`w-7 h-7 ${streak > 0 ? 'fill-current animate-bounce' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                {streak} Match Win Streak
              </h3>
              {streak >= 5 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400 text-[10px] font-black animate-pulse">
                  🔥 ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-amber-300 font-bold">{tierTitle}</p>
          </div>
        </div>

        <div className="text-right bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Personal Best</span>
          <span className="text-sm font-mono font-black text-amber-400">{bestStreak} WINS</span>
        </div>
      </div>

      {/* Rewards Multipliers breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] text-slate-400 block font-bold">Streak Bonus</span>
          <span className="text-xs font-black text-emerald-400">
            +{bonusPercent}% Bonus EXP & Gems
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] text-slate-400 block font-bold">งip VIP Perk</span>
          <span className={`text-xs font-black ${isNgip ? 'text-amber-400' : 'text-slate-500'}`}>
            {isNgip ? '👑 3X Multiplier Active' : 'Normal 1X (Upgrade for 3X)'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-slate-400 block font-bold">Gem Payout</span>
          <span className="text-xs font-black text-cyan-300 font-mono">
            +{streak > 0 ? (isNgip ? (10000 + streak * 2500) * 3 : 10000 + streak * 2500).toLocaleString() : '0'} 💎
          </span>
        </div>
      </div>
    </div>
  );
};
