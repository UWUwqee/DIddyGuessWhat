import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  RotateCcw,
  Coins,
  Crown,
  Trophy,
  Flame,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CurrencyType } from '../../types';
import { CURRENCY_CONFIG, formatCompactCurrency, toBigInt, INITIAL_DEFAULT_WALLET } from '../../utils/currencyUtils';
import { soundManager } from '../../utils/soundEffects';
import { NgipBadge } from '../NgipBadge';

interface NgipMegaWheelProps {
  onBackToHub: () => void;
}

interface WheelSegment {
  id: number;
  label: string;
  multiplier: number;
  color: string;
  isJackpot?: boolean;
}

const SEGMENTS: WheelSegment[] = [
  { id: 0, label: '2X', multiplier: 2, color: '#3B82F6' },
  { id: 1, label: '5X', multiplier: 5, color: '#10B981' },
  { id: 2, label: '10X', multiplier: 10, color: '#F59E0B' },
  { id: 3, label: '3X', multiplier: 3, color: '#8B5CF6' },
  { id: 4, label: '25X', multiplier: 25, color: '#EC4899' },
  { id: 5, label: '2X', multiplier: 2, color: '#06B6D4' },
  { id: 6, label: '50X', multiplier: 50, color: '#F43F5E' },
  { id: 7, label: '4X', multiplier: 4, color: '#84CC16' },
  { id: 8, label: '👑 100X', multiplier: 100, color: '#EAB308', isJackpot: true },
  { id: 9, label: '6X', multiplier: 6, color: '#A855F7' },
  { id: 10, label: '15X', multiplier: 15, color: '#FB923C' },
  { id: 11, label: '⚡ 30X', multiplier: 30, color: '#14B8A6' },
];

export const NgipMegaWheel: React.FC<NgipMegaWheelProps> = ({ onBackToHub }) => {
  const { user, isNgip, updateWallet, logPlayerActivity, updateStats } = useAuth();
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>('diamond');
  const [betAmount, setBetAmount] = useState<string>('10000');
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [lastWin, setLastWin] = useState<{
    segment: WheelSegment;
    baseWon: string;
    totalWon: string;
    multiplier: number;
  } | null>(null);
  const [spinHistory, setSpinHistory] = useState<
    { id: string; label: string; won: string; currency: CurrencyType; time: string }[]
  >([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentWallet = user?.wallet || INITIAL_DEFAULT_WALLET;
  const currKey = `${selectedCurrency}s` as keyof typeof currentWallet;
  const userBalance = currentWallet[currKey] || '0';

  // Draw the Wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 16;
    const numSegments = SEGMENTS.length;
    const segmentAngle = (2 * Math.PI) / numSegments;

    ctx.clearRect(0, 0, width, height);

    // Draw Segments
    SEGMENTS.forEach((seg, i) => {
      const startAngle = i * segmentAngle;
      const endAngle = startAngle + segmentAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      // Gradient Fill
      const grad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, radius);
      grad.addColorStop(0, '#1E1B4B');
      grad.addColorStop(0.7, seg.color);
      grad.addColorStop(1, '#0F172A');
      ctx.fillStyle = grad;
      ctx.fill();

      // Segment Outline
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#FCD34D';
      ctx.stroke();

      // Text Label
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px sans-serif';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.fillText(seg.label, radius - 20, 6);
      ctx.restore();
    });

    // Outer rim lights
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 4, 0, 2 * Math.PI);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#F59E0B';
    ctx.stroke();

    // Center Hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 38, 0, 2 * Math.PI);
    ctx.fillStyle = '#1E1B4B';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FBBF24';
    ctx.stroke();

    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('งip 3X', centerX, centerY);
  }, []);

  const handleBetChange = (amount: string) => {
    try {
      if (amount === '' || toBigInt(amount) >= 0n) {
        setBetAmount(amount);
      }
    } catch {
      // ignore
    }
  };

  const handleAddBet = (increment: bigint) => {
    try {
      const current = toBigInt(betAmount || '0');
      setBetAmount((current + increment).toString());
    } catch {
      setBetAmount(increment.toString());
    }
  };

  const handleAllIn = () => {
    setBetAmount(userBalance);
  };

  const handleSpin = () => {
    if (isSpinning) return;
    const betBi = toBigInt(betAmount || '0');
    const balBi = toBigInt(userBalance);

    if (betBi <= 0n) {
      soundManager.playTick();
      return;
    }

    if (betBi > balBi) {
      soundManager.playTick();
      return;
    }

    // Deduct bet
    updateWallet(selectedCurrency, betBi.toString(), 'sub');
    setIsSpinning(true);
    setLastWin(null);

    if (soundEnabled) soundManager.playCardPlay();

    // Pick random segment
    const chosenIndex = Math.floor(Math.random() * SEGMENTS.length);
    const chosenSegment = SEGMENTS[chosenIndex];

    const segmentDegrees = 360 / SEGMENTS.length;
    const targetSegmentOffset = chosenIndex * segmentDegrees + segmentDegrees / 2;
    // Pointer is at the top (270 deg)
    const spins = 6 + Math.floor(Math.random() * 3);
    const targetRotation = wheelRotation + spins * 360 + (360 - (targetSegmentOffset % 360)) + 270;

    setWheelRotation(targetRotation);

    // Finish Spin
    setTimeout(() => {
      setIsSpinning(false);
      // Payout calculation: baseMultiplier * 3 (since งip user has 3x multiplier!)
      const baseMultiplier = BigInt(chosenSegment.multiplier);
      const ngipMultiplier = isNgip ? 3n : 1n;
      const totalMultiplier = baseMultiplier * ngipMultiplier;

      const baseWonBi = betBi * baseMultiplier;
      const totalWonBi = betBi * totalMultiplier;

      updateWallet(selectedCurrency, totalWonBi.toString(), 'add');
      updateStats({ gamesPlayed: 1, wins: 1, totalScore: Number(baseMultiplier) * 50 });

      if (soundEnabled) {
        if (chosenSegment.isJackpot || chosenSegment.multiplier >= 25) {
          soundManager.playVictory();
        } else {
          soundManager.playWildPlay();
        }
      }

      setLastWin({
        segment: chosenSegment,
        baseWon: baseWonBi.toString(),
        totalWon: totalWonBi.toString(),
        multiplier: Number(totalMultiplier),
      });

      setSpinHistory((prev) => [
        {
          id: 'spin_' + Date.now(),
          label: `${chosenSegment.label} (${totalMultiplier}x Total)`,
          won: totalWonBi.toString(),
          currency: selectedCurrency,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
        ...prev.slice(0, 10),
      ]);

      logPlayerActivity({
        type: 'wager_won',
        title: `⚡ งip Mega Wheel: Won ${formatCompactCurrency(totalWonBi.toString())} ${CURRENCY_CONFIG[selectedCurrency].name}!`,
        description: `${user?.username || 'VIP Player'} hit ${chosenSegment.label} with the งip 3x Multiplier Boost!`,
        gameMode: 'งip Supreme Mega Wheel',
        currencyEarned: {
          currency: selectedCurrency,
          amount: totalWonBi.toString(),
        },
      });
    }, 4500);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 text-white p-4 sm:p-6 relative overflow-hidden flex flex-col justify-between">
      {/* Background Neon Gradients */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-3 mb-6 relative z-10">
        <button
          onClick={onBackToHub}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-slate-200 transition-all shadow-md active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Lounge
        </button>

        <div className="flex items-center gap-2">
          <NgipBadge size="md" />
          <span className="hidden sm:inline-block text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-500/40 px-2.5 py-1 rounded-lg">
            Exclusive VIP Lounge
          </span>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-all shadow-md"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5 text-amber-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
        </button>
      </div>

      {/* Main Wheel Area */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-center flex-1 relative z-10">
        {/* Left Column: Wheel & Animation */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative">
          {/* Pointer indicator */}
          <div className="relative z-20 -mb-5 flex flex-col items-center">
            <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
            <div className="w-3 h-3 rounded-full bg-amber-300 shadow-md shadow-amber-400 -mt-1" />
          </div>

          {/* Wheel Frame */}
          <div className="relative p-3 rounded-full bg-gradient-to-tr from-amber-500 via-purple-600 to-amber-500 shadow-2xl shadow-amber-500/20 border-4 border-amber-400/80">
            <motion.div
              animate={{ rotate: wheelRotation }}
              transition={{
                duration: 4.5,
                ease: [0.15, 0.9, 0.25, 1],
              }}
              className="relative flex items-center justify-center rounded-full overflow-hidden"
            >
              <canvas ref={canvasRef} width={400} height={400} className="w-72 h-72 sm:w-96 sm:h-96 rounded-full" />
            </motion.div>
          </div>

          {/* Winning Result Modal / Callout */}
          <AnimatePresence>
            {lastWin && !isSpinning && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-amber-950 border-2 border-amber-400 shadow-2xl shadow-amber-500/40 text-center max-w-sm w-full"
              >
                <div className="flex items-center justify-center gap-1.5 text-xs font-black uppercase text-amber-300 tracking-wider mb-1">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                  งip 3X MULTIPLIER VICTORY!
                </div>
                <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-400 to-purple-300">
                  +{formatCompactCurrency(lastWin.totalWon)} {CURRENCY_CONFIG[selectedCurrency].name}
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  Base {lastWin.segment.label} × 3x งip Perk = <span className="font-bold text-amber-400">{lastWin.multiplier}X Payout</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Betting Dashboard */}
        <div className="lg:col-span-5 flex flex-col gap-4 bg-slate-900/90 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                Supreme High Roller
              </h2>
              <p className="text-xs text-amber-300/80 font-medium">
                Automatic 3x Multiplier active for งip holders
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Wallet Balance</span>
              <span className="text-sm font-black text-amber-300">
                {formatCompactCurrency(userBalance)} {CURRENCY_CONFIG[selectedCurrency].symbol}
              </span>
            </div>
          </div>

          {/* Select Currency */}
          <div>
            <label className="text-xs font-bold text-slate-300 mb-2 block uppercase tracking-wider">
              1. Stake Currency
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['diamond', 'amethyst', 'jade', 'ruby'] as CurrencyType[]).map((c) => {
                const conf = CURRENCY_CONFIG[c];
                const isSelected = selectedCurrency === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCurrency(c)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/40 shadow-lg'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-lg">{conf.symbol}</span>
                    <span className="capitalize text-[11px] mt-0.5">{conf.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bet Input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                2. Bet Amount
              </label>
              <button
                onClick={handleAllIn}
                className="text-[11px] font-black text-purple-400 hover:text-purple-300 uppercase tracking-wider"
              >
                Max / All-In
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={betAmount}
                onChange={(e) => handleBetChange(e.target.value)}
                disabled={isSpinning}
                placeholder="10000"
                className="w-full bg-slate-950 border-2 border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-base font-black text-amber-200 focus:outline-none transition-all pr-16"
              />
              <span className="absolute right-4 top-3 text-xs font-bold text-slate-400">
                {CURRENCY_CONFIG[selectedCurrency].symbol}
              </span>
            </div>

            {/* Quick Stake Buttons */}
            <div className="grid grid-cols-5 gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => handleAddBet(1000n)}
                className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200"
              >
                +1K
              </button>
              <button
                type="button"
                onClick={() => handleAddBet(1000000n)}
                className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200"
              >
                +1M
              </button>
              <button
                type="button"
                onClick={() => handleAddBet(1000000000n)}
                className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200"
              >
                +1B
              </button>
              <button
                type="button"
                onClick={() => handleAddBet(1000000000000n)}
                className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-200"
              >
                +1T
              </button>
              <button
                type="button"
                onClick={() => handleAddBet(1000000000000000000n)}
                className="px-2 py-1.5 bg-purple-900/60 hover:bg-purple-800 border border-purple-600 rounded-lg text-[11px] font-bold text-purple-200"
              >
                +1Q
              </button>
            </div>
          </div>

          {/* Spin Button */}
          <button
            onClick={handleSpin}
            disabled={isSpinning || toBigInt(betAmount || '0') <= 0n}
            className={`w-full py-4 rounded-2xl font-black text-lg uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl ${
              isSpinning
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white border-2 border-amber-300 shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isSpinning ? (
              <>
                <RotateCcw className="w-5 h-5 animate-spin" />
                Spinning the Supreme Wheel...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-200" />
                SPIN WHEEL (3X งip PAYOUT)
              </>
            )}
          </button>

          {/* Recent History */}
          {spinHistory.length > 0 && (
            <div className="mt-2 pt-3 border-t border-slate-800">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Recent Lounge Rolls
              </h4>
              <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                {spinHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-950/60 border border-slate-800"
                  >
                    <span className="font-bold text-amber-400">{item.label}</span>
                    <span className="font-mono text-emerald-400">
                      +{formatCompactCurrency(item.won)} {CURRENCY_CONFIG[item.currency].symbol}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
