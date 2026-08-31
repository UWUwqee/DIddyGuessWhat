import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Sparkles, Trophy, Zap, RefreshCw, Flame, CheckCircle2, AlertCircle, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../utils/soundEffects';

interface ColorOption {
  name: string;
  colorClass: string;
  hex: string;
}

const COLOR_PALETTE: ColorOption[] = [
  { name: 'RED', colorClass: 'text-rose-500', hex: '#ef4444' },
  { name: 'BLUE', colorClass: 'text-blue-500', hex: '#3b82f6' },
  { name: 'GREEN', colorClass: 'text-emerald-500', hex: '#10b981' },
  { name: 'YELLOW', colorClass: 'text-amber-400', hex: '#f59e0b' },
  { name: 'PURPLE', colorClass: 'text-purple-500', hex: '#a855f7' },
  { name: 'CYAN', colorClass: 'text-cyan-400', hex: '#06b6d4' },
];

export const ColorClash: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
  const { user, updateStats, winBetReward } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(30);

  // Current challenge
  const [wordText, setWordText] = useState('BLUE');
  const [inkColor, setInkColor] = useState(COLOR_PALETTE[0]); // ink color that word is rendered in
  const [matchMode, setMatchMode] = useState<'match_ink' | 'match_meaning'>('match_ink');
  const [choices, setChoices] = useState<ColorOption[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const generateRound = () => {
    // Pick random target ink and random target word
    const randWord = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)].name;
    const randInk = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
    const mode = Math.random() > 0.4 ? 'match_ink' : 'match_meaning';

    setWordText(randWord);
    setInkColor(randInk);
    setMatchMode(mode);

    // Shuffle options
    const shuffled = [...COLOR_PALETTE].sort(() => 0.5 - Math.random()).slice(0, 4);
    const required = mode === 'match_ink' ? randInk : COLOR_PALETTE.find((c) => c.name === randWord)!;
    if (!shuffled.some((c) => c.name === required.name)) {
      shuffled[0] = required;
    }
    setChoices(shuffled.sort(() => 0.5 - Math.random()));
  };

  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setLives(3);
    setTimeLeft(30);
    generateRound();
    soundManager.playCorrect();
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

    const pointsEarned = Math.min(250, Math.floor(score * 1.5) + (score > 100 ? 50 : 20));
    const won = score >= 80;

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
      winBetReward('diamond', '5000', 'Color Clash');
    } else {
      soundManager.playCountdownTick();
    }
  };

  const handleSelectChoice = (selected: ColorOption) => {
    if (!isPlaying || isGameOver) return;

    const correctOptionName = matchMode === 'match_ink' ? inkColor.name : wordText;
    const isCorrect = selected.name === correctOptionName;

    if (isCorrect) {
      soundManager.playCorrect();
      const comboMultiplier = Math.min(4, Math.floor(combo / 3) + 1);
      const points = 10 * comboMultiplier;
      setScore((s) => s + points);
      setCombo((c) => {
        const next = c + 1;
        if (next > maxCombo) setMaxCombo(next);
        return next;
      });
      setFeedback('correct');
    } else {
      soundManager.playWrong();
      setCombo(0);
      setFeedback('wrong');
      setLives((l) => {
        const next = l - 1;
        if (next <= 0) {
          endGame();
        }
        return next;
      });
    }

    setTimeout(() => {
      setFeedback(null);
      if (!isGameOver) generateRound();
    }, 200);
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
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Color Clash Matrix</span>
            </h2>
            <p className="text-[11px] text-slate-400">Stroop Reflex Reaction Duel</p>
          </div>
        </div>

        {isPlaying && (
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-1">
              {[...Array(3)].map((_, idx) => (
                <Heart
                  key={idx}
                  className={`w-4 h-4 ${
                    idx < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-300 dark:text-slate-700'
                  }`}
                />
              ))}
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Score</span>
              <span className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400">
                {score}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Timer</span>
              <span
                className={`text-base sm:text-lg font-black ${
                  timeLeft <= 5 ? 'text-rose-500 animate-ping' : 'text-slate-900 dark:text-white'
                }`}
              >
                {timeLeft}s
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Arena */}
      <div className="flex-1 min-h-[440px] flex items-center justify-center">
        {!isPlaying && !isGameOver && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 max-w-md w-full text-center space-y-6 shadow-xl">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg">
              <Zap className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Color Clash Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Test your brain reflexes against the psychological Stroop effect! Fast-match the
                indicated <span className="font-bold text-indigo-500">Ink Color</span> or{' '}
                <span className="font-bold text-amber-500">Word Meaning</span> before time runs out.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-left text-xs text-slate-600 dark:text-slate-300 space-y-1.5 border border-slate-200 dark:border-slate-700">
              <p className="font-bold flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" /> How to Play:
              </p>
              <p>• Look at the rule prompt: &quot;Select the INK COLOR&quot; or &quot;Select the WORD&quot;.</p>
              <p>• Tap the matching colored button quickly to build your combo multiplier.</p>
              <p>• 3 lives • 30 seconds countdown • Win points and gems!</p>
            </div>

            <button
              onClick={startGame}
              className="w-full py-3.5 rounded-2xl font-black text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 shadow-lg cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Lightning Challenge
            </button>
          </div>
        )}

        {isPlaying && (
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            {/* Rule Prompt Header */}
            <div className="inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {matchMode === 'match_ink' ? (
                <span className="text-indigo-600 dark:text-indigo-400">
                  🎨 TAP THE <span className="underline">INK COLOR</span> OF THE WORD
                </span>
              ) : (
                <span className="text-amber-500 dark:text-amber-400">
                  📖 TAP THE <span className="underline">WORD MEANING</span>
                </span>
              )}
            </div>

            {/* Stimulus Word */}
            <motion.div
              key={`${wordText}-${inkColor.name}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="py-10 select-none"
            >
              <span
                className="text-5xl sm:text-7xl font-black tracking-tight drop-shadow-md"
                style={{ color: inkColor.hex }}
              >
                {wordText}
              </span>
            </motion.div>

            {/* Combo Streak */}
            {combo > 1 && (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-extrabold"
              >
                <Flame className="w-4 h-4 fill-amber-500" />
                <span>{combo}x STREAK (x{Math.min(4, Math.floor(combo / 3) + 1)} Multiplier)</span>
              </motion.div>
            )}

            {/* 4 Choices Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {choices.map((c) => (
                <button
                  key={c.name}
                  onClick={() => handleSelectChoice(c)}
                  className="py-4 px-3 rounded-2xl font-black text-sm sm:text-base border-2 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm text-white"
                  style={{
                    backgroundColor: c.hex,
                    borderColor: 'rgba(255,255,255,0.2)',
                  }}
                >
                  {c.name}
                </button>
              ))}
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
                {score >= 80 ? 'Sensational Reflexes!' : 'Round Completed!'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                You scored <span className="font-extrabold text-indigo-600">{score} points</span> with a peak streak of {maxCombo}x!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="text-slate-400 block">Final Score</span>
                <span className="text-base font-black text-slate-800 dark:text-slate-100">{score}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Points Added</span>
                <span className="text-base font-black text-emerald-600">+{Math.min(250, Math.floor(score * 1.5) + 20)} pts</span>
              </div>
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
