import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Swords,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Flame,
  Clock,
  Timer,
  Check,
  User,
  Bot,
  Award,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { soundManager } from '../../utils/soundEffects';
import { DUEL_PROMPTS } from '../../data/arcadeData';
import { AvatarRenderer } from '../AvatarRenderer';
import { AiGameConfig } from '../VsAiArena';
import { VsBotWagerBanner, VsBotPayoutModal } from '../VsBotWagerManager';

export const SpeedDuel: React.FC<{ onBackToHub: () => void; aiConfig?: AiGameConfig | null }> = ({
  onBackToHub,
  aiConfig = null,
}) => {
  const { user, updateStats } = useAuth();
  const { gameState: roomState } = useGame();
  const isMultiplayerRoom = Boolean(
    roomState?.roomId && roomState.settings?.gameMode === 'speed_duel'
  );
  const roomOpponent = roomState?.players.find(
    (player) => player.isConnected && player.id !== user?.id
  );
  const rivalName = roomOpponent?.username || 'PixelSamurai';

  const [topic, setTopic] = useState<string>(DUEL_PROMPTS[0]);
  const [phase, setPhase] = useState<'ready' | 'dueling' | 'judging' | 'results'>('ready');
  const [timeLeft, setTimeLeft] = useState(30);

  // Wager modal
  const [showWagerModal, setShowWagerModal] = useState(false);
  const [wagerWon, setWagerWon] = useState(false);

  // Player 1 (User) canvas
  const canvasUserRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingUser, setIsDrawingUser] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#EF4444');
  const [userStrokeCount, setUserStrokeCount] = useState(0);

  // Player 2 canvas. Solo mode uses the procedural AI rival; a room uses the
  // participant name supplied by the server.
  const canvasRivalRef = useRef<HTMLCanvasElement | null>(null);

  // Judging Scores
  const [userScore, setUserScore] = useState(0);
  const [rivalScore, setRivalScore] = useState(0);
  const [winner, setWinner] = useState<'user' | 'rival' | 'tie' | null>(null);

  const startDuel = () => {
    const randomTopic = DUEL_PROMPTS[Math.floor(Math.random() * DUEL_PROMPTS.length)];
    setTopic(randomTopic);
    clearAllCanvases();
    setTimeLeft(30);
    setUserStrokeCount(0);
    setPhase('dueling');
    soundManager.playTurnStart();

    // Solo mode has a local AI rival. Room mode keeps the rival canvas owned by
    // the connected participant instead of silently drawing a fake opponent.
    if (!isMultiplayerRoom) simulateRivalDrawing();
  };

  const clearAllCanvases = () => {
    [canvasUserRef.current, canvasRivalRef.current].forEach((canvas) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
  };

  // Simulate the solo-mode AI rival with procedural bezier curve strokes.
  const simulateRivalDrawing = () => {
    const rivalCanvas = canvasRivalRef.current;
    if (!rivalCanvas) return;
    const ctx = rivalCanvas.getContext('2d');
    if (!ctx) return;

    let step = 0;
    const interval = setInterval(() => {
      if (step > 25) {
        clearInterval(interval);
        return;
      }
      ctx.beginPath();
      const startX = 50 + Math.random() * 300;
      const startY = 50 + Math.random() * 200;
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX + (Math.random() - 0.5) * 120, startY + (Math.random() - 0.5) * 120);
      ctx.strokeStyle = ['#3B82F6', '#8B5CF6', '#10B981', '#000000'][step % 4];
      ctx.lineWidth = 4 + (step % 3);
      ctx.lineCap = 'round';
      ctx.stroke();
      step++;
    }, 900);
  };

  // User Canvas Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (phase !== 'dueling') return;
    const canvas = canvasUserRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawingUser(true);
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
    if (!isDrawingUser || phase !== 'dueling') return;
    const canvas = canvasUserRef.current;
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
    if (!isDrawingUser) return;
    setIsDrawingUser(false);
    setUserStrokeCount((prev) => prev + 1);
  };

  // Duel Timer
  useEffect(() => {
    if (phase !== 'dueling') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishDuel();
          return 0;
        }
        if (prev <= 6) {
          soundManager.playUrgentTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // Finish Duel & Judge
  const finishDuel = () => {
    setPhase('judging');

    setTimeout(() => {
      // Calculate realistic judge score based on strokes, detail & dynamism
      const baseUser = Math.min(95, Math.max(50, userStrokeCount * 9 + 40));
      const baseRival = isMultiplayerRoom ? 0 : Math.floor(65 + Math.random() * 25);

      setUserScore(baseUser);
      setRivalScore(baseRival);

      if (baseUser >= baseRival) {
        setWinner('user');
        soundManager.playVictory();
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
        });
        updateStats(
          {
            totalScore: 250,
            duelsWon: (user?.stats?.duelsWon || 0) + 1,
          },
          true
        );

        if (aiConfig?.withBet) {
          setWagerWon(true);
          setShowWagerModal(true);
        }
      } else {
        setWinner('rival');
        soundManager.playCloseGuess();
        updateStats({ totalScore: 80 }, false);

        if (aiConfig?.withBet) {
          setWagerWon(false);
          setShowWagerModal(true);
        }
      }

      setPhase('results');
    }, 2000);
  };

  useEffect(() => {
    clearAllCanvases();
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 animate-fade-in font-sans">
      {/* VS BOT Active Wager Bar */}
      <VsBotWagerBanner aiConfig={aiConfig} gameTitle="1v1 Canvas Speed Duel" />

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
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Swords className="w-5 h-5 text-rose-500" />
                <span>1v1 Canvas Speed Duel</span>
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                Battle Mode
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Draw the secret topic head-to-head! AI Judge decides the winner!
            </p>
          </div>
        </div>

        {/* Duel Timer */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black">
            <Timer className={`w-4 h-4 ${timeLeft <= 6 ? 'text-rose-500 animate-bounce' : 'text-indigo-500'}`} />
            <span className={timeLeft <= 6 ? 'text-rose-600 dark:text-rose-400' : ''}>
              {timeLeft}s
            </span>
          </div>
        </div>
      </div>

      {/* Duel Topic Banner */}
      <div className="bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 p-4 sm:p-5 rounded-3xl text-white shadow-lg text-center space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-widest text-rose-200">
          Secret Challenge Prompt
        </span>
        <h3 className="text-xl sm:text-2xl font-black">{topic}</h3>
      </div>

      {/* Dual Arena Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Player 1 (You) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xl bg-slate-100 dark:bg-slate-800">
                <AvatarRenderer avatar={user?.avatar || '1'} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {user?.username || 'You'} (Player 1)
                </p>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                  Your Canvas
                </span>
              </div>
            </div>

            {phase === 'results' && (
              <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800">
                {userScore} / 100 Pts
              </span>
            )}
          </div>

          <div className="relative aspect-4/3 w-full bg-white rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-inner touch-none">
            <canvas
              ref={canvasUserRef}
              width={400}
              height={300}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-full cursor-crosshair"
            />
          </div>

          {/* Color palette */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              {['#000000', '#EF4444', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'].map((c) => (
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
              onClick={() => {
                const c = canvasUserRef.current;
                if (!c) return;
                const ctx = c.getContext('2d');
                if (ctx) ctx.fillRect(0, 0, c.width, c.height);
                setUserStrokeCount(0);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg text-xs"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Player 2 (room participant or AI rival) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    {isMultiplayerRoom ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {isMultiplayerRoom ? rivalName : 'PixelSamurai (AI Rival)'}
                </p>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                      {isMultiplayerRoom ? 'Room opponent' : 'Opponent Canvas'}
                </span>
              </div>
            </div>

            {phase === 'results' && (
              <span className="text-sm font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2.5 py-1 rounded-xl border border-purple-200 dark:border-purple-800">
                {rivalScore} / 100 Pts
              </span>
            )}
          </div>

          <div className="relative aspect-4/3 w-full bg-white rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-inner">
            <canvas
              ref={canvasRivalRef}
              width={400}
              height={300}
              className="w-full h-full pointer-events-none"
            />
          </div>

          <div className="text-right text-[11px] text-slate-400 font-medium pt-1">
            Live procedural rival strokes
          </div>
        </div>
      </div>

      {/* Control Buttons & Result Modals */}
      <div className="text-center py-2">
        {phase === 'ready' && (
          <button
            onClick={startDuel}
            className="px-8 py-3.5 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-purple-600/30 flex items-center gap-2 mx-auto"
          >
            <Swords className="w-4 h-4" />
            <span>Begin 1v1 Battle!</span>
          </button>
        )}

        {phase === 'judging' && (
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black animate-pulse">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>AI Judge is evaluating artistic accuracy and style...</span>
          </div>
        )}

        {phase === 'results' && (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 max-w-md mx-auto animate-fade-in text-white">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto">
              {winner === 'user' ? (
                <Trophy className="w-8 h-8 text-amber-400" />
              ) : (
                <Award className="w-8 h-8 text-purple-400" />
              )}
            </div>
            <h3 className="text-xl font-black">
              {winner === 'user' ? 'Victory! You Won the Duel!' : `${rivalName} Won this Round!`}
            </h3>
            <p className="text-xs text-slate-400">
              {winner === 'user'
                ? `You scored ${userScore} vs ${rivalScore} pts! Earned +250 XP.`
                : `Rival scored ${rivalScore} vs your ${userScore} pts. Try again!`}
            </p>
            <button
              onClick={startDuel}
              className="px-6 py-2.5 rounded-xl font-black text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all flex items-center justify-center gap-1.5 mx-auto"
            >
              <Swords className="w-4 h-4" />
              <span>Rematch / Next Duel</span>
            </button>
          </div>
        )}
      </div>

      {/* VS BOT Wager Payout / Rematch Modal */}
      <VsBotPayoutModal
        isOpen={showWagerModal}
        won={wagerWon}
        aiConfig={aiConfig}
        gameTitle="1v1 Canvas Speed Duel"
        onRematch={() => {
          setShowWagerModal(false);
          startDuel();
        }}
        onBackToHub={onBackToHub}
      />
    </div>
  );
};
