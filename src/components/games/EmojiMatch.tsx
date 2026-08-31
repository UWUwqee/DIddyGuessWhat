import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, Trophy, Grid, RefreshCw, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../utils/soundEffects';

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const EMOJI_POOL = ['🚀', '🍕', '🎮', '💎', '🔥', '🦊', '🎸', '👑'];

export const EmojiMatch: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
  const { user, updateStats, winBetReward } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const initGame = () => {
    const pairs = [...EMOJI_POOL, ...EMOJI_POOL];
    const shuffled = pairs
      .sort(() => 0.5 - Math.random())
      .map((emoji, idx) => ({
        id: idx,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));

    setCards(shuffled);
    setFlippedIndices([]);
    setMoves(0);
    setMatchedPairs(0);
    setSeconds(0);
    setIsPlaying(true);
    setIsGameOver(false);
    soundManager.playCorrect();
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && !isGameOver) {
      timer = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, isGameOver]);

  const handleCardClick = (index: number) => {
    if (!isPlaying || isGameOver) return;
    if (cards[index].isFlipped || cards[index].isMatched || flippedIndices.length >= 2) return;

    soundManager.playTick();
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newFlipped;

      if (cards[firstIdx].emoji === cards[secondIdx].emoji) {
        // Matched
        soundManager.playCorrect();
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[firstIdx].isMatched = true;
            updated[secondIdx].isMatched = true;
            return updated;
          });
          setFlippedIndices([]);
          setMatchedPairs((p) => {
            const next = p + 1;
            if (next === EMOJI_POOL.length) {
              endGame();
            }
            return next;
          });
        }, 400);
      } else {
        // Not matched
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[firstIdx].isFlipped = false;
            updated[secondIdx].isFlipped = false;
            return updated;
          });
          setFlippedIndices([]);
        }, 900);
      }
    }
  };

  const endGame = () => {
    setIsGameOver(true);
    setIsPlaying(false);
    soundManager.playVictory();

    const pointsEarned = Math.max(50, 200 - moves * 5);
    updateStats(
      {
        totalScore: pointsEarned,
        gamesPlayed: 1,
        wins: 1,
        highestRoundScore: pointsEarned,
      },
      true
    );

    winBetReward('diamond', '5000', 'Emoji Tile Memory Match');
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
              <Grid className="w-5 h-5 text-indigo-500" />
              <span>Emoji Tile Memory Match</span>
            </h2>
            <p className="text-[11px] text-slate-400">Card flipping pair puzzle</p>
          </div>
        </div>

        {isPlaying && (
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Moves</span>
              <span className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400">
                {moves}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Time</span>
              <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {seconds}s
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="flex-1 min-h-[440px] flex items-center justify-center">
        {!isPlaying && !isGameOver && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 max-w-md w-full text-center space-y-6 shadow-xl">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg">
              <Grid className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Emoji Tile Memory Match
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Flip the cards to discover matching pairs of emojis. Match all 8 pairs with the fewest moves possible!
              </p>
            </div>

            <button
              onClick={initGame}
              className="w-full py-3.5 rounded-2xl font-black text-white bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-700 hover:to-indigo-700 shadow-lg cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Memory Match
            </button>
          </div>
        )}

        {isPlaying && (
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
              {cards.map((card, idx) => (
                <motion.button
                  key={card.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCardClick(idx)}
                  className={`aspect-square rounded-2xl text-2xl sm:text-3xl flex items-center justify-center transition-all duration-300 shadow-sm cursor-pointer ${
                    card.isMatched
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 border-2 border-emerald-400 opacity-70'
                      : card.isFlipped
                      ? 'bg-indigo-50 dark:bg-indigo-950/80 border-2 border-indigo-500 scale-105'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {card.isFlipped || card.isMatched ? card.emoji : '❓'}
                </motion.button>
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
                Memory Board Cleared!
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Completed in <span className="font-extrabold text-indigo-600">{moves} moves</span> and {seconds} seconds!
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={initGame}
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
