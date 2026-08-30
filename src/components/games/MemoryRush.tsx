import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Brain,
  Play,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff,
  Timer,
  Star,
  Award,
  Eraser,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../utils/soundEffects';
import { MEMORY_SCENES } from '../../data/arcadeData';
import { MemoryScene } from '../../types';

export const MemoryRush: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
  const { user, updateStats } = useAuth();

  const [sceneIndex, setSceneIndex] = useState(0);
  const currentScene: MemoryScene = MEMORY_SCENES[sceneIndex % MEMORY_SCENES.length];

  const [phase, setPhase] = useState<'ready' | 'memorizing' | 'drawing' | 'scoring'>('ready');
  const [countdown, setCountdown] = useState(5);
  const [drawTimeLeft, setDrawTimeLeft] = useState(25);
  const [stars, setStars] = useState(0);
  const [userScore, setUserScore] = useState(0);

  // Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#EF4444');
  const [strokeCount, setStrokeCount] = useState(0);

  const startMemoryGame = () => {
    clearCanvas();
    setPhase('memorizing');
    setCountdown(5);
    setDrawTimeLeft(25);
    setStrokeCount(0);
    setStars(0);
    soundManager.playTurnStart();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Phase 1: 5-Second Memorization Loop
  useEffect(() => {
    if (phase !== 'memorizing') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase('drawing');
          soundManager.playTick();
          return 0;
        }
        soundManager.playTick();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // Phase 2: Drawing from Memory Loop
  useEffect(() => {
    if (phase !== 'drawing') return;

    const timer = setInterval(() => {
      setDrawTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          evaluateMemoryScore();
          return 0;
        }
        if (prev <= 6) {
          soundManager.playUrgentTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, strokeCount]);

  // Evaluate memory score and assign stars
  const evaluateMemoryScore = () => {
    setPhase('scoring');
    const baseStars = strokeCount >= 10 ? 3 : strokeCount >= 5 ? 2 : 1;
    const pointsGained = baseStars * 100 + drawTimeLeft * 5;

    setStars(baseStars);
    setUserScore(pointsGained);

    soundManager.playVictory();
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });

    updateStats(
      {
        totalScore: pointsGained,
        memoryStarsEarned: (user?.stats?.memoryStarsEarned || 0) + baseStars,
      },
      false
    );
  };

  // Canvas Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (phase !== 'drawing') return;
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
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || phase !== 'drawing') return;
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

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 animate-fade-in font-sans">
      {/* Header */}
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
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                🧠 Memory Doodle Rush
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                Visual Recall
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Memorize the flashed scene in 5 seconds, then reconstruct it from memory!
            </p>
          </div>
        </div>

        {/* Phase Indicator */}
        <div className="flex items-center gap-2">
          {phase === 'memorizing' && (
            <div className="px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-black flex items-center gap-1.5 animate-pulse">
              <Eye className="w-4 h-4" />
              <span>Memorize: {countdown}s</span>
            </div>
          )}
          {phase === 'drawing' && (
            <div className="px-3 py-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-black flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-indigo-500" />
              <span>Draw: {drawTimeLeft}s</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Showcase Arena */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        {/* Title */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">
            Target Scene: <b className="text-slate-900 dark:text-white">{currentScene.title}</b>
          </span>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            {currentScene.items.length} Elements to remember
          </span>
        </div>

        {/* Dynamic Display Area */}
        <div className="relative aspect-16/10 w-full rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-inner flex items-center justify-center bg-slate-100 dark:bg-slate-800">
          {/* Phase 0: Ready State */}
          {phase === 'ready' && (
            <div className="text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-cyan-600 flex items-center justify-center text-white shadow-xl shadow-cyan-500/30 mx-auto animate-bounce">
                <Brain className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Ready to Test Your Visual Memory?
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                You will have 5 seconds to look at an image scene. Then it will vanish and you must redraw the elements!
              </p>
              <button
                onClick={startMemoryGame}
                className="px-8 py-3 rounded-2xl font-black text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl transition-all"
              >
                Reveal Scene & Start
              </button>
            </div>
          )}

          {/* Phase 1: Memorizing (Show Target Scene with Visual Elements) */}
          {phase === 'memorizing' && (
            <div
              className="w-full h-full relative"
              style={{ backgroundColor: currentScene.backgroundColor }}
            >
              {currentScene.items.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="absolute flex flex-col items-center justify-center select-none"
                  style={{
                    left: `${(item.x / 1000) * 100}%`,
                    top: `${(item.y / 1000) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div
                    className="rounded-2xl shadow-lg flex items-center justify-center font-bold text-white text-xs p-2"
                    style={{
                      backgroundColor: item.color,
                      width: `${item.size}px`,
                      height: `${item.size * 0.8}px`,
                    }}
                  >
                    {item.name}
                  </div>
                </motion.div>
              ))}

              <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-xs font-black">
                Vanishing in {countdown}s...
              </div>
            </div>
          )}

          {/* Phase 2: Drawing from Memory */}
          {phase === 'drawing' && (
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-full bg-white cursor-crosshair touch-none"
            />
          )}

          {/* Phase 3: Scoring Results */}
          {phase === 'scoring' && (
            <div className="text-center p-6 space-y-4">
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3].map((star) => (
                  <motion.div
                    key={star}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: star * 0.2 }}
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= stars
                          ? 'text-yellow-400 fill-yellow-400 drop-shadow-md'
                          : 'text-slate-300 dark:text-slate-700'
                      }`}
                    />
                  </motion.div>
                ))}
              </div>

              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {stars === 3 ? 'Incredible Memory!' : stars === 2 ? 'Great Visual Recall!' : 'Nice Effort!'}
              </h3>
              <p className="text-xs text-slate-400">
                You earned +{userScore} XP points for your sketch.
              </p>

              <button
                onClick={() => {
                  setSceneIndex((prev) => prev + 1);
                  startMemoryGame();
                }}
                className="px-6 py-2.5 rounded-xl font-black text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all"
              >
                Next Memory Scene →
              </button>
            </div>
          )}
        </div>

        {/* Tools Palette for Drawing Phase */}
        {phase === 'drawing' && (
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              {['#000000', '#EF4444', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#78350F'].map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    selectedColor === c ? 'border-slate-900 dark:border-white scale-125' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <button
              onClick={evaluateMemoryScore}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm"
            >
              I&apos;m Done Drawing!
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
