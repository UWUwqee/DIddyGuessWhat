import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Sparkles, Trophy, Flame, RefreshCw, Zap, Crosshair } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../utils/soundEffects';

const DOODLE_EMOJIS = ['👾', '👻', '🤖', '🦊', '🎃', '🐵', '🐱', '🦄'];

export const WhackDoodle: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
  const { user, updateStats, winBetReward } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [activeHole, setActiveHole] = useState<number | null>(null);
  const [activeEmoji, setActiveEmoji] = useState('👾');
  const [timeLeft, setTimeLeft] = useState(30);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const popTimerRef = useRef<NodeJS.Timeout | null>(null);

  const popDoodle = () => {
    const hole = Math.floor(Math.random() * 9);
    const emoji = DOODLE_EMOJIS[Math.floor(Math.random() * DOODLE_EMOJIS.length)];
    setActiveHole(hole);
    setActiveEmoji(emoji);

    const speed = Math.max(500, 1000 - score * 15);
    popTimerRef.current = setTimeout(() => {
      setActiveHole(null);
      if (isPlaying && !isGameOver) {
        setTimeout(popDoodle, 150);
      }
    }, speed);
  };

  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setStreak(0);
    setTimeLeft(30);
    soundManager.playCorrect();
    setTimeout(popDoodle, 400);
  };

  useEffect(() => {
    if (isPlaying && !isGameOver) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (popTimerRef.current) clearTimeout(popTimerRef.current);
    };
  }, [isPlaying, isGameOver]);

  const endGame = () => {
    setIsGameOver(true);
    setIsPlaying(false);
    setActiveHole(null);
    if (timerRef.current) clearInterval(timerRef.current);
    if (popTimerRef.current) clearTimeout(popTimerRef.current);

    const pointsEarned = Math.min(250, score * 8 + 20);
    const won = score >= 15;

    updateStats(
      {
        totalScore: pointsEarned,
        gamesPlayed: 1,
        wins: won ? 1 : 0,
        highestRoundScore: score,
      },
      won
    );

    if (won) {
      soundManager.playVictory();
      winBetReward('ruby', '5000', 'Whack-A-Doodle Reflex');
    }
  };

  const handleWhack = (holeIdx: number) => {
    if (holeIdx === activeHole) {
      soundManager.playCorrect();
      setScore((s) => s + 1);
      setStreak((st) => st + 1);
      setActiveHole(null);
      if (popTimerRef.current) clearTimeout(popTimerRef.current);
      setTimeout(popDoodle, 100);
    } else {
      soundManager.playWrong();
      setStreak(0);
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-2 sm:p-4 space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHub}
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Arcade</span>
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Crosshair className="w-5 h-5 text-rose-500" />
              <span>Whack-A-Doodle Reflex</span>
            </h2>
            <p className="text-[11px] text-slate-400">Pop-up emoji rapid tap arena</p>
          </div>
        </div>

        {isPlaying && (
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Whacks</span>
              <span className="text-base sm:text-lg font-black text-rose-500">
                {score}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Time</span>
              <span className={`text-base sm:text-lg font-black ${timeLeft <= 5 ? 'text-rose-500 animate-ping' : 'text-slate-900 dark:text-white'}`}>
                {timeLeft}s
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="flex-1 min-h-[440px] flex items-center justify-center">
        {!isPlaying && !isGameOver && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 max-w-md w-full text-center space-y-6 shadow-xl">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg">
              <Crosshair className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Whack-A-Doodle Reflex
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Mischievous doodles are popping out of the 9 arcade holes! Tap them as fast as you can before they duck back down.
              </p>
            </div>

            <button
              onClick={startGame}
              className="w-full py-3.5 rounded-2xl font-black text-white bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 shadow-lg cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Whacking
            </button>
          </div>
        )}

        {isPlaying && (
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((holeIdx) => {
                const isPop = activeHole === holeIdx;
                return (
                  <button
                    key={holeIdx}
                    onClick={() => handleWhack(holeIdx)}
                    className="aspect-square rounded-2xl bg-slate-950 border-2 border-slate-800 flex items-center justify-center relative overflow-hidden shadow-inner cursor-pointer active:scale-95 transition-transform"
                  >
                    <AnimatePresence>
                      {isPop && (
                        <motion.span
                          initial={{ y: 40, scale: 0.5, opacity: 0 }}
                          animate={{ y: 0, scale: 1, opacity: 1 }}
                          exit={{ y: 40, scale: 0.5, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          className="text-4xl select-none"
                        >
                          {activeEmoji}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isGameOver && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-500 mx-auto">
              <Trophy className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {score >= 15 ? 'Reflex Master!' : 'Round Over!'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                You whacked <span className="font-extrabold text-rose-500">{score} doodles</span> in 30s!
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={startGame}
                className="flex-1 py-3 rounded-2xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer"
              >
                Play Again
              </button>
              <button
                onClick={onBackToHub}
                className="flex-1 py-3 rounded-2xl font-bold text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                Back to Arcade
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
