import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  Flame,
  CheckCircle,
  Timer,
  Award,
  Eraser,
  Palette,
  Eye,
  HelpCircle,
  Volume2,
  Bot,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../utils/soundEffects';
import { AI_SKETCH_PROMPTS, AiChallengePrompt } from '../../data/arcadeData';
import { AiGameConfig } from '../VsAiArena';
import { VsBotWagerBanner, VsBotPayoutModal } from '../VsBotWagerManager';

const BRUSH_COLORS = [
  '#000000',
  '#EF4444',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#78350F',
  '#64748B',
];

export const AiSketchGuesser: React.FC<{ onBackToHub: () => void; aiConfig?: AiGameConfig | null }> = ({
  onBackToHub,
  aiConfig = null,
}) => {
  const { user, updateStats } = useAuth();

  const [currentPrompt, setCurrentPrompt] = useState<AiChallengePrompt>(AI_SKETCH_PROMPTS[0]);
  const [gameState, setGameState] = useState<'ready' | 'drawing' | 'success' | 'timeout'>('ready');
  const [timeLeft, setTimeLeft] = useState(25);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState(1);
  const [aiSpeech, setAiSpeech] = useState<string>('Ready whenever you are! Click "Start Challenge"!');
  const [aiConfidence, setAiConfidence] = useState<number>(0);
  const [aiMood, setAiMood] = useState<'idle' | 'thinking' | 'confused' | 'excited' | 'celebrating'>('idle');

  // Wager Modal state
  const [showWagerModal, setShowWagerModal] = useState(false);
  const [wagerWon, setWagerWon] = useState(false);

  // Drawing canvas state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(6);
  const [isEraser, setIsEraser] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);

  // Pick random prompt excluding current
  const pickNewPrompt = useCallback(() => {
    const available = AI_SKETCH_PROMPTS.filter((p) => p.id !== currentPrompt?.id);
    const chosen = available[Math.floor(Math.random() * available.length)] || AI_SKETCH_PROMPTS[0];
    setCurrentPrompt(chosen);
    return chosen;
  }, [currentPrompt]);

  // Clear Canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setStrokeCount(0);
  };

  // Start Drawing Challenge
  const handleStartChallenge = () => {
    const prompt = pickNewPrompt();
    clearCanvas();
    setTimeLeft(25);
    setAiConfidence(0);
    setAiMood('thinking');
    setAiSpeech(`Draw a "${prompt.word}"! I'm watching your strokes...`);
    setGameState('drawing');
    soundManager.playTurnStart();
  };

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (gameState !== 'drawing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = isEraser ? '#FFFFFF' : selectedColor;
    ctx.lineWidth = isEraser ? brushSize * 2.5 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || gameState !== 'drawing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setStrokeCount((prev) => prev + 1);
  };

  // Evaluate AI Guessing Progression
  useEffect(() => {
    if (gameState !== 'drawing' || strokeCount === 0) return;

    // Simulate AI Vision heuristic analysis based on strokes & time elapsed
    const evaluateGuess = async () => {
      // Calculate confidence based on strokes and feature thresholds
      const currentWord = currentPrompt.word;
      const targetStrokes = currentPrompt.difficulty === 'easy' ? 4 : currentPrompt.difficulty === 'medium' ? 6 : 8;
      
      const ratio = Math.min(1, strokeCount / targetStrokes);
      const randomNoise = (Math.random() * 0.15);
      const calculatedConfidence = Math.min(100, Math.round((ratio * 0.85 + randomNoise) * 100));
      
      setAiConfidence(calculatedConfidence);

      if (calculatedConfidence < 30) {
        setAiMood('thinking');
        const guesses = ['a line', 'a doodle', 'a curve', 'a scribble', 'a circle'];
        setAiSpeech(`I see ${guesses[strokeCount % guesses.length]}... keep drawing!`);
      } else if (calculatedConfidence < 65) {
        setAiMood('confused');
        const guesses = ['a potato', 'a hat', 'a mountain', 'a cloud', 'maybe a bird?'];
        setAiSpeech(`Is it ${guesses[strokeCount % guesses.length]}? Wait, I see shapes forming!`);
      } else if (calculatedConfidence < 85) {
        setAiMood('excited');
        setAiSpeech(`Getting very close! Is it something related to ${currentPrompt.category}?`);
      } else {
        // AI Correctly Guessed!
        setAiMood('celebrating');
        setAiSpeech(`YES! I know it! It's a "${currentWord}"! Amazing sketch!`);
        setGameState('success');

        const roundScore = Math.round(currentPrompt.points * (timeLeft / 25) + (streak + 1) * 20);
        setScore((prev) => prev + roundScore);
        setStreak((prev) => prev + 1);

        soundManager.playCorrectGuess();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });

        // Update lifetime player stats
        updateStats(
          {
            totalScore: roundScore,
            drawingsCompleted: 1,
            aiDrawsBeaten: (user?.stats?.aiDrawsBeaten || 0) + 1,
          },
          false
        );

        // If in wager bet mode, trigger wager victory payout
        if (aiConfig?.withBet) {
          setWagerWon(true);
          setShowWagerModal(true);
        }
      }
    };

    const timer = setTimeout(evaluateGuess, 400);
    return () => clearTimeout(timer);
  }, [strokeCount, gameState, currentPrompt, timeLeft, streak, updateStats, user?.stats?.aiDrawsBeaten, aiConfig]);

  // Countdown timer loop
  useEffect(() => {
    if (gameState !== 'drawing') return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setGameState('timeout');
          setAiMood('confused');
          setAiSpeech(`Oh no, time's up! The word was "${currentPrompt.word}". Good try!`);
          setStreak(0);
          soundManager.playCloseGuess();

          // If in wager mode, show defeat modal
          if (aiConfig?.withBet) {
            setWagerWon(false);
            setShowWagerModal(true);
          }
          return 0;
        }
        if (prev <= 6) {
          soundManager.playUrgentTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, currentPrompt, aiConfig]);

  // Initialize canvas on mount
  useEffect(() => {
    clearCanvas();
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 animate-fade-in font-sans">
      {/* VS BOT Active Wager Bar */}
      <VsBotWagerBanner aiConfig={aiConfig} gameTitle="AI Sketch Guesser" />

      {/* Top Bar with Mode Title & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHub}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-all"
          >
            ← Arcade Hub
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                AI Sketch Guesser
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Speed Draw
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Draw before time runs out. The AI neural engine will guess in real time!
            </p>
          </div>
        </div>

        {/* Score & Streak Counters */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 flex items-center gap-1.5 text-xs font-black">
            <Award className="w-4 h-4 text-amber-500" />
            <span>{score} Pts</span>
          </div>

          <div className="px-3 py-1.5 rounded-2xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 flex items-center gap-1.5 text-xs font-black">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>{streak}x Streak</span>
          </div>
        </div>
      </div>

      {/* Main Game Grid: Left Canvas, Right AI Bot Guesser */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Drawing Stage */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col space-y-3">
          {/* Challenge Prompt Header */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Your Prompt:</span>
              <span className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-3 py-0.5 rounded-xl border border-indigo-200 dark:border-indigo-800">
                {currentPrompt.word}
              </span>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                ({currentPrompt.category})
              </span>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-black">
              <Timer className={`w-4 h-4 ${timeLeft <= 6 ? 'text-rose-500 animate-bounce' : 'text-indigo-500'}`} />
              <span className={timeLeft <= 6 ? 'text-rose-600 dark:text-rose-400' : ''}>
                {timeLeft}s
              </span>
            </div>
          </div>

          {/* Interactive Drawing Canvas */}
          <div className="relative aspect-4/3 w-full bg-white rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-inner touch-none">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-full cursor-crosshair"
            />

            {/* Pre-Game Splash */}
            {gameState === 'ready' && (
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/30 animate-bounce text-white">
                  <Zap className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-xl font-black">Speed Sketch vs AI</h3>
                  <p className="text-xs text-slate-300">
                    Draw &quot;{currentPrompt.word}&quot; on the canvas! The AI will live-analyze your strokes and guess within 25 seconds.
                  </p>
                </div>
                <button
                  onClick={handleStartChallenge}
                  className="px-8 py-3 rounded-2xl font-black text-sm text-indigo-900 bg-white hover:bg-slate-100 shadow-xl transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-indigo-900" />
                  <span>Start Challenge</span>
                </button>
              </div>
            )}

            {/* Victory Splash */}
            {gameState === 'success' && (
              <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white space-y-3 animate-fade-in">
                <div className="w-16 h-16 rounded-3xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg animate-bounce">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-emerald-300">AI Guessed It!</h3>
                <p className="text-xs text-emerald-100 max-w-xs">
                  Your &quot;{currentPrompt.word}&quot; drawing was recognized with {aiConfidence}% neural confidence!
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setRound((r) => r + 1);
                      handleStartChallenge();
                    }}
                    className="px-6 py-2.5 rounded-xl font-black text-xs text-emerald-950 bg-emerald-300 hover:bg-emerald-200 transition-all shadow-lg"
                  >
                    Next Drawing →
                  </button>
                </div>
              </div>
            )}

            {/* Timeout Splash */}
            {gameState === 'timeout' && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white space-y-3 animate-fade-in">
                <div className="w-16 h-16 rounded-3xl bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-lg">
                  <Timer className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-rose-300">Time Expired!</h3>
                <p className="text-xs text-slate-300 max-w-xs">
                  The AI couldn&apos;t quite figure it out in time. Word was &quot;{currentPrompt.word}&quot;.
                </p>
                <button
                  onClick={handleStartChallenge}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg"
                >
                  Try Another Prompt
                </button>
              </div>
            )}
          </div>

          {/* Canvas Tools Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {/* Colors */}
            <div className="flex items-center gap-1.5">
              {BRUSH_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setSelectedColor(c);
                    setIsEraser(false);
                  }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    selectedColor === c && !isEraser
                      ? 'border-slate-900 dark:border-white scale-125 shadow-sm'
                      : 'border-transparent hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Tools */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsEraser(!isEraser)}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all ${
                  isEraser
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Eraser</span>
              </button>

              <button
                onClick={clearCanvas}
                className="p-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-rose-600 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live AI Companion Speech & Confidence */}
        <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
          {/* AI Avatar & Live Speech Bubble */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  scale: aiMood === 'excited' || aiMood === 'celebrating' ? [1, 1.15, 1] : 1,
                  rotate: aiMood === 'confused' ? [0, -10, 10, 0] : 0,
                }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 select-none"
              >
                {aiMood === 'celebrating' ? (
                  <Sparkles className="w-7 h-7 text-amber-300" />
                ) : aiMood === 'excited' ? (
                  <Zap className="w-7 h-7 text-yellow-300" />
                ) : aiMood === 'confused' ? (
                  <HelpCircle className="w-7 h-7 text-purple-200" />
                ) : (
                  <Eye className="w-7 h-7 text-white" />
                )}
              </motion.div>

              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Gemini Guesser AI
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Neural Vision Engine
                </span>
              </div>
            </div>

            {/* Animated Speech Bubble */}
            <motion.div
              key={aiSpeech}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 relative text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed"
            >
              <div className="absolute -top-2 left-6 w-4 h-4 bg-indigo-50 dark:bg-indigo-950 border-t border-l border-indigo-200 dark:border-indigo-800 rotate-45" />
              <p>&quot;{aiSpeech}&quot;</p>
            </motion.div>

            {/* Neural Confidence Gauge Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                <span>AI Confidence Meter</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono font-black">
                  {aiConfidence}%
                </span>
              </div>

              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${aiConfidence}%` }}
                  transition={{ duration: 0.3 }}
                  className={`h-full rounded-full transition-all ${
                    aiConfidence >= 80
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm'
                      : aiConfidence >= 40
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Quick Drawing Tip Card */}
          <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
              <span>Artist Hint:</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {currentPrompt.tips}
            </p>
          </div>
        </div>
      </div>

      {/* VS BOT Payout / Rematch Modal */}
      <VsBotPayoutModal
        isOpen={showWagerModal}
        won={wagerWon}
        aiConfig={aiConfig}
        gameTitle="AI Sketch Guesser"
        onRematch={() => {
          setShowWagerModal(false);
          handleStartChallenge();
        }}
        onBackToHub={onBackToHub}
      />
    </div>
  );
};
