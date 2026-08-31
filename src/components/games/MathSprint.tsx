import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, Trophy, Calculator, RefreshCw, Flame, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../utils/soundEffects';

interface MathProblem {
  question: string;
  correctAnswer: number;
  options: number[];
}

export const MathSprint: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
  const { user, updateStats, winBetReward } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [score, setScore] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const generateProblem = (): MathProblem => {
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * 20) + 1;
    let b = Math.floor(Math.random() * 20) + 1;
    let ans = 0;

    if (op === '+') {
      ans = a + b;
    } else if (op === '-') {
      if (a < b) [a, b] = [b, a];
      ans = a - b;
    } else {
      a = Math.floor(Math.random() * 12) + 2;
      b = Math.floor(Math.random() * 12) + 2;
      ans = a * b;
    }

    const wrong1 = ans + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 5) + 1);
    const wrong2 = ans + (Math.random() > 0.5 ? 2 : -2) * (Math.floor(Math.random() * 6) + 2);
    const wrong3 = ans + (Math.random() > 0.5 ? 10 : -10);

    const optionsSet = new Set([ans, wrong1, wrong2, wrong3]);
    while (optionsSet.size < 4) {
      optionsSet.add(ans + Math.floor(Math.random() * 15) - 7);
    }

    const shuffled = Array.from(optionsSet).sort(() => 0.5 - Math.random());
    return {
      question: `${a} ${op} ${b}`,
      correctAnswer: ans,
      options: shuffled,
    };
  };

  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setSolvedCount(0);
    setStreak(0);
    setTimeLeft(30);
    setCurrentProblem(generateProblem());
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

    const pointsEarned = Math.min(250, solvedCount * 12 + 20);
    const won = solvedCount >= 10;

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
      winBetReward('ruby', '5000', 'Math Sprint');
    }
  };

  const handleSelectOption = (chosen: number) => {
    if (!currentProblem || !isPlaying || isGameOver) return;

    if (chosen === currentProblem.correctAnswer) {
      soundManager.playCorrect();
      setScore((s) => s + 10 * (Math.min(4, Math.floor(streak / 3) + 1)));
      setSolvedCount((c) => c + 1);
      setStreak((st) => st + 1);
      setCurrentProblem(generateProblem());
    } else {
      soundManager.playWrong();
      setStreak(0);
      setCurrentProblem(generateProblem());
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
              <Calculator className="w-5 h-5 text-amber-500" />
              <span>Math Sprint Lightning</span>
            </h2>
            <p className="text-[11px] text-slate-400">Mental arithmetic lightning duel</p>
          </div>
        </div>

        {isPlaying && (
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Score</span>
              <span className="text-base sm:text-lg font-black text-amber-500">
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
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 text-white flex items-center justify-center mx-auto shadow-lg">
              <Calculator className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Math Sprint Lightning
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Solve fast arithmetic problems in 30 seconds. Build streak combos to score big points and win Ruby gems!
              </p>
            </div>

            <button
              onClick={startGame}
              className="w-full py-3.5 rounded-2xl font-black text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Math Sprint
            </button>
          </div>
        )}

        {isPlaying && currentProblem && (
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            {streak > 1 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold">
                <Flame className="w-4 h-4 fill-amber-500" />
                <span>{streak}x Combo Streak!</span>
              </div>
            )}

            <div className="py-8 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-wider">
                {currentProblem.question} = ?
              </span>
            </div>

            {/* 4 Choices */}
            <div className="grid grid-cols-2 gap-3">
              {currentProblem.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleSelectOption(opt)}
                  className="py-4 px-4 rounded-2xl font-black text-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {isGameOver && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-500 mx-auto">
              <Trophy className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {solvedCount >= 10 ? 'Math Prodigy!' : 'Sprint Complete!'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                You solved <span className="font-extrabold text-amber-500">{solvedCount} math problems</span> with {score} points!
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
