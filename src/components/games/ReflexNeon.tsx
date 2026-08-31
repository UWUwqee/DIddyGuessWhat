import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Flame,
  Activity,
  Award,
  Volume2,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../utils/soundEffects';

interface NoteOrb {
  id: number;
  lane: number; // 0, 1, 2, 3
  y: number; // 0 to 100%
  hit: boolean;
  missed: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

const LANES = [
  { id: 0, label: 'D', name: 'CYAN', color: '#06B6D4', glow: 'shadow-cyan-500/50', border: 'border-cyan-400', key: 'd' },
  { id: 1, label: 'F', name: 'MAGENTA', color: '#EC4899', glow: 'shadow-pink-500/50', border: 'border-pink-400', key: 'f' },
  { id: 2, label: 'J', name: 'AMBER', color: '#F59E0B', glow: 'shadow-amber-500/50', border: 'border-amber-400', key: 'j' },
  { id: 3, label: 'K', name: 'LIME', color: '#10B981', glow: 'shadow-emerald-500/50', border: 'border-emerald-400', key: 'k' },
];

export const ReflexNeon: React.FC<{ onBackToLobby?: () => void }> = ({ onBackToLobby }) => {
  const { user, updateStats } = useAuth();

  const [gameState, setGameState] = useState<'idle' | 'playing' | 'game_over'>('idle');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);

  const scoreRef = useRef(0);
  const maxComboRef = useRef(0);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    maxComboRef.current = maxCombo;
  }, [maxCombo]);
  const [health, setHealth] = useState(100);
  const [lastJudgment, setLastJudgment] = useState<{ text: string; color: string } | null>(null);
  const [songProgress, setSongProgress] = useState(0); // 0 to 100%
  const [perfectCount, setPerfectCount] = useState(0);
  const [greatCount, setGreatCount] = useState(0);
  const [goodCount, setGoodCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [activeLanePress, setActiveLanePress] = useState<{ [key: number]: boolean }>({});

  const notesRef = useRef<NoteOrb[]>([]);
  const nextNoteId = useRef(1);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const songTimeRef = useRef<number>(0);
  const songDuration = 45; // 45-second energetic reflex run

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  // Spawn dynamic explosion particles
  const spawnParticles = (laneIdx: number, rating: string) => {
    const laneWidth = 100 / 4;
    const originX = (laneIdx + 0.5) * laneWidth;
    const originY = 88; // Target hit line %

    const color =
      rating === 'PERFECT'
        ? '#FACC15'
        : rating === 'GREAT'
        ? LANES[laneIdx].color
        : '#FFFFFF';

    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      particlesRef.current.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 4 + 2,
        life: 1,
      });
    }
  };

  // Trigger lane hit action
  const handleLaneHit = useCallback(
    (laneIdx: number) => {
      if (gameState !== 'playing') return;

      setActiveLanePress((prev) => ({ ...prev, [laneIdx]: true }));
      setTimeout(() => {
        setActiveLanePress((prev) => ({ ...prev, [laneIdx]: false }));
      }, 120);

      // Find closest unhit note in this lane near hit line (88%)
      const hitLineY = 88;
      const threshold = 18;

      let closestNote: NoteOrb | null = null;
      let minDistance = Infinity;

      notesRef.current.forEach((n) => {
        if (n.lane === laneIdx && !n.hit && !n.missed) {
          const dist = Math.abs(n.y - hitLineY);
          if (dist < threshold && dist < minDistance) {
            minDistance = dist;
            closestNote = n;
          }
        }
      });

      if (closestNote) {
        (closestNote as NoteOrb).hit = true;
        let points = 0;
        let judgmentText = '';
        let judgmentColor = '';
        let ratingSound: 'perfect' | 'great' | 'good' = 'good';

        if (minDistance <= 5) {
          judgmentText = 'PERFECT!';
          judgmentColor = 'text-yellow-400';
          points = 300;
          ratingSound = 'perfect';
          setPerfectCount((c) => c + 1);
        } else if (minDistance <= 11) {
          judgmentText = 'GREAT!';
          judgmentColor = 'text-cyan-400';
          points = 180;
          ratingSound = 'great';
          setGreatCount((c) => c + 1);
        } else {
          judgmentText = 'GOOD';
          judgmentColor = 'text-emerald-400';
          points = 90;
          ratingSound = 'good';
          setGoodCount((c) => c + 1);
        }

        soundManager.playNeonHit(ratingSound);
        spawnParticles(laneIdx, judgmentText.replace('!', ''));

        setCombo((c) => {
          const next = c + 1;
          if (next > maxCombo) setMaxCombo(next);
          return next;
        });

        // Combo multiplier formula (1x up to 8x)
        const multiplier = Math.min(8, 1 + Math.floor(combo / 5) * 0.5);
        setScore((s) => s + Math.round(points * multiplier));
        setHealth((h) => Math.min(100, h + 3));

        setLastJudgment({ text: `${judgmentText} +${Math.round(points * multiplier)}`, color: judgmentColor });
      } else {
        // Empty tap / ghost hit
      }
    },
    [gameState, combo, maxCombo]
  );

  // Keyboard handler (D, F, J, K or 1, 2, 3, 4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'd' || key === '1') handleLaneHit(0);
      else if (key === 'f' || key === '2') handleLaneHit(1);
      else if (key === 'j' || key === '3') handleLaneHit(2);
      else if (key === 'k' || key === '4') handleLaneHit(3);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleLaneHit]);

  // Start game session
  const startGame = () => {
    notesRef.current = [];
    particlesRef.current = [];
    nextNoteId.current = 1;
    songTimeRef.current = 0;
    spawnTimerRef.current = 0;
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setHealth(100);
    setPerfectCount(0);
    setGreatCount(0);
    setGoodCount(0);
    setMissCount(0);
    setLastJudgment(null);
    setSongProgress(0);
    setGameState('playing');
    soundManager.playTurnStart();
  };

  // Main 60FPS Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    let beatCounter = 0;

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      songTimeRef.current += dt;
      const progress = Math.min(100, (songTimeRef.current / songDuration) * 100);
      setSongProgress(progress);

      // Play rhythmic pulsing bass kick
      beatCounter += dt;
      if (beatCounter >= 0.55) {
        beatCounter = 0;
        soundManager.playNeonBeat(0);
      }

      // Check for song completion
      if (songTimeRef.current >= songDuration) {
        setGameState('game_over');
        soundManager.playVictory();
        if (user) {
          updateStats({
            totalScore: (user.stats?.totalScore || 0) + scoreRef.current,
            reflexCombosHit: Math.max(user.stats?.reflexCombosHit || 0, maxComboRef.current),
          });
        }
        return;
      }

      // Spawn falling energy notes
      spawnTimerRef.current += dt;
      const spawnInterval = Math.max(0.32, 0.65 - (songTimeRef.current / songDuration) * 0.28);

      if (spawnTimerRef.current >= spawnInterval) {
        spawnTimerRef.current = 0;
        const lane = Math.floor(Math.random() * 4);
        notesRef.current.push({
          id: nextNoteId.current++,
          lane,
          y: 0,
          hit: false,
          missed: false,
        });

        // Double note chance on higher time
        if (songTimeRef.current > 15 && Math.random() > 0.65) {
          const secondLane = (lane + 1 + Math.floor(Math.random() * 3)) % 4;
          notesRef.current.push({
            id: nextNoteId.current++,
            lane: secondLane,
            y: 0,
            hit: false,
            missed: false,
          });
        }
      }

      // Move notes down
      const speed = 72 + (songTimeRef.current / songDuration) * 20; // % per second
      notesRef.current.forEach((n) => {
        n.y += speed * dt;

        // Check if passed hit line (miss)
        if (!n.hit && !n.missed && n.y > 98) {
          n.missed = true;
          setCombo(0);
          setMissCount((c) => c + 1);
          setHealth((h) => {
            const next = Math.max(0, h - 8);
            if (next <= 0) {
              setGameState('game_over');
              soundManager.playWrongGuess();
            }
            return next;
          });
          soundManager.playNeonHit('miss');
          setLastJudgment({ text: 'MISS...', color: 'text-rose-500' });
        }
      });

      // Filter off-screen notes
      notesRef.current = notesRef.current.filter((n) => n.y <= 105 && !n.hit);

      // Render Particle Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const width = canvas.width;
          const height = canvas.height;

          particlesRef.current.forEach((p) => {
            p.x += p.vx * dt * 8;
            p.y += p.vy * dt * 8;
            p.life -= dt * 2.2;

            if (p.life > 0) {
              ctx.fillStyle = p.color;
              ctx.globalAlpha = p.life;
              ctx.beginPath();
              ctx.arc((p.x / 100) * width, (p.y / 100) * height, p.size, 0, Math.PI * 2);
              ctx.fill();
            }
          });
          ctx.globalAlpha = 1;
          particlesRef.current = particlesRef.current.filter((p) => p.life > 0);
        }
      }

      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, user, updateStats]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 animate-fade-in p-2 sm:p-4">
      {/* Header Stat Bar */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/25">
            <Zap className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Neon Reflex
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/40 text-pink-300 text-[10px] font-black uppercase tracking-wider">
                Rhythm Strike
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Tap glowing neon energy lanes in sync with the beat. Strike precision combos!
            </p>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="px-3.5 py-1.5 rounded-2xl bg-slate-800/90 border border-slate-700 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none">
              Score
            </span>
            <span className="text-base font-black text-yellow-400">{score}</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-2xl bg-slate-800/90 border border-slate-700 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none flex items-center justify-center gap-0.5">
              <Flame className="w-2.5 h-2.5 text-pink-400" />
              <span>Combo</span>
            </span>
            <span className="text-base font-black text-pink-400">{combo}x</span>
          </div>

          {/* Health Shield */}
          <div className="px-3.5 py-1.5 rounded-2xl bg-slate-800/90 border border-slate-700 text-center min-w-[70px]">
            <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none">
              Energy
            </span>
            <span
              className={`text-base font-black ${
                health > 50 ? 'text-emerald-400' : health > 25 ? 'text-amber-400' : 'text-rose-500 animate-pulse'
              }`}
            >
              {health}%
            </span>
          </div>
        </div>
      </div>

      {gameState === 'idle' ? (
        /* Welcome / Instructions Card */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-pink-500/30">
            <Activity className="w-10 h-10 animate-pulse" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Ready for the Neon Velocity Run?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Notes drop down 4 cybernetic lanes. Tap the corresponding lane keys (<strong>D, F, J, K</strong>) or click the touch buttons right when the glowing orbs touch the strike bar!
            </p>
          </div>

          {/* 4 Lanes Preview */}
          <div className="grid grid-cols-4 gap-2.5 max-w-md mx-auto pt-2">
            {LANES.map((lane) => (
              <div
                key={lane.id}
                className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center space-y-1"
              >
                <span className="text-lg font-black text-white">{lane.label}</span>
                <span className="text-[10px] uppercase font-bold block" style={{ color: lane.color }}>
                  {lane.name}
                </span>
              </div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white font-black text-sm uppercase tracking-wider flex items-center gap-2 mx-auto shadow-xl shadow-pink-500/30"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>Launch Rhythm Run</span>
          </motion.button>
        </div>
      ) : gameState === 'playing' ? (
        /* Active Rhythm Arena Canvas */
        <div className="space-y-4">
          {/* Top Song Progress Bar */}
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-400 transition-all duration-100"
              style={{ width: `${songProgress}%` }}
            />
          </div>

          {/* 4-Lane Falling Arena */}
          <div className="relative w-full h-[400px] sm:h-[460px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-3xl border-2 border-slate-800 overflow-hidden shadow-2xl">
            {/* Particle Canvas Overlay */}
            <canvas
              ref={canvasRef}
              width={600}
              height={460}
              className="absolute inset-0 w-full h-full pointer-events-none z-20"
            />

            {/* Judgment Pop-Up */}
            <AnimatePresence>
              {lastJudgment && (
                <motion.div
                  key={lastJudgment.text + Date.now()}
                  initial={{ opacity: 1, scale: 1.3, y: 0 }}
                  animate={{ opacity: 0, scale: 0.9, y: -25 }}
                  transition={{ duration: 0.45 }}
                  className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 font-black text-2xl sm:text-3xl tracking-wider select-none pointer-events-none ${lastJudgment.color}`}
                >
                  {lastJudgment.text}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 4 Neon Highway Lanes */}
            <div className="grid grid-cols-4 h-full relative z-10 divide-x divide-slate-800/80">
              {LANES.map((lane) => (
                <div
                  key={lane.id}
                  onClick={() => handleLaneHit(lane.id)}
                  className={`relative h-full flex flex-col justify-end transition-colors cursor-pointer select-none ${
                    activeLanePress[lane.id] ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  {/* Highway Lane Track Background Glow */}
                  <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ backgroundColor: lane.color }}
                  />

                  {/* Falling Notes */}
                  {notesRef.current
                    .filter((n) => n.lane === lane.id && !n.hit)
                    .map((n) => (
                      <div
                        key={n.id}
                        className="absolute left-1/2 -translate-x-1/2 w-12 sm:w-16 h-8 sm:h-10 rounded-2xl flex items-center justify-center pointer-events-none shadow-lg"
                        style={{
                          top: `${n.y}%`,
                          backgroundColor: lane.color,
                          boxShadow: `0 0 20px ${lane.color}`,
                        }}
                      >
                        <div className="w-4 h-4 rounded-full bg-white/90 shadow-sm" />
                      </div>
                    ))}

                  {/* Bottom Hit Receptor Pad */}
                  <div
                    className={`w-full py-4 sm:py-5 border-t-4 text-center transition-all ${
                      activeLanePress[lane.id]
                        ? 'bg-white/20 border-white scale-98'
                        : `${lane.border} bg-slate-900/90`
                    }`}
                  >
                    <span className="text-xl sm:text-2xl font-black text-white">{lane.label}</span>
                    <span
                      className="block text-[9px] uppercase font-bold tracking-wider"
                      style={{ color: lane.color }}
                    >
                      {lane.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Target Hit Line Horizontal Glow */}
            <div
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-pink-400 to-emerald-400 pointer-events-none z-15 opacity-80 shadow-lg shadow-pink-500/50"
              style={{ top: '88%' }}
            />
          </div>

          {/* Quick Controls Info */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-2">
            <span>Keys: <strong>[D] [F] [J] [K]</strong> or Tap Screen Columns</span>
            <span>Speed: <strong>{Math.round(72 + (songTimeRef.current / songDuration) * 20)} BPM</strong></span>
          </div>
        </div>
      ) : (
        /* Game Over / Results Screen */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-10 text-center space-y-6 shadow-2xl max-w-xl mx-auto"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-pink-500/30">
            <Trophy className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {health > 0 ? 'Stage Complete!' : 'Energy Depleted!'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {health > 0
                ? 'Hyper-reflex timing mastery unlocked!'
                : 'Keep practicing to master high-velocity timing.'}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Score</span>
              <span className="text-lg font-black text-yellow-400">{score}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Max Combo</span>
              <span className="text-lg font-black text-pink-400">{maxCombo}x</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Perfects</span>
              <span className="text-lg font-black text-emerald-400">{perfectCount}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Misses</span>
              <span className="text-lg font-black text-rose-400">{missCount}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={startGame}
              className="px-6 py-3.5 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-pink-600/30 transition-all hover:scale-105"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Stage</span>
            </button>

            {onBackToLobby && (
              <button
                onClick={onBackToLobby}
                className="px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700"
              >
                Back to Arcade Hub
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};
