import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, Trophy, Layers, RefreshCw, Zap, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../utils/soundEffects';

interface Block {
  y: number;
  width: number;
  left: number;
  color: string;
}

const BLOCK_COLORS = [
  'bg-rose-500', 'bg-pink-500', 'bg-purple-500', 'bg-indigo-500',
  'bg-blue-500', 'bg-cyan-500', 'bg-teal-500', 'bg-emerald-500',
  'bg-amber-400', 'bg-orange-500'
];

export const TowerStack: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
  const { user, updateStats, winBetReward } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [placedBlocks, setPlacedBlocks] = useState<Block[]>([]);
  const [currentX, setCurrentX] = useState(50);
  const [direction, setDirection] = useState(1);
  const [currentWidth, setCurrentWidth] = useState(60);
  const [score, setScore] = useState(0);

  const animFrameRef = useRef<number | null>(null);

  const startGame = () => {
    const baseBlock: Block = {
      y: 0,
      width: 60,
      left: 20,
      color: BLOCK_COLORS[0],
    };
    setPlacedBlocks([baseBlock]);
    setCurrentWidth(60);
    setCurrentX(0);
    setDirection(1);
    setScore(0);
    setIsPlaying(true);
    setIsGameOver(false);
    soundManager.playCorrect();
  };

  useEffect(() => {
    if (isPlaying && !isGameOver) {
      const speed = Math.min(2.5, 1.2 + score * 0.08);
      const updateMotion = () => {
        setCurrentX((x) => {
          let nextX = x + direction * speed;
          if (nextX > 100 - currentWidth) {
            nextX = 100 - currentWidth;
            setDirection(-1);
          } else if (nextX < 0) {
            nextX = 0;
            setDirection(1);
          }
          return nextX;
        });
        animFrameRef.current = requestAnimationFrame(updateMotion);
      };
      animFrameRef.current = requestAnimationFrame(updateMotion);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, isGameOver, direction, currentWidth, score]);

  const handlePlaceBlock = () => {
    if (!isPlaying || isGameOver) return;

    const lastBlock = placedBlocks[placedBlocks.length - 1];
    const leftDiff = currentX - lastBlock.left;

    // Calculate overlap
    let newWidth = currentWidth - Math.abs(leftDiff);
    let newLeft = currentX;

    if (leftDiff < 0) {
      newLeft = lastBlock.left;
    }

    if (newWidth <= 4) {
      // Missed completely
      soundManager.playWrong();
      endGame(score);
    } else {
      soundManager.playCorrect();
      const colorIdx = placedBlocks.length % BLOCK_COLORS.length;
      const newBlock: Block = {
        y: placedBlocks.length,
        width: newWidth,
        left: newLeft,
        color: BLOCK_COLORS[colorIdx],
      };

      setPlacedBlocks((prev) => [...prev, newBlock]);
      setCurrentWidth(newWidth);
      setScore((s) => s + 1);
    }
  };

  const endGame = (finalScore: number) => {
    setIsGameOver(true);
    setIsPlaying(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const pointsEarned = Math.min(250, finalScore * 15 + 20);
    const won = finalScore >= 10;

    updateStats(
      {
        totalScore: pointsEarned,
        gamesPlayed: 1,
        wins: won ? 1 : 0,
        highestRoundScore: finalScore,
      },
      won
    );

    if (won) {
      soundManager.playVictory();
      winBetReward('diamond', '5000', 'Cyber Tower Stacker');
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
              <Building2 className="w-5 h-5 text-indigo-500" />
              <span>Cyber Tower Stacker</span>
            </h2>
            <p className="text-[11px] text-slate-400">Precision timing skyscraper physics</p>
          </div>
        </div>

        {isPlaying && (
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Floor Height</span>
            <span className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400">
              {score}
            </span>
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="flex-1 min-h-[440px] flex items-center justify-center">
        {!isPlaying && !isGameOver && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 max-w-md w-full text-center space-y-6 shadow-xl">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center mx-auto shadow-lg">
              <Building2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Cyber Tower Stacker
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Tap to drop moving neon blocks onto the tower. Overhanging edges get sliced off! Build 10+ floors to secure victory.
              </p>
            </div>

            <button
              onClick={startGame}
              className="w-full py-3.5 rounded-2xl font-black text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Tower Stacking
            </button>
          </div>
        )}

        {isPlaying && (
          <div
            onClick={handlePlaceBlock}
            className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl h-[420px] flex flex-col-reverse relative overflow-hidden cursor-pointer select-none"
          >
            {/* Moving active block */}
            <div
              className={`absolute h-7 rounded-lg shadow-lg ${
                BLOCK_COLORS[placedBlocks.length % BLOCK_COLORS.length]
              }`}
              style={{
                bottom: `${placedBlocks.length * 28 + 24}px`,
                width: `${currentWidth}%`,
                left: `${currentX}%`,
              }}
            />

            {/* Placed blocks stack */}
            <div className="relative w-full">
              {placedBlocks.map((b, i) => (
                <div
                  key={i}
                  className={`absolute h-7 rounded-lg shadow-md transition-all ${b.color}`}
                  style={{
                    bottom: `${i * 28}px`,
                    width: `${b.width}%`,
                    left: `${b.left}%`,
                  }}
                />
              ))}
            </div>

            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800 pointer-events-none">
              👆 Tap Anywhere To Place Floor
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
                {score >= 10 ? 'Sky Architect!' : 'Tower Collapsed!'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                You reached a height of <span className="font-extrabold text-indigo-600">{score} floors</span>!
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
