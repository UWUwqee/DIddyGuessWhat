import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Trophy,
  Flame,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Check,
  CheckCircle,
  Timer,
  Lightbulb,
  Award,
  Puzzle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../utils/soundEffects';
import { EMOJI_PUZZLES, getRandomEmojiPuzzle } from '../../data/emojiPuzzles';
import { EmojiPuzzle } from '../../types';
import { AiGameConfig } from '../VsAiArena';
import { VsBotWagerBanner, VsBotPayoutModal } from '../VsBotWagerManager';

export const EmojiCharades: React.FC<{ onBackToHub: () => void; aiConfig?: AiGameConfig | null }> = ({
  onBackToHub,
  aiConfig = null,
}) => {
  const { user, updateStats } = useAuth();

  const [currentCategory, setCurrentCategory] = useState<string>('All');
  const [puzzle, setPuzzle] = useState<EmojiPuzzle>(() => getRandomEmojiPuzzle());
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [guessInput, setGuessInput] = useState('');
  const [revealedLetters, setRevealedLetters] = useState<number[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(40);
  const [isSolved, setIsSolved] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [shake, setShake] = useState(false);

  // Wager modal
  const [showWagerModal, setShowWagerModal] = useState(false);
  const [wagerWon, setWagerWon] = useState(false);

  // Load next puzzle
  const nextPuzzle = useCallback(() => {
    const next = getRandomEmojiPuzzle(currentCategory, [...solvedIds, puzzle.id]);
    setPuzzle(next);
    setGuessInput('');
    setRevealedLetters([]);
    setHintsUsed(0);
    setTimeLeft(40);
    setIsSolved(false);
    setIsFailed(false);
  }, [currentCategory, solvedIds, puzzle.id]);

  // Clean String for verification
  const cleanStr = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Submit Guess
  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim() || isSolved || isFailed) return;

    if (cleanStr(guessInput) === cleanStr(puzzle.answer)) {
      // Correct!
      setIsSolved(true);
      const pointsGained = Math.max(
        40,
        Math.round(puzzle.points * (timeLeft / 40) - hintsUsed * 25 + (streak + 1) * 20)
      );
      setScore((prev) => prev + pointsGained);
      setStreak((prev) => prev + 1);
      setSolvedIds((prev) => [...prev, puzzle.id]);

      soundManager.playCorrectGuess();
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });

      // Update user lifetime stats
      updateStats(
        {
          totalScore: pointsGained,
          emojiPuzzlesSolved: (user?.stats?.emojiPuzzlesSolved || 0) + 1,
        },
        false
      );

      if (aiConfig?.withBet) {
        setWagerWon(true);
        setTimeout(() => setShowWagerModal(true), 800);
      }
    } else {
      // Incorrect - trigger shake animation
      setShake(true);
      setTimeout(() => setShake(false), 500);
      soundManager.playCloseGuess();
    }
  };

  // Reveal a letter hint
  const handleRevealHint = () => {
    if (isSolved || isFailed) return;
    const answerChars = puzzle.answer.split('');
    const unrevealedIndices = answerChars
      .map((c, i) => (c !== ' ' && !revealedLetters.includes(i) ? i : -1))
      .filter((i) => i >= 0);

    if (unrevealedIndices.length > 0) {
      const pick = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
      setRevealedLetters((prev) => [...prev, pick]);
      setHintsUsed((prev) => prev + 1);
      soundManager.playTick();
    }
  };

  // Timer Tick
  useEffect(() => {
    if (isSolved || isFailed) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsFailed(true);
          setStreak(0);
          soundManager.playCloseGuess();
          if (aiConfig?.withBet) {
            setWagerWon(false);
            setTimeout(() => setShowWagerModal(true), 800);
          }
          return 0;
        }
        if (prev <= 8) {
          soundManager.playUrgentTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSolved, isFailed]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 animate-fade-in font-sans">
      {/* VS BOT Active Wager Bar */}
      <VsBotWagerBanner aiConfig={aiConfig} gameTitle="Emoji Charades Rush" />

      {/* Top Header Card */}
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
                <Puzzle className="w-5 h-5 text-indigo-500" />
                <span>Emoji Charades Party</span>
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Word Puzzle
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Decode the secret movies, idioms, dishes & games from the clue sequence!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 flex items-center gap-1.5 text-xs font-black">
            <Award className="w-4 h-4 text-amber-500" />
            <span>{score} Pts</span>
          </div>

          <div className="px-3 py-1.5 rounded-2xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 flex items-center gap-1.5 text-xs font-black">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>{streak}x Combo</span>
          </div>
        </div>
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
        {['All', 'Movies', 'Idioms', 'Food', 'Video Games', 'Places'].map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setCurrentCategory(cat);
              const next = getRandomEmojiPuzzle(cat, solvedIds);
              setPuzzle(next);
              setGuessInput('');
              setRevealedLetters([]);
              setHintsUsed(0);
              setTimeLeft(40);
              setIsSolved(false);
              setIsFailed(false);
            }}
            className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              currentCategory === cat
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Puzzle Showcase Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm space-y-8 text-center relative overflow-hidden">
        {/* Category & Timer Bar */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
            Category: {puzzle.category}
          </span>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-black">
            <Timer className={`w-4 h-4 ${timeLeft <= 8 ? 'text-rose-500 animate-bounce' : 'text-indigo-500'}`} />
            <span className={timeLeft <= 8 ? 'text-rose-600 dark:text-rose-400' : ''}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Animated Bouncing Emojis Container */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-4">
          {puzzle.emojis.map((emoji, index) => (
            <motion.div
              key={`${puzzle.id}-${index}`}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
              whileHover={{ scale: 1.25, rotate: 10 }}
              className="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-4xl sm:text-6xl shadow-lg shadow-slate-200/50 dark:shadow-none select-none cursor-pointer"
            >
              {emoji}
            </motion.div>
          ))}
        </div>

        {/* Masked Letter Slots */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {puzzle.answer.split('').map((char, index) => {
              if (char === ' ') {
                return <div key={index} className="w-4 sm:w-6" />;
              }
              const isRevealed = revealedLetters.includes(index) || isSolved || isFailed;
              return (
                <motion.div
                  key={index}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`w-8 h-10 sm:w-11 sm:h-13 rounded-xl border-2 flex items-center justify-center text-base sm:text-xl font-black uppercase transition-all ${
                    isSolved
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                      : isFailed
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                      : isRevealed
                      ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-transparent'
                  }`}
                >
                  {isRevealed ? char : '_'}
                </motion.div>
              );
            })}
          </div>

          <p className="text-xs text-slate-400 font-medium">
            Word length: {puzzle.answer.length} characters ({puzzle.difficulty} difficulty)
          </p>
        </div>

        {/* Solved / Failed Banner */}
        <AnimatePresence>
          {isSolved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-center space-y-2"
            >
              <div className="flex items-center justify-center gap-1.5 text-base font-extrabold text-emerald-700 dark:text-emerald-300">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span>Correct! Answer: &quot;{puzzle.answer}&quot;</span>
              </div>
              <button
                onClick={nextPuzzle}
                className="px-6 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all"
              >
                Next Puzzle →
              </button>
            </motion.div>
          )}

          {isFailed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 text-center space-y-2"
            >
              <div className="flex items-center justify-center gap-1.5 text-base font-extrabold text-rose-700 dark:text-rose-300">
                <Timer className="w-5 h-5 text-rose-500" />
                <span>Time&apos;s Up! Answer was &quot;{puzzle.answer}&quot;</span>
              </div>
              <button
                onClick={nextPuzzle}
                className="px-6 py-2 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-500 shadow-md transition-all"
              >
                Try Next Puzzle →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Guess Input Form */}
        {!isSolved && !isFailed && (
          <form
            onSubmit={handleGuessSubmit}
            className={`max-w-md mx-auto space-y-3 transition-transform ${
              shake ? 'animate-shake' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                placeholder="Type your guess here..."
                autoFocus
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
              />
              <button
                type="submit"
                disabled={!guessInput.trim()}
                className="py-3 px-5 rounded-2xl font-black text-xs text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 transition-all shadow-md shadow-indigo-600/20"
              >
                Guess!
              </button>
            </div>

            {/* Hint Button */}
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={handleRevealHint}
                className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Reveal Letter Hint (-25 pts)</span>
              </button>

              <span className="text-[11px] text-slate-400 italic">
                Hint: {puzzle.hint}
              </span>
            </div>
          </form>
        )}
      </div>

      {/* VS BOT Wager Payout / Rematch Modal */}
      <VsBotPayoutModal
        isOpen={showWagerModal}
        won={wagerWon}
        aiConfig={aiConfig}
        gameTitle="Emoji Charades Rush"
        onRematch={() => {
          setShowWagerModal(false);
          nextPuzzle();
        }}
        onBackToHub={onBackToHub}
      />
    </div>
  );
};
