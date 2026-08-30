import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Sparkles, Trophy, Flame, Keyboard, RefreshCw, Zap, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../utils/soundEffects';

const WORD_BANK = [
  'cyber', 'neon', 'matrix', 'stream', 'laser', 'velocity', 'arcade', 'galaxy',
  'quantum', 'nexus', 'pulse', 'circuit', 'signal', 'vector', 'horizon', 'phantom',
  'turbo', 'hyper', 'orbit', 'plasma', 'spark', 'shield', 'fusion', 'pixel',
  'cosmic', 'legend', 'winner', 'blitz', 'glitch', 'syntax', 'zenith', 'portal'
];

export const CyberTyping: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
  const { user, updateStats, winBetReward } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [targetWord, setTargetWord] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [wordsCleared, setWordsCleared] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [wpm, setWpm] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getNewWord = () => {
    const nextWord = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
    setTargetWord(nextWord);
    setInputVal('');
  };

  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setWordsCleared(0);
    setStreak(0);
    setTimeLeft(30);
    setWpm(0);
    setCharCount(0);
    getNewWord();
    soundManager.playCorrect();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
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
    };
  }, [isPlaying, isGameOver]);

  const endGame = () => {
    setIsGameOver(true);
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);

    const calculatedWpm = Math.round((charCount / 5) / (30 / 60));
    setWpm(calculatedWpm);

    const pointsEarned = Math.min(250, wordsCleared * 8 + (calculatedWpm > 40 ? 60 : 20));
    const won = wordsCleared >= 12;

    updateStats(
      {
        totalScore: pointsEarned,
        gamesPlayed: 1,
        wins: won ? 1 : 0,
        wordsGuessed: wordsCleared,
      },
      won
    );

    if (won) {
      soundManager.playVictory();
      winBetReward('amethyst', '5000', 'Cyber Velocity Typing');
    } else {
      soundManager.playCountdownTick();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);

    if (val.trim().toLowerCase() === targetWord.toLowerCase()) {
      soundManager.playCorrect();
      setWordsCleared((w) => w + 1);
      setStreak((s) => s + 1);
      setCharCount((c) => c + targetWord.length + 1);
      getNewWord();
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
              <Keyboard className="w-5 h-5 text-indigo-500" />
              <span>Cyber Velocity Typing Sprint</span>
            </h2>
            <p className="text-[11px] text-slate-400">High-speed WPM keystroke blitz</p>
          </div>
        </div>

        {isPlaying && (
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Words</span>
              <span className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400">
                {wordsCleared}
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
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center mx-auto shadow-lg">
              <Keyboard className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Cyber Velocity Typing
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Type the glowing cyber words as fast as you can. Maintain a flawless keystroke streak to maximize your final WPM speed rating!
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-left text-xs text-slate-600 dark:text-slate-300 space-y-1.5 border border-slate-200 dark:border-slate-700">
              <p className="font-bold flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" /> How to Play:
              </p>
              <p>• Type the exact word displayed on screen and watch it dissolve instantly.</p>
              <p>• Complete 12+ words in 30s to secure victory & earn rewards!</p>
            </div>

            <button
              onClick={startGame}
              className="w-full py-3.5 rounded-2xl font-black text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Typing Rush
            </button>
          </div>
        )}

        {isPlaying && (
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            {/* Target Word Display */}
            <div className="py-8 bg-slate-900 rounded-3xl border border-indigo-500/30 text-white shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-radial from-indigo-500/10 via-transparent to-transparent" />
              <motion.div
                key={targetWord}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="relative z-10"
              >
                <span className="text-4xl sm:text-5xl font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-pink-400">
                  {targetWord}
                </span>
              </motion.div>
            </div>

            {/* Streak indicator */}
            {streak > 1 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>{streak} Streak Combo!</span>
              </div>
            )}

            {/* Input field */}
            <div>
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={handleInputChange}
                autoFocus
                placeholder="Type word here..."
                className="w-full py-3.5 px-4 text-center text-lg sm:text-xl font-black bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl border-2 border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-md"
              />
            </div>
          </div>
        )}

        {isGameOver && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 mx-auto">
              <Trophy className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {wordsCleared >= 12 ? 'Velocity Master!' : 'Sprint Finished!'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                You cleared <span className="font-extrabold text-indigo-600">{wordsCleared} words</span> with approx {wpm} WPM speed!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="text-slate-400 block">Words Cleared</span>
                <span className="text-base font-black text-slate-800 dark:text-slate-100">{wordsCleared}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Points Added</span>
                <span className="text-base font-black text-emerald-600">+{Math.min(250, wordsCleared * 8 + 20)} pts</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={startGame}
                className="flex-1 py-3 rounded-2xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer"
              >
                Try Again
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
