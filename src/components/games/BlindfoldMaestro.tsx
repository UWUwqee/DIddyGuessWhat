import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  EyeOff,
  Eye,
  Sparkles,
  Trophy,
  RotateCcw,
  ArrowLeft,
  Flame,
  Palette,
  CheckCircle,
  Clock,
  Theater,
  Dice5,
  Volume2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../utils/soundEffects';

interface BlindfoldMaestroProps {
  onBackToHub: () => void;
}

const HILARIOUS_PROMPTS = [
  'A cat piloting a supersonic rocket',
  'A giraffe wearing sunglasses on a skateboard',
  'A cute dinosaur drinking bubble tea',
  'An alien eating a giant slice of pizza',
  'A friendly robot walking a dog',
  'An astronaut surfing on a rainbow',
  'A monkey wearing a chef hat baking a cake',
  'A wizard frog casting a lightning spell',
  'A pirate parrot holding a treasure chest',
  'A penguin dancing disco under a spotlight',
];

const AI_CRITIQUES = [
  '“Astonishing abstract masterpiece! The positioning defies conventional physics in the most delightful way!”',
  '“Picasso would shed a tear of pure joy looking at this blindfold composition!”',
  '“Incredible bravura! We can almost tell where the face was supposed to go!”',
  '“Pure chaotic energy! An avant-garde triumph of blind artistic courage!”',
  '“Sensational spatial imagination! 10/10 for boldness and comedy!”',
];

export const BlindfoldMaestro: React.FC<BlindfoldMaestroProps> = ({ onBackToHub }) => {
  const { user, updateStats } = useAuth();

  const [gameState, setGameState] = useState<'intro' | 'drawing' | 'revealed'>('intro');
  const [prompt, setPrompt] = useState(HILARIOUS_PROMPTS[0]);
  const [timeLeft, setTimeLeft] = useState(25);
  const [totalTime] = useState(25);
  const [curtainOpen, setCurtainOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#6366F1');
  const [strokeSize, setStrokeSize] = useState(6);
  const [critique, setCritique] = useState('');
  const [aiScore, setAiScore] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const strokesRef = useRef<
    { color: string; size: number; points: { x: number; y: number }[] }[]
  >([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Pick random prompt
  const handleRandomizePrompt = () => {
    const next = HILARIOUS_PROMPTS[Math.floor(Math.random() * HILARIOUS_PROMPTS.length)];
    setPrompt(next);
    soundManager.playTick();
  };

  const handleStartDrawing = () => {
    setGameState('drawing');
    setTimeLeft(25);
    setCurtainOpen(false);
    strokesRef.current = [];

    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    soundManager.playRoundStart();
  };

  // Drawing timer loop
  useEffect(() => {
    if (gameState !== 'drawing') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleFinishTime();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  // Finish drawing and trigger curtain reveal
  const handleFinishTime = () => {
    setGameState('revealed');
    soundManager.playVictory();

    // Generate AI commentary & score
    const randCrit = AI_CRITIQUES[Math.floor(Math.random() * AI_CRITIQUES.length)];
    const scoreVal = Math.floor(750 + Math.random() * 250);
    setCritique(randCrit);
    setAiScore(scoreVal);

    // Trigger curtain animation open
    setTimeout(() => {
      setCurtainOpen(true);
      soundManager.playVictory();
      renderCompleteStrokes();
    }, 400);

    updateStats({
      drawingsCompleted: 1,
      totalScore: scoreVal,
      blindfoldScores: scoreVal,
    });
  };

  // Canvas Mouse & Touch Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'drawing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isDrawingRef.current = true;
    strokesRef.current.push({
      color: selectedColor,
      size: strokeSize,
      points: [{ x, y }],
    });

    soundManager.playTick();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || gameState !== 'drawing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const currentStroke = strokesRef.current[strokesRef.current.length - 1];
    if (currentStroke) {
      currentStroke.points.push({ x, y });
    }

    // In blindfold mode, we DO NOT draw visible lines on the canvas!
    // Instead we just draw a temporary spark ripple on overlay
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
  };

  // Render the full hidden drawing onto canvas when curtain opens
  const renderCompleteStrokes = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    strokesRef.current.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in font-sans select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          onClick={onBackToHub}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Arcade Hub</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white">
            <Theater className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white leading-none">
              Blindfold Maestro
            </h2>
            <span className="text-[11px] font-bold text-purple-500">Blind Drawing Challenge</span>
          </div>
        </div>

        {gameState === 'drawing' && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 font-mono text-sm font-black">
            <Clock className="w-4 h-4" />
            <span>{timeLeft}s</span>
          </div>
        )}
      </div>

      {/* INTRO SCREEN */}
      {gameState === 'intro' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-xl"
        >
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-purple-600 via-pink-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-purple-600/30 text-white">
            <EyeOff className="w-12 h-12" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">
              Draw Completely Blindfolded!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              You will be given a hilarious drawing prompt, but you <b>WON'T see any lines</b> while you sketch! When the timer ends, the grand curtain pulls back to reveal your masterpiece!
            </p>
          </div>

          {/* Random Prompt Box */}
          <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 max-w-md mx-auto space-y-2">
            <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
              YOUR SECRET TOPIC:
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              "{prompt}"
            </h3>
            <button
              onClick={handleRandomizePrompt}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-1"
            >
              <Dice5 className="w-3.5 h-3.5" />
              <span>Shuffle Another Topic</span>
            </button>
          </div>

          <button
            onClick={handleStartDrawing}
            className="px-8 py-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all shadow-xl shadow-purple-600/30 hover:scale-105 active:scale-95"
          >
            <span>Put on Blindfold & Draw!</span>
          </button>
        </motion.div>
      )}

      {/* DRAWING / REVEAL STAGE */}
      {(gameState === 'drawing' || gameState === 'revealed') && (
        <div className="space-y-5">
          {/* Prompt Banner */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Draw Topic:</span>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">{prompt}</h4>
              </div>
            </div>

            {gameState === 'drawing' && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold animate-pulse">
                <EyeOff className="w-3.5 h-3.5" />
                <span>Blindfold Active (Inks Hidden)</span>
              </div>
            )}
          </div>

          {/* Canvas & Theatrical Curtain Stage */}
          <div className="relative rounded-3xl overflow-hidden border-4 border-slate-200 dark:border-slate-800 shadow-2xl bg-white max-w-xl mx-auto h-[380px] sm:h-[420px] flex items-center justify-center">
            {/* The Actual Canvas */}
            <canvas
              ref={canvasRef}
              width={560}
              height={420}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="w-full h-full touch-none cursor-crosshair block"
            />

            {/* Blindfold Dark Overlay while drawing */}
            {gameState === 'drawing' && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white pointer-events-none space-y-3">
                <motion.div
                  animate={{ scale: [1, 1.15, 1], rotate: [-5, 5, -5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-16 h-16 rounded-2xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300"
                >
                  <EyeOff className="w-8 h-8" />
                </motion.div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">Blindfold Mode is ON</h3>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Drag your finger or cursor on screen to sketch from imagination!
                  </p>
                </div>
              </div>
            )}

            {/* Theatrical Curtain Reveal Animation */}
            {gameState === 'revealed' && (
              <div className="absolute inset-0 pointer-events-none flex">
                {/* Left Curtain Panel */}
                <motion.div
                  initial={{ x: 0 }}
                  animate={{ x: curtainOpen ? '-100%' : 0 }}
                  transition={{ duration: 1.2, ease: 'easeInOut' }}
                  className="w-1/2 h-full bg-gradient-to-r from-red-900 via-rose-700 to-red-800 border-r-4 border-amber-400 shadow-2xl flex items-center justify-end pr-4 text-amber-300"
                >
                  <Theater className="w-10 h-10" />
                </motion.div>
                {/* Right Curtain Panel */}
                <motion.div
                  initial={{ x: 0 }}
                  animate={{ x: curtainOpen ? '100%' : 0 }}
                  transition={{ duration: 1.2, ease: 'easeInOut' }}
                  className="w-1/2 h-full bg-gradient-to-l from-red-900 via-rose-700 to-red-800 border-l-4 border-amber-400 shadow-2xl flex items-center justify-start pl-4 text-amber-300"
                >
                  <Sparkles className="w-10 h-10" />
                </motion.div>
              </div>
            )}
          </div>

          {/* Color & Pen Controls (while drawing) */}
          {gameState === 'drawing' && (
            <div className="flex items-center justify-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md mx-auto">
              {['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#000000'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    selectedColor === c ? 'scale-125 ring-2 ring-indigo-500' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

              <button
                type="button"
                onClick={handleFinishTime}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all shadow-md"
              >
                Reveal Now! 🎭
              </button>
            </div>
          )}

          {/* AI Critique & Score (when revealed) */}
          {gameState === 'revealed' && curtainOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-xl max-w-xl mx-auto"
            >
              <div className="space-y-1">
                <span className="text-xs uppercase font-black text-purple-600 dark:text-purple-400 tracking-wider">
                  NEURAL AI JUDGE REVIEW
                </span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 italic">
                  {critique}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-around text-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">SCORE</span>
                  <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                    +{aiScore} PTS
                  </span>
                </div>
                <div className="h-8 w-px bg-indigo-200 dark:bg-indigo-800" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">CHAOS RATING</span>
                  <span className="text-xl font-black text-rose-500">9.8 / 10 🔥</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleStartDrawing}
                  className="px-6 py-2.5 rounded-xl font-black text-xs text-white bg-purple-600 hover:bg-purple-500 transition-all shadow-md shadow-purple-600/20 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Try Another Blind Drawing</span>
                </button>
                <button
                  onClick={onBackToHub}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Back to Arcade Hub
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};
