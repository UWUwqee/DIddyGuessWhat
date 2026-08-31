import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  Bot,
  Trophy,
  RotateCcw,
  Sparkles,
  Coins,
  ShieldAlert,
  ArrowRight,
  Award,
  CheckCircle2,
  XCircle,
  Zap,
} from 'lucide-react';
import { AiGameConfig } from './VsAiArena';
import { useAuth } from '../context/AuthContext';
import {
  CURRENCY_CONFIG,
  formatCompactCurrency,
  formatFullCurrency,
  toBigInt,
} from '../utils/currencyUtils';
import { soundManager } from '../utils/soundEffects';
import confetti from 'canvas-confetti';

interface VsBotWagerBannerProps {
  aiConfig: AiGameConfig | null;
  gameTitle: string;
}

export const VsBotWagerBanner: React.FC<VsBotWagerBannerProps> = ({ aiConfig, gameTitle }) => {
  const { user, isAdmin } = useAuth();
  if (!aiConfig || !aiConfig.withBet) return null;

  const currencyMeta = CURRENCY_CONFIG[aiConfig.currency];
  const hasNgip = Boolean(user?.isNgip || isAdmin);

  const calculatePotentialWin = (): string => {
    try {
      const bi = toBigInt(aiConfig.betAmount);
      if (bi <= 0n) return '0';
      let multBi = bi;
      if (aiConfig.multiplier === 1.5) multBi = (bi * 15n) / 10n;
      else if (aiConfig.multiplier === 2.0) multBi = bi * 2n;
      else if (aiConfig.multiplier === 3.0) multBi = bi * 3n;

      if (hasNgip) multBi = multBi * 3n;
      return multBi.toString();
    } catch {
      return aiConfig.betAmount;
    }
  };

  const potentialWin = calculatePotentialWin();

  return (
    <div className="w-full bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-rose-500/15 border-2 border-amber-400/60 dark:border-amber-500/40 rounded-2xl p-3 sm:p-3.5 mb-3 flex flex-wrap items-center justify-between gap-2.5 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-sm shrink-0">
          <Flame className="w-4 h-4 fill-current animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
              VS BOT Wager Active
            </span>
            <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold text-[10px] uppercase">
              {aiConfig.difficulty} ({aiConfig.multiplier}x)
            </span>
            {hasNgip && (
              <span className="px-1.5 py-0.2 rounded-full bg-purple-600 text-white font-black text-[9px] shadow-xs">
                งip 3X VIP
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            Bet: <span className="font-bold text-slate-900 dark:text-white">{formatCompactCurrency(aiConfig.betAmount)} {currencyMeta.symbol} {currencyMeta.name}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-400/40 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 text-xs font-black">
          <Trophy className="w-3.5 h-3.5 text-emerald-500" />
          <span>Potential Win: +{formatCompactCurrency(potentialWin)}</span>
        </div>
      </div>
    </div>
  );
};

interface VsBotPayoutModalProps {
  isOpen: boolean;
  won: boolean;
  aiConfig: AiGameConfig | null;
  gameTitle: string;
  onRematch?: () => void;
  onBackToHub: () => void;
}

export const VsBotPayoutModal: React.FC<VsBotPayoutModalProps> = ({
  isOpen,
  won,
  aiConfig,
  gameTitle,
  onRematch,
  onBackToHub,
}) => {
  const { user, winBetReward, placeBet, isAdmin } = useAuth();
  const [hasProcessedWin, setHasProcessedWin] = useState(false);
  const [wonDetails, setWonDetails] = useState<{ amountWon: string; multiplier: number } | null>(null);
  const [rematchError, setRematchError] = useState<string | null>(null);

  // When won is true and modal opens, award the bet reward immediately and save to state/Firestore
  useEffect(() => {
    if (isOpen && won && aiConfig && aiConfig.withBet && !hasProcessedWin) {
      setHasProcessedWin(true);

      // Base calculated payout
      let basePayoutBi = toBigInt(aiConfig.betAmount);
      if (aiConfig.multiplier === 1.5) basePayoutBi = (basePayoutBi * 15n) / 10n;
      else if (aiConfig.multiplier === 2.0) basePayoutBi = basePayoutBi * 2n;
      else if (aiConfig.multiplier === 3.0) basePayoutBi = basePayoutBi * 3n;

      const res = winBetReward(aiConfig.currency, basePayoutBi.toString(), `VS Bot: ${gameTitle}`);
      setWonDetails(res);

      soundManager.playVictory();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen, won, aiConfig, hasProcessedWin, winBetReward, gameTitle]);

  if (!isOpen || !aiConfig || !aiConfig.withBet) return null;

  const currencyMeta = CURRENCY_CONFIG[aiConfig.currency];
  const hasNgip = Boolean(user?.isNgip || isAdmin);

  const handleRematchClick = () => {
    setRematchError(null);
    if (aiConfig.withBet) {
      const success = placeBet(aiConfig.currency, aiConfig.betAmount);
      if (!success) {
        setRematchError(`Insufficient ${currencyMeta.name} balance to place bet again.`);
        return;
      }
    }
    setHasProcessedWin(false);
    setWonDetails(null);
    if (onRematch) onRematch();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 text-center space-y-5"
        >
          {/* Status Header Icon */}
          <div className="mx-auto flex justify-center">
            {won ? (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center text-3xl shadow-lg shadow-amber-500/30 animate-bounce">
                🏆
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center text-3xl border border-rose-500/30">
                💀
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {won ? 'VS Bot Wager Won!' : 'Match Defeat!'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {won
                ? `You conquered the ${aiConfig.difficulty.toUpperCase()} AI in ${gameTitle}!`
                : `The bot claimed victory this round in ${gameTitle}.`}
            </p>
          </div>

          {/* Reward or Loss Card */}
          <div
            className={`p-4 rounded-2xl border ${
              won
                ? 'bg-amber-500/10 border-amber-400/50 dark:border-amber-500/30'
                : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
            }`}
          >
            {won ? (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Total Fortune Payout Awarded
                </span>
                <div className="text-2xl sm:text-3xl font-black text-amber-500 flex items-center justify-center gap-2">
                  <span>+{formatFullCurrency(wonDetails?.amountWon || '0')}</span>
                  <span>{currencyMeta.symbol}</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-bold">
                  <span>{currencyMeta.name}</span>
                  {hasNgip && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-black">
                      งip 3X Multiplier Applied!
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  Wager Lost
                </span>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  -{formatFullCurrency(aiConfig.betAmount)} {currencyMeta.name}
                </p>
              </div>
            )}
          </div>

          {rematchError && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/60 p-2 rounded-xl border border-rose-200 dark:border-rose-800">
              {rematchError}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
            {onRematch && (
              <button
                type="button"
                onClick={handleRematchClick}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-md shadow-amber-500/25 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again ({formatCompactCurrency(aiConfig.betAmount)})</span>
              </button>
            )}

            <button
              type="button"
              onClick={onBackToHub}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-xs border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <span>Arcade Hub</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
