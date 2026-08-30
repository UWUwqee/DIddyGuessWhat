import React, { useState } from 'react';
import {
  Bot,
  Swords,
  Layers,
  Bomb,
  Eye,
  Brain,
  SpellCheck,
  Puzzle,
  Theater,
  Keyboard,
  Calculator,
  Zap,
  ShieldCheck,
  Flame,
  Coins,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { ArcadeGameMode, CurrencyType } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  CURRENCY_CONFIG,
  getWalletKey,
  formatCompactCurrency,
  formatFullCurrency,
  BET_PRESET_PACKAGES,
  toBigInt,
  addCurrency,
  mulCurrency,
} from '../utils/currencyUtils';
import { soundManager } from '../utils/soundEffects';

export type AiDifficulty = 'easy' | 'moderate' | 'hard' | 'extreme';

export interface AiGameConfig {
  mode: ArcadeGameMode;
  difficulty: AiDifficulty;
  withBet: boolean;
  currency: CurrencyType;
  betAmount: string;
  multiplier: number;
}

interface VsAiArenaProps {
  onLaunchGame: (config: AiGameConfig) => void;
}

interface AiGameOption {
  id: ArcadeGameMode;
  name: string;
  tagline: string;
  icon: React.ElementType;
  accentColor: string;
  badge: string;
  category: string;
}

const AI_GAMES: AiGameOption[] = [
  {
    id: 'ai_sketch_guess',
    name: 'AI Sketch Guesser',
    tagline: 'Draw live while neural AI guesses your sketches in real-time',
    icon: Bot,
    accentColor: 'from-purple-600 to-indigo-600',
    badge: 'Neural Vision',
    category: 'Drawing & Vision',
  },
  {
    id: 'speed_duel',
    name: '1v1 Canvas Speed Duel',
    tagline: 'Side-by-side prompt duel scored by live AI vision bot',
    icon: Swords,
    accentColor: 'from-orange-600 to-rose-600',
    badge: '1v1 Arena',
    category: 'Drawing Duel',
  },
  {
    id: 'uno_party',
    name: 'UNO Party Showdown',
    tagline: 'Official UNO card rules with skips, reverse & smart bot AI',
    icon: Layers,
    accentColor: 'from-rose-600 to-pink-600',
    badge: 'Card Battle',
    category: 'Card Strategy',
  },
  {
    id: 'bomb_chain',
    name: 'Word Bomb Chain',
    tagline: 'Type syllable words before the bomb explodes vs AI defusers',
    icon: Bomb,
    accentColor: 'from-amber-600 to-orange-600',
    badge: 'Syllable Rush',
    category: 'Word Action',
  },
  {
    id: 'pixel_reveal',
    name: 'Pixel Reveal Mystery',
    tagline: 'De-pixelating artwork with early guess speed bonuses vs AI',
    icon: Eye,
    accentColor: 'from-cyan-600 to-blue-600',
    badge: 'Visual Rush',
    category: 'Mystery Visuals',
  },
  {
    id: 'trivia_dash',
    name: 'Trivia Dash Royale',
    tagline: 'Fast multiple-choice quiz sprints with live AI bot racers',
    icon: Brain,
    accentColor: 'from-emerald-600 to-teal-600',
    badge: 'Brain Battle',
    category: 'Knowledge Sprint',
  },
  {
    id: 'anagram_rush',
    name: 'Word Anagram Rush',
    tagline: 'Unscramble letters at hyper speed vs AI lexicon solver',
    icon: SpellCheck,
    accentColor: 'from-yellow-600 to-amber-600',
    badge: 'Word Scramble',
    category: 'Word Logic',
  },
  {
    id: 'emoji_charades',
    name: 'Emoji Charades',
    tagline: 'Decode movies, idioms & pop culture clues from emoji puzzles',
    icon: Puzzle,
    accentColor: 'from-teal-600 to-cyan-600',
    badge: 'Pop Culture',
    category: 'Emoji Puzzles',
  },
  {
    id: 'blindfold_maestro',
    name: 'Blindfold Maestro',
    tagline: 'Draw unseen with hidden canvas until the grand final reveal',
    icon: Theater,
    accentColor: 'from-pink-600 to-purple-600',
    badge: 'Blind Canvas',
    category: 'Solo Art',
  },
  {
    id: 'cyber_typing',
    name: 'Cyber Velocity Typing',
    tagline: 'High-speed WPM velocity rush against AI typing challenger',
    icon: Keyboard,
    accentColor: 'from-indigo-600 to-cyan-600',
    badge: 'WPM Rush',
    category: 'Velocity Typing',
  },
  {
    id: 'math_sprint',
    name: 'Math Sprint 60s',
    tagline: 'Rapid mental arithmetic sprint vs AI calculation engine',
    icon: Calculator,
    accentColor: 'from-amber-600 to-lime-600',
    badge: 'Mental Math',
    category: 'Math Speed',
  },
  {
    id: 'color_clash',
    name: 'Color Clash Matrix',
    tagline: 'Stroop effect color vs text rapid reflex reaction duel',
    icon: Zap,
    accentColor: 'from-rose-600 to-violet-600',
    badge: 'Stroop Reflex',
    category: 'Reflex Matrix',
  },
];

const DIFFICULTY_CONFIG: Record<
  AiDifficulty,
  {
    label: string;
    multiplier: number;
    multiplierText: string;
    description: string;
    badgeBg: string;
    textColor: string;
    borderColor: string;
    icon: string;
  }
> = {
  easy: {
    label: 'EASY',
    multiplier: 1.0,
    multiplierText: '1.0x Payout',
    description: 'Relaxed AI pace, generous timers, and forgiving accuracy.',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    borderColor: 'border-emerald-300 dark:border-emerald-800',
    icon: '🟢',
  },
  moderate: {
    label: 'MODERATE',
    multiplier: 1.5,
    multiplierText: '1.5x Payout',
    description: 'Balanced AI reaction speed, standard competitive timers.',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
    textColor: 'text-amber-700 dark:text-amber-300',
    borderColor: 'border-amber-300 dark:border-amber-800',
    icon: '🟡',
  },
  hard: {
    label: 'HARD',
    multiplier: 2.0,
    multiplierText: '2.0x Payout',
    description: 'Sharp AI accuracy, quick guesses, and demanding streak combos.',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/60',
    textColor: 'text-rose-700 dark:text-rose-300',
    borderColor: 'border-rose-300 dark:border-rose-800',
    icon: '🔴',
  },
  extreme: {
    label: 'EXTREME',
    multiplier: 3.0,
    multiplierText: '3.0x Payout',
    description: 'Lightning superhuman AI speed, zero hesitation, maximum thrill!',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/60',
    textColor: 'text-purple-700 dark:text-purple-300',
    borderColor: 'border-purple-400 dark:border-purple-700',
    icon: '🔥',
  },
};

export const VsAiArena: React.FC<VsAiArenaProps> = ({ onLaunchGame }) => {
  const { user, placeBet } = useAuth();

  const [selectedGame, setSelectedGame] = useState<ArcadeGameMode>('ai_sketch_guess');
  const [selectedDifficulty, setSelectedDifficulty] = useState<AiDifficulty>('moderate');
  const [withBet, setWithBet] = useState<boolean>(false);
  const [betCurrency, setBetCurrency] = useState<CurrencyType>('diamond');
  const [betAmount, setBetAmount] = useState<string>('100000'); // 100K default
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currencies: CurrencyType[] = ['diamond', 'amethyst', 'jade', 'ruby'];
  const userBalance = user?.wallet?.[getWalletKey(betCurrency)] || '0';
  const currentDiffMeta = DIFFICULTY_CONFIG[selectedDifficulty];

  // Calculate potential payout with BigInt safety
  const calculatePotentialWin = (): string => {
    try {
      const bi = toBigInt(betAmount);
      if (bi <= 0n) return '0';
      if (currentDiffMeta.multiplier === 1.0) return bi.toString();
      if (currentDiffMeta.multiplier === 1.5) {
        return ((bi * 15n) / 10n).toString();
      }
      if (currentDiffMeta.multiplier === 2.0) {
        return (bi * 2n).toString();
      }
      if (currentDiffMeta.multiplier === 3.0) {
        return (bi * 3n).toString();
      }
      return bi.toString();
    } catch {
      return '0';
    }
  };

  const handleLaunch = () => {
    setErrorMessage(null);

    if (withBet) {
      const betBi = toBigInt(betAmount);
      const balBi = toBigInt(userBalance);

      if (betBi <= 0n) {
        setErrorMessage('Please enter a valid bet amount greater than 0.');
        return;
      }

      if (balBi < betBi) {
        setErrorMessage(
          `Insufficient ${CURRENCY_CONFIG[betCurrency].name} balance! You have ${formatCompactCurrency(
            userBalance
          )}, but bet is ${formatCompactCurrency(betAmount)}.`
        );
        return;
      }

      // Deduct bet from player's balance
      const success = placeBet(betCurrency, betAmount);
      if (!success) {
        setErrorMessage('Failed to place bet. Please check your currency balance.');
        return;
      }
    }

    soundManager.playStartGame();
    onLaunchGame({
      mode: selectedGame,
      difficulty: selectedDifficulty,
      withBet,
      currency: betCurrency,
      betAmount: withBet ? betAmount : '0',
      multiplier: currentDiffMeta.multiplier,
    });
  };

  const activeGameObj = AI_GAMES.find((g) => g.id === selectedGame) || AI_GAMES[0];
  const ActiveGameIcon = activeGameObj.icon;

  return (
    <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                VS AI Arcade Arena
              </h2>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Solo & Bot Challenges
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Select game, difficulty, and choose Casual play or Wager bets with multiplied rewards!
            </p>
          </div>
        </div>

        {/* Casual vs Bet Mode Switcher Pill */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            type="button"
            onClick={() => setWithBet(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              !withBet
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Casual (No Bet)</span>
          </button>
          <button
            type="button"
            onClick={() => setWithBet(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              withBet
                ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/30'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>🔥 Wager With Bet</span>
          </button>
        </div>
      </div>

      {/* Grid: Left Game Selector, Right Difficulty & Bet Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Game Selection Cards */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              1. Choose Game Arena ({AI_GAMES.length} Modes)
            </span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
              Selected: {activeGameObj.name}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
            {AI_GAMES.map((game) => {
              const Icon = game.icon;
              const isSelected = selectedGame === game.id;
              return (
                <div
                  key={game.id}
                  onClick={() => {
                    soundManager.playTick();
                    setSelectedGame(game.id);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4
                        className={`text-xs font-black truncate ${
                          isSelected
                            ? 'text-indigo-900 dark:text-indigo-200'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {game.name}
                      </h4>
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                      {game.tagline}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Columns: Difficulty & Bet Stakes Panel */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          {/* Difficulty Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                2. Select Difficulty & AI Speed
              </span>
              <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                {currentDiffMeta.multiplierText}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(['easy', 'moderate', 'hard', 'extreme'] as AiDifficulty[]).map((diff) => {
                const meta = DIFFICULTY_CONFIG[diff];
                const isSelected = selectedDifficulty === diff;
                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => {
                      soundManager.playTick();
                      setSelectedDifficulty(diff);
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? `${meta.badgeBg} ${meta.borderColor} ring-2 ring-indigo-500/20 shadow-xs`
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{meta.icon}</span>
                      <span className={`text-[10px] font-black ${meta.textColor}`}>
                        {meta.multiplierText}
                      </span>
                    </div>
                    <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                      {meta.label}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight truncate mt-0.5">
                      {diff === 'easy' && 'Casual practice'}
                      {diff === 'moderate' && 'Standard speed'}
                      {diff === 'hard' && 'Fast accuracy'}
                      {diff === 'extreme' && 'Superhuman AI'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Betting Configuration if Enabled */}
          {withBet ? (
            <div className="p-3.5 bg-gradient-to-br from-amber-50/60 to-orange-50/30 dark:from-amber-950/30 dark:to-slate-900 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    Wager Currency & Stakes
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-500">
                  Balance:{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {formatCompactCurrency(userBalance)}
                  </strong>
                </span>
              </div>

              {/* Currency Selector */}
              <div className="grid grid-cols-4 gap-1.5">
                {currencies.map((c) => {
                  const meta = CURRENCY_CONFIG[c];
                  const isSel = betCurrency === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setBetCurrency(c)}
                      className={`p-1.5 rounded-xl text-center border transition-all cursor-pointer ${
                        isSel
                          ? `${meta.bgColor} ${meta.borderColor} ring-2 ring-indigo-500/20 shadow-xs`
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="text-xs">{meta.symbol}</div>
                      <div className={`text-[10px] font-black truncate ${meta.textColor}`}>
                        {meta.name}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Preset Chips */}
              <div className="grid grid-cols-4 gap-1">
                {BET_PRESET_PACKAGES.slice(0, 4).map((pack) => (
                  <button
                    key={pack.label}
                    type="button"
                    onClick={() => setBetAmount(pack.amount)}
                    className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer text-center truncate ${
                      betAmount === pack.amount
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {pack.label}
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="space-y-1">
                <input
                  type="text"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Bet amount..."
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Payout Summary */}
              <div className="p-2 rounded-xl bg-amber-100/60 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/80 flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                  <span>Potential Win:</span>
                </div>
                <span className="font-mono text-xs font-black">
                  +{formatCompactCurrency(calculatePotentialWin())} {CURRENCY_CONFIG[betCurrency].name}
                </span>
              </div>
            </div>
          ) : (
            /* Casual Info Card */
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Casual Practice Mode (No Currency At Stake)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Play without risking gems to test strategies, hone your speed, and earn player XP & leaderboard score!
              </p>
            </div>
          )}

          {/* Error message */}
          {errorMessage && (
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400 p-2 bg-rose-50 dark:bg-rose-950/60 rounded-xl border border-rose-200 dark:border-rose-800">
              {errorMessage}
            </p>
          )}

          {/* Launch Button */}
          <button
            type="button"
            onClick={handleLaunch}
            className="w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <ActiveGameIcon className="w-4 h-4 fill-current" />
            <span>Launch Battle VS AI: {activeGameObj.name}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
