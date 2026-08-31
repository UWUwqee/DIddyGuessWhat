import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Eye,
  Sparkles,
  Trophy,
  RotateCcw,
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  Clock,
  Flame,
  Star,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../utils/soundEffects';
import { AiGameConfig } from '../VsAiArena';
import { VsBotWagerBanner, VsBotPayoutModal } from '../VsBotWagerManager';

interface PixelRevealProps {
  onBackToHub: () => void;
  aiConfig?: AiGameConfig | null;
}

interface MysteryItem {
  id: string;
  name: string;
  category: string;
  hint: string;
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

const MYSTERY_ITEMS: MysteryItem[] = [
  {
    id: 'rocket',
    name: 'ROCKET',
    category: 'Space & Science',
    hint: 'Shoots into outer space towards the stars',
    draw: (ctx, w, h) => {
      // Background Sky
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, w, h);

      // Stars
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 40; i++) {
        const x = ((i * 37) % w);
        const y = ((i * 73) % h);
        ctx.fillRect(x, y, 3, 3);
      }

      // Rocket Body
      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.ellipse(w / 2, h / 2 - 20, 45, 110, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rocket Tip
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.moveTo(w / 2 - 45, h / 2 - 60);
      ctx.lineTo(w / 2, h / 2 - 135);
      ctx.lineTo(w / 2 + 45, h / 2 - 60);
      ctx.fill();

      // Porthole Window
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2 - 30, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0284C7';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Fins
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.moveTo(w / 2 - 45, h / 2 + 30);
      ctx.lineTo(w / 2 - 95, h / 2 + 90);
      ctx.lineTo(w / 2 - 45, h / 2 + 80);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(w / 2 + 45, h / 2 + 30);
      ctx.lineTo(w / 2 + 95, h / 2 + 90);
      ctx.lineTo(w / 2 + 45, h / 2 + 80);
      ctx.fill();

      // Flame Thruster
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.moveTo(w / 2 - 30, h / 2 + 90);
      ctx.lineTo(w / 2, h / 2 + 160);
      ctx.lineTo(w / 2 + 30, h / 2 + 90);
      ctx.fill();

      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.moveTo(w / 2 - 18, h / 2 + 90);
      ctx.lineTo(w / 2, h / 2 + 130);
      ctx.lineTo(w / 2 + 18, h / 2 + 90);
      ctx.fill();
    },
  },
  {
    id: 'pizza',
    name: 'PIZZA',
    category: 'Delicious Food',
    hint: 'Cheesy Italian triangular slice with pepperoni',
    draw: (ctx, w, h) => {
      ctx.fillStyle = '#FFF7ED';
      ctx.fillRect(0, 0, w, h);

      // Crust & Slice
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.moveTo(w / 2, h / 2 + 120);
      ctx.lineTo(w / 2 - 120, h / 2 - 100);
      ctx.quadraticCurveTo(w / 2, h / 2 - 130, w / 2 + 120, h / 2 - 100);
      ctx.closePath();
      ctx.fill();

      // Crust rim
      ctx.fillStyle = '#D97706';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2 - 100, 130, Math.PI * 1.1, Math.PI * 1.9);
      ctx.lineWidth = 22;
      ctx.strokeStyle = '#B45309';
      ctx.stroke();

      // Melted Cheese
      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.moveTo(w / 2, h / 2 + 105);
      ctx.lineTo(w / 2 - 100, h / 2 - 85);
      ctx.quadraticCurveTo(w / 2, h / 2 - 110, w / 2 + 100, h / 2 - 85);
      ctx.closePath();
      ctx.fill();

      // Pepperonis
      ctx.fillStyle = '#DC2626';
      const peps = [
        { x: w / 2 - 40, y: h / 2 - 50 },
        { x: w / 2 + 35, y: h / 2 - 45 },
        { x: w / 2, y: h / 2 },
        { x: w / 2 - 25, y: h / 2 + 45 },
        { x: w / 2 + 30, y: h / 2 + 35 },
      ];
      peps.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#991B1B';
        ctx.lineWidth = 3;
        ctx.stroke();
      });
    },
  },
  {
    id: 'guitar',
    name: 'GUITAR',
    category: 'Music & Instruments',
    hint: '6-stringed rock and roll instrument',
    draw: (ctx, w, h) => {
      ctx.fillStyle = '#1E1B4B';
      ctx.fillRect(0, 0, w, h);

      // Guitar Body
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2 + 60, 75, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(w / 2, h / 2 - 10, 50, 0, Math.PI * 2);
      ctx.fill();

      // Sound Hole
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2 + 20, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Neck
      ctx.fillStyle = '#78350F';
      ctx.fillRect(w / 2 - 12, h / 2 - 140, 24, 130);

      // Headstock
      ctx.fillStyle = '#B45309';
      ctx.fillRect(w / 2 - 16, h / 2 - 170, 32, 35);

      // Strings
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1.5;
      for (let i = -6; i <= 6; i += 3) {
        ctx.beginPath();
        ctx.moveTo(w / 2 + i, h / 2 - 165);
        ctx.lineTo(w / 2 + i, h / 2 + 90);
        ctx.stroke();
      }
    },
  },
  {
    id: 'crown',
    name: 'CROWN',
    category: 'Royalty & Treasures',
    hint: 'Golden jeweled headwear worn by kings and queens',
    draw: (ctx, w, h) => {
      ctx.fillStyle = '#312E81';
      ctx.fillRect(0, 0, w, h);

      // Crown Gold Base
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.moveTo(w / 2 - 110, h / 2 + 60);
      ctx.lineTo(w / 2 - 120, h / 2 - 40);
      ctx.lineTo(w / 2 - 60, h / 2 + 10);
      ctx.lineTo(w / 2, h / 2 - 70);
      ctx.lineTo(w / 2 + 60, h / 2 + 10);
      ctx.lineTo(w / 2 + 120, h / 2 - 40);
      ctx.lineTo(w / 2 + 110, h / 2 + 60);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Crown Band Jewels
      ctx.fillStyle = '#B45309';
      ctx.fillRect(w / 2 - 110, h / 2 + 45, 220, 25);

      // Ruby / Emerald Gems
      const gems = [
        { x: w / 2 - 70, y: h / 2 + 57, color: '#EF4444' },
        { x: w / 2, y: h / 2 + 57, color: '#10B981' },
        { x: w / 2 + 70, y: h / 2 + 57, color: '#3B82F6' },
        { x: w / 2, y: h / 2 - 65, color: '#EF4444' },
        { x: w / 2 - 120, y: h / 2 - 35, color: '#8B5CF6' },
        { x: w / 2 + 120, y: h / 2 - 35, color: '#8B5CF6' },
      ];
      gems.forEach((g) => {
        ctx.fillStyle = g.color;
        ctx.beginPath();
        ctx.arc(g.x, g.y, 8, 0, Math.PI * 2);
        ctx.fill();
      });
    },
  },
  {
    id: 'gamepad',
    name: 'GAMEPAD',
    category: 'Gaming & Tech',
    hint: 'Handheld joystick controller for consoles',
    draw: (ctx, w, h) => {
      ctx.fillStyle = '#09090B';
      ctx.fillRect(0, 0, w, h);

      // Controller Body
      ctx.fillStyle = '#3F3F46';
      ctx.beginPath();
      ctx.roundRect(w / 2 - 120, h / 2 - 50, 240, 110, [40, 40, 50, 50]);
      ctx.fill();

      // D-Pad
      ctx.fillStyle = '#18181B';
      ctx.fillRect(w / 2 - 85, h / 2 - 15, 36, 12);
      ctx.fillRect(w / 2 - 73, h / 2 - 27, 12, 36);

      // ABXY Action Buttons
      const buttons = [
        { x: w / 2 + 65, y: h / 2 - 20, color: '#EF4444' },
        { x: w / 2 + 80, y: h / 2 - 5, color: '#3B82F6' },
        { x: w / 2 + 50, y: h / 2 - 5, color: '#10B981' },
        { x: w / 2 + 65, y: h / 2 + 10, color: '#F59E0B' },
      ];
      buttons.forEach((b) => {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 7, 0, Math.PI * 2);
        ctx.fill();
      });

      // Analog Sticks
      ctx.fillStyle = '#27272A';
      ctx.beginPath();
      ctx.arc(w / 2 - 35, h / 2 + 25, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(w / 2 + 35, h / 2 + 25, 18, 0, Math.PI * 2);
      ctx.fill();
    },
  },
];

export const PixelReveal: React.FC<PixelRevealProps> = ({ onBackToHub, aiConfig = null }) => {
  const { updateStats } = useAuth();

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'round_solved' | 'game_over'>('intro');
  const [currentRound, setCurrentRound] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [roundScore, setRoundScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25);
  const [totalTime] = useState(25);
  const [guessInput, setGuessInput] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Wager modal
  const [showWagerModal, setShowWagerModal] = useState(false);
  const [wagerWon, setWagerWon] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentItem = MYSTERY_ITEMS[currentRound % MYSTERY_ITEMS.length];

  // Initialize and start game
  const handleStartGame = () => {
    setGameState('playing');
    setCurrentRound(0);
    setTotalScore(0);
    startRound(0);
  };

  const startRound = (roundIndex: number) => {
    setCurrentRound(roundIndex);
    setTimeLeft(25);
    setIsRevealed(false);
    setGuessInput('');
    setFeedback(null);
    setRoundScore(0);

    // Prepare crisp hidden canvas first
    const hidden = document.createElement('canvas');
    hidden.width = 400;
    hidden.height = 340;
    const hCtx = hidden.getContext('2d');
    if (hCtx) {
      MYSTERY_ITEMS[roundIndex % MYSTERY_ITEMS.length].draw(hCtx, 400, 340);
    }
    hiddenCanvasRef.current = hidden;

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Render pixelated canvas according to timeLeft
  useEffect(() => {
    if (gameState !== 'playing' && gameState !== 'round_solved') return;
    const canvas = canvasRef.current;
    const hidden = hiddenCanvasRef.current;
    if (!canvas || !hidden) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    if (isRevealed) {
      // Draw 100% sharp image
      ctx.drawImage(hidden, 0, 0, width, height);
      return;
    }

    // Determine pixel block size: starts at 40px down to 2px
    // 25s left -> 40px, 0s left -> 2px
    const ratio = Math.max(0, timeLeft / totalTime);
    const pixelSize = Math.max(2, Math.floor(ratio * 36) + 2);

    // Draw offscreen scaled down
    const scaledW = Math.max(2, Math.floor(width / pixelSize));
    const scaledH = Math.max(2, Math.floor(height / pixelSize));

    ctx.imageSmoothingEnabled = false;

    const temp = document.createElement('canvas');
    temp.width = scaledW;
    temp.height = scaledH;
    const tCtx = temp.getContext('2d');
    if (tCtx) {
      tCtx.drawImage(hidden, 0, 0, scaledW, scaledH);
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(temp, 0, 0, scaledW, scaledH, 0, 0, width, height);
    }
  }, [timeLeft, isRevealed, gameState, currentRound]);

  // Round Timer Loop
  useEffect(() => {
    if (gameState !== 'playing' || isRevealed) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, isRevealed, currentRound]);

  // When time expires
  const handleTimeOut = () => {
    setIsRevealed(true);
    soundManager.playGameOver();
    setFeedback(`Time's up! The answer was ${currentItem.name}!`);
    setTimeout(() => {
      nextRoundOrEnd();
    }, 3000);
  };

  // Submit guess
  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameState !== 'playing' || isRevealed) return;

    const trimmed = guessInput.trim().toUpperCase();
    if (!trimmed) return;

    if (trimmed === currentItem.name) {
      // Correct!
      setIsRevealed(true);
      soundManager.playVictory();
      const points = Math.round(timeLeft * 38 + 50);
      setRoundScore(points);
      setTotalScore((s) => s + points);
      setFeedback(`Correct! It's ${currentItem.name}! (+${points} PTS)`);
      setTimeout(() => {
        nextRoundOrEnd();
      }, 2500);
    } else {
      soundManager.playTick();
      setFeedback(`"${trimmed}" is incorrect. Keep watching the pixels!`);
      setTimeout(() => setFeedback(null), 1500);
    }
    setGuessInput('');
  };

  const nextRoundOrEnd = () => {
    if (currentRound + 1 >= MYSTERY_ITEMS.length) {
      setGameState('game_over');
      updateStats({
        gamesPlayed: 1,
        totalScore: totalScore,
        pixelsGuessed: MYSTERY_ITEMS.length,
      });

      if (aiConfig?.withBet) {
        setWagerWon(true);
        setShowWagerModal(true);
      }
    } else {
      startRound(currentRound + 1);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in font-sans select-none">
      {/* VS BOT Active Wager Bar */}
      <VsBotWagerBanner aiConfig={aiConfig} gameTitle="Pixel Reveal Mystery" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          onClick={onBackToHub}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Arcade Hub</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white leading-none">
              Pixel Reveal Mystery
            </h2>
            <span className="text-[11px] font-bold text-cyan-500">
              Round {currentRound + 1} / {MYSTERY_ITEMS.length}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-bold block leading-none">SCORE</span>
          <span className="text-sm font-black text-cyan-500">{totalScore} PTS</span>
        </div>
      </div>

      {/* INTRO SCREEN */}
      {gameState === 'intro' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-xl"
        >
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-500 flex items-center justify-center shadow-2xl shadow-blue-500/30 text-white">
            <Eye className="w-12 h-12" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">
              Unblur & Guess the Secret Drawing!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              A high-resolution illustration starts completely pixelated and blurry. As the timer ticks down, it slowly sharpens into focus. Guess correctly as early as possible to earn maximum bonus points!
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col items-center">
              <Clock className="w-6 h-6 text-cyan-500 mb-1" />
              <p className="font-bold text-slate-800 dark:text-slate-200">25s Timer</p>
              <p className="text-[10px] text-slate-500">Points decay per sec</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col items-center">
              <HelpCircle className="w-6 h-6 text-blue-500 mb-1" />
              <p className="font-bold text-slate-800 dark:text-slate-200">Dynamic Hints</p>
              <p className="text-[10px] text-slate-500">Category & letters</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col items-center">
              <Trophy className="w-6 h-6 text-indigo-500 mb-1" />
              <p className="font-bold text-slate-800 dark:text-slate-200">5 Rounds</p>
              <p className="text-[10px] text-slate-500">Total high score</p>
            </div>
          </div>

          <button
            onClick={handleStartGame}
            className="px-8 py-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 transition-all shadow-xl shadow-blue-600/30 hover:scale-105 active:scale-95"
          >
            <span>Start Pixel Mystery</span>
          </button>
        </motion.div>
      )}

      {/* ACTIVE GAMEPLAY */}
      {gameState === 'playing' && (
        <div className="space-y-6">
          {/* Mystery Stage */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-xl relative overflow-hidden flex flex-col items-center">
            {/* Canvas Stage */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-200 dark:border-slate-800">
              <canvas
                ref={canvasRef}
                width={400}
                height={340}
                className="w-full max-w-[380px] h-[320px] object-cover block"
              />
              {/* Blur Level Tag */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md text-[10px] font-mono font-bold text-white border border-white/10 flex items-center gap-1">
                {isRevealed ? (
                  <>
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>100% SHARP</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3 text-cyan-400" />
                    <span>Resolution: {Math.round(100 - (timeLeft / totalTime) * 80)}%</span>
                  </>
                )}
              </div>
            </div>

            {/* Time Bar */}
            <div className="w-full max-w-md space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Time Remaining:</span>
                </span>
                <span className="font-mono text-cyan-500 font-black text-sm">{timeLeft}s</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"
                  style={{ width: `${(timeLeft / totalTime) * 100}%` }}
                />
              </div>
            </div>

            {/* Hint Cards Bar */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <div className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                Category: <span className="text-cyan-500">{currentItem.category}</span>
              </div>
              <div className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                Letters: <span className="font-mono text-cyan-500">{currentItem.name.length}</span>
              </div>
              {timeLeft <= 10 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold flex items-center gap-1.5"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Hint: {currentItem.hint}</span>
                </motion.div>
              )}
            </div>

            {/* Feedback Notification */}
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-xs font-black"
              >
                {feedback}
              </motion.div>
            )}
          </div>

          {/* Typing Input */}
          <form onSubmit={handleGuessSubmit} className="relative max-w-xl mx-auto">
            <input
              ref={inputRef}
              type="text"
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value.toUpperCase())}
              disabled={isRevealed}
              placeholder="Type what you see & press ENTER..."
              className="w-full px-6 py-4 text-center uppercase tracking-widest text-lg font-black bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl border-2 border-slate-200 dark:border-slate-800 focus:border-cyan-500 focus:outline-none shadow-lg disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isRevealed || !guessInput.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 transition-all shadow-md shadow-cyan-600/20 flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>GUESS</span>
            </button>
          </form>
        </div>
      )}

      {/* GAME OVER SCREEN */}
      {gameState === 'game_over' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-xl"
        >
          <div className="w-20 h-20 mx-auto rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-inner text-cyan-500">
            <Trophy className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Pixel Master Completed!
            </h2>
            <p className="text-xs text-slate-500">
              You cleared all {MYSTERY_ITEMS.length} mystery reveals!
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-w-xs mx-auto">
            <span className="text-xs text-slate-400 font-bold block">FINAL REVEAL SCORE</span>
            <span className="text-3xl font-black text-cyan-500">{totalScore} PTS</span>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleStartGame}
              className="px-6 py-3 rounded-2xl font-black text-xs text-white bg-cyan-600 hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-600/20 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>
            <button
              onClick={onBackToHub}
              className="px-6 py-3 rounded-2xl font-bold text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              Back to Arcade Hub
            </button>
          </div>
        </motion.div>
      )}

      {/* VS BOT Wager Payout / Rematch Modal */}
      <VsBotPayoutModal
        isOpen={showWagerModal}
        won={wagerWon}
        aiConfig={aiConfig}
        gameTitle="Pixel Reveal Mystery"
        onRematch={() => {
          setShowWagerModal(false);
          handleStartGame();
        }}
        onBackToHub={onBackToHub}
      />
    </div>
  );
};
