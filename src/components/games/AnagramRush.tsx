import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Sparkles,
  Timer,
  Trophy,
  Flame,
  HelpCircle,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  SpellCheck,
  Send,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../utils/soundEffects';
import { isValidEnglishWord } from '../../utils/dictionary';
import { AiGameConfig } from '../VsAiArena';
import { VsBotWagerBanner, VsBotPayoutModal } from '../VsBotWagerManager';

interface AnagramPuzzle {
  word: string;
  category: string;
  hint: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
}

const ANAGRAM_PUZZLES: AnagramPuzzle[] = [
  { word: 'GALAXY', category: 'Space', hint: 'A massive gravitationally bound system of stars', difficulty: 'Easy', points: 150 },
  { word: 'PHOENIX', category: 'Mythology', hint: 'Legendary immortal bird born from ashes', difficulty: 'Medium', points: 200 },
  { word: 'VOLCANO', category: 'Nature', hint: 'A mountain with a crater that expels lava', difficulty: 'Easy', points: 140 },
  { word: 'CHAMELEON', category: 'Animals', hint: 'Lizard famous for shifting skin pigments', difficulty: 'Hard', points: 250 },
  { word: 'PENGUIN', category: 'Animals', hint: 'Flightless aquatic bird in cold polar regions', difficulty: 'Easy', points: 130 },
  { word: 'PYRAMID', category: 'Monuments', hint: 'Ancient monumental structure in Giza', difficulty: 'Medium', points: 180 },
  { word: 'TSUNAMI', category: 'Weather', hint: 'Colossal ocean wave caused by earthquakes', difficulty: 'Medium', points: 190 },
  { word: 'LIGHTNING', category: 'Weather', hint: 'High-voltage atmospheric electrical discharge', difficulty: 'Hard', points: 240 },
  { word: 'AVOCADO', category: 'Food', hint: 'Creamy green fruit famous for guacamole', difficulty: 'Easy', points: 140 },
  { word: 'DIAMOND', category: 'Minerals', hint: 'Hardest known natural carbon crystal', difficulty: 'Medium', points: 190 },
  { word: 'DOLPHIN', category: 'Animals', hint: 'Highly intelligent marine mammal known for playful clicks', difficulty: 'Easy', points: 140 },
  { word: 'TELESCOPE', category: 'Science', hint: 'Optical instrument used to gaze at distant stars', difficulty: 'Hard', points: 250 },
  { word: 'CASTLE', category: 'Architecture', hint: 'Fortified medieval residence of royalty', difficulty: 'Easy', points: 130 },
  { word: 'OCTOPUS', category: 'Ocean', hint: 'Eight-armed sea creature with three hearts', difficulty: 'Medium', points: 180 },
  { word: 'RAINBOW', category: 'Nature', hint: 'Meteorological phenomenon showing a spectrum of light', difficulty: 'Easy', points: 140 },
  { word: 'DRAGON', category: 'Mythology', hint: 'Legendary fire-breathing reptilian monster', difficulty: 'Easy', points: 130 },
  { word: 'ASTRONAUT', category: 'Space', hint: 'A person trained to travel in a spacecraft', difficulty: 'Hard', points: 260 },
  { word: 'CHOCOLATE', category: 'Food', hint: 'Sweet brown treat made from roasted cacao seeds', difficulty: 'Hard', points: 240 },
  { word: 'SUBMARINE', category: 'Vehicles', hint: 'Watercraft capable of independent underwater operation', difficulty: 'Hard', points: 250 },
  { word: 'HARMONY', category: 'Music', hint: 'Pleasing combination of different musical notes', difficulty: 'Medium', points: 180 },
  { word: 'BALLOON', category: 'Fun', hint: 'Flexible bag inflated with gas or helium', difficulty: 'Easy', points: 120 },
  { word: 'WIZARD', category: 'Fantasy', hint: 'Magician who practices sorcery and spellcasting', difficulty: 'Easy', points: 140 },
  { word: 'KANGAROO', category: 'Animals', hint: 'Marsupial from Australia with large powerful hind legs', difficulty: 'Medium', points: 190 },
  { word: 'TREASURE', category: 'Adventure', hint: 'Quantity of precious metals, gems, or valuables', difficulty: 'Medium', points: 190 },
  { word: 'FIREWORKS', category: 'Celebration', hint: 'Explosive pyrotechnic devices creating colorful lights in sky', difficulty: 'Hard', points: 250 },
];

function scrambleWord(word: string): string[] {
  const letters = word.split('');
  let scrambled = [...letters];
  // Ensure it's not identical to original
  while (scrambled.join('') === word && word.length > 2) {
    scrambled = scrambled.sort(() => Math.random() - 0.5);
  }
  return scrambled;
}

interface AnagramRushProps {
  onBackToHub: () => void;
  aiConfig?: AiGameConfig | null;
}

export const AnagramRush: React.FC<AnagramRushProps> = ({ onBackToHub, aiConfig = null }) => {
  const { user, updateStats } = useAuth();

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'round_end' | 'game_over'>('intro');
  const [puzzles, setPuzzles] = useState<AnagramPuzzle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrambledTiles, setScrambledTiles] = useState<{ id: string; letter: string }[]>([]);
  const [placedTiles, setPlacedTiles] = useState<{ id: string; letter: string }[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25);
  const [totalTime, setTotalTime] = useState(25);
  const [showHint, setShowHint] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  // Wager modal
  const [showWagerModal, setShowWagerModal] = useState(false);
  const [wagerWon, setWagerWon] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentPuzzle = puzzles[currentIndex];

  const handleStartGame = () => {
    const shuffled = [...ANAGRAM_PUZZLES].sort(() => Math.random() - 0.5);
    setPuzzles(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setSolvedCount(0);
    setupPuzzle(shuffled[0]);
    setGameState('playing');
    soundManager.playRoundStart();
  };

  const setupPuzzle = (puzzle: AnagramPuzzle) => {
    const letters = scrambleWord(puzzle.word);
    const tiles = letters.map((l, i) => ({ id: `${l}_${i}_${Math.random()}`, letter: l }));
    setScrambledTiles(tiles);
    setPlacedTiles([]);
    setShowHint(false);
    setFeedback(null);
    const time = puzzle.difficulty === 'Hard' ? 30 : puzzle.difficulty === 'Medium' ? 25 : 20;
    setTimeLeft(time);
    setTotalTime(time);
  };

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeOut();
          return 0;
        }
        if (prev <= 5) soundManager.playTick();
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, currentIndex]);

  const handleTimeOut = () => {
    soundManager.playCloseGuess();
    setStreak(0);
    setFeedback({ text: `Time's up! The word was "${currentPuzzle.word}"`, isError: true });
    setGameState('round_end');
  };

  // Move tile from rack to placed slot
  const handleSelectTile = (tile: { id: string; letter: string }) => {
    if (gameState !== 'playing') return;
    soundManager.playTick();
    setScrambledTiles((prev) => prev.filter((t) => t.id !== tile.id));
    const nextPlaced = [...placedTiles, tile];
    setPlacedTiles(nextPlaced);

    // If all tiles are placed, automatically validate
    if (nextPlaced.length === currentPuzzle.word.length) {
      validateAttempt(nextPlaced.map((t) => t.letter).join(''));
    }
  };

  // Return tile back to rack
  const handleRemoveTile = (tile: { id: string; letter: string }) => {
    if (gameState !== 'playing') return;
    soundManager.playTick();
    setPlacedTiles((prev) => prev.filter((t) => t.id !== tile.id));
    setScrambledTiles((prev) => [...prev, tile]);
  };

  // Clear all placed tiles back to rack
  const handleClear = () => {
    if (gameState !== 'playing') return;
    soundManager.playTick();
    setScrambledTiles((prev) => [...prev, ...placedTiles]);
    setPlacedTiles([]);
    setFeedback(null);
  };

  // Validate current word attempt
  const validateAttempt = (guessWord: string) => {
    const isTarget = guessWord === currentPuzzle.word;
    const isAlternativeValidAnagram =
      guessWord.length === currentPuzzle.word.length &&
      isValidEnglishWord(guessWord) &&
      guessWord.split('').sort().join('') === currentPuzzle.word.split('').sort().join('');

    if (isTarget || isAlternativeValidAnagram) {
      // Correct!
      soundManager.playCorrectGuess();
      const timeBonus = Math.round((timeLeft / totalTime) * 100);
      const streakBonus = streak * 30;
      const earned = currentPuzzle.points + timeBonus + streakBonus;

      setScore((s) => s + earned);
      setStreak((st) => {
        const next = st + 1;
        if (next > maxStreak) setMaxStreak(next);
        return next;
      });
      setSolvedCount((c) => c + 1);
      const message = isTarget
        ? `Unscrambled! +${earned} PTS`
        : `Creative Anagram: "${guessWord}"! +${earned} PTS`;
      setFeedback({ text: message, isError: false });
      setGameState('round_end');
    } else {
      // Incorrect attempt
      soundManager.playCloseGuess();
      setFeedback({ text: 'Not quite! Try rearranging the tiles.', isError: true });
    }
  };

  const handleNextPuzzle = () => {
    if (currentIndex + 1 >= puzzles.length || currentIndex >= 6) {
      handleGameOver();
    } else {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setupPuzzle(puzzles[nextIdx]);
      setGameState('playing');
      soundManager.playRoundStart();
    }
  };

  const handleGameOver = () => {
    soundManager.playVictory();
    setGameState('game_over');
    const isWin = solvedCount >= 4;
    updateStats(
      {
        gamesPlayed: 1,
        wins: isWin ? 1 : 0,
        totalScore: score,
      },
      isWin
    );

    if (aiConfig?.withBet) {
      setWagerWon(isWin);
      setShowWagerModal(true);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 animate-fade-in font-sans select-none">
      {/* VS BOT Active Wager Bar */}
      <VsBotWagerBanner aiConfig={aiConfig} gameTitle="Word Anagram Scramble" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          onClick={onBackToHub}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Arcade Hub</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-md text-white">
            <SpellCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white leading-none">
              Word Anagram Scramble
            </h2>
            <span className="text-[11px] font-bold text-emerald-500">Fast-Paced Vocabulary Rush</span>
          </div>
        </div>

        {gameState !== 'intro' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-xl font-black text-xs border border-amber-500/20">
              <Trophy className="w-3.5 h-3.5" />
              <span>{score} PTS</span>
            </div>
            {streak > 1 && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 text-rose-500 rounded-xl font-black text-xs border border-rose-500/20 animate-pulse">
                <Flame className="w-3.5 h-3.5" />
                <span>{streak}x Combo</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* INTRO SCREEN */}
      {gameState === 'intro' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-xl"
        >
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-2xl text-white animate-pulse">
            <SpellCheck className="w-12 h-12" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">
              Word Anagram Scramble!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Unscramble jumbled letter tiles before the fuse runs out. Tap or click tiles to form the secret mystery word!
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col items-center">
              <Timer className="w-6 h-6 text-emerald-500 mb-1" />
              <p className="font-bold text-slate-800 dark:text-slate-200">Rapid Timer</p>
              <p className="text-[10px] text-slate-500">Quick solves score higher</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col items-center">
              <HelpCircle className="w-6 h-6 text-teal-500 mb-1" />
              <p className="font-bold text-slate-800 dark:text-slate-200">Clue Hints</p>
              <p className="text-[10px] text-slate-500">Category & definition hints</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col items-center">
              <Flame className="w-6 h-6 text-rose-500 mb-1" />
              <p className="font-bold text-slate-800 dark:text-slate-200">Streak Combo</p>
              <p className="text-[10px] text-slate-500">Bonus points on streaks</p>
            </div>
          </div>

          <button
            onClick={handleStartGame}
            className="px-8 py-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all shadow-xl shadow-emerald-600/30 hover:scale-105 active:scale-95"
          >
            <span>Start Scramble</span>
          </button>
        </motion.div>
      )}

      {/* ACTIVE GAMEPLAY */}
      {(gameState === 'playing' || gameState === 'round_end') && currentPuzzle && (
        <div className="space-y-4">
          {/* Status Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">
                Word {currentIndex + 1} of {Math.min(puzzles.length, 7)}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase">
                {currentPuzzle.category}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold">
                {currentPuzzle.difficulty}
              </span>
            </div>

            {/* Hint & Timer */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowHint(true)}
                disabled={showHint}
                className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-all"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>{showHint ? 'Hint Revealed' : 'Reveal Hint'}</span>
              </button>

              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-black ${
                  timeLeft <= 5 ? 'bg-rose-500 text-white animate-bounce' : 'bg-emerald-600 text-white'
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>{timeLeft}s</span>
              </div>
            </div>
          </div>

          {/* Main Board */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl text-center">
            {/* Clue Prompt */}
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Unscramble this {currentPuzzle.word.length}-letter {currentPuzzle.category} word:
              </p>
              {showHint && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm font-semibold text-teal-600 dark:text-teal-400"
                >
                  💡 Clue: {currentPuzzle.hint}
                </motion.p>
              )}
            </div>

            {/* Solution Slot Rack */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 min-h-[72px] p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border-2 border-dashed border-slate-300 dark:border-slate-700 flex-wrap">
              {Array.from({ length: currentPuzzle.word.length }).map((_, slotIdx) => {
                const placed = placedTiles[slotIdx];
                return (
                  <div
                    key={slotIdx}
                    onClick={() => placed && handleRemoveTile(placed)}
                    className={`w-12 h-14 sm:w-14 sm:h-16 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black transition-all ${
                      placed
                        ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg cursor-pointer hover:scale-105 active:scale-95'
                        : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-300'
                    }`}
                  >
                    {placed ? placed.letter : ''}
                  </div>
                );
              })}
            </div>

            {/* Feedback alert */}
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-2.5 rounded-xl text-xs font-bold ${
                  feedback.isError
                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                }`}
              >
                {feedback.text}
              </motion.div>
            )}

            {/* Available Letter Tiles */}
            {gameState === 'playing' && (
              <div className="space-y-4 pt-2">
                <p className="text-xs font-bold text-slate-400">Available Letter Tiles:</p>
                <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                  {scrambledTiles.map((tile) => (
                    <motion.button
                      key={tile.id}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleSelectTile(tile)}
                      className="w-12 h-14 sm:w-14 sm:h-16 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 hover:border-emerald-500 text-xl sm:text-2xl font-black shadow-md transition-all flex items-center justify-center"
                    >
                      {tile.letter}
                    </motion.button>
                  ))}
                </div>

                {/* Clear & Shuffle Controls */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={placedTiles.length === 0}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Slots</span>
                  </button>
                </div>
              </div>
            )}

            {/* Round end next button */}
            {gameState === 'round_end' && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleNextPuzzle}
                  className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
                >
                  Next Anagram Puzzle →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GAME OVER */}
      {gameState === 'game_over' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-xl"
        >
          <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-inner">
            <Trophy className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Anagram Scramble Complete!
            </h2>
            <p className="text-xs text-slate-400">
              You scored <b>{score} PTS</b> with <b>{solvedCount} words unscrambled</b>!
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <p className="text-xl font-black text-emerald-500">{score}</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Total Score</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <p className="text-xl font-black text-teal-500">{solvedCount} / 7</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Solved</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <p className="text-xl font-black text-rose-500">{maxStreak}x</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Best Streak</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleStartGame}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all"
            >
              Play Again
            </button>
            <button
              onClick={onBackToHub}
              className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all"
            >
              Arcade Hub
            </button>
          </div>
        </motion.div>
      )}

      {/* VS BOT Wager Payout / Rematch Modal */}
      <VsBotPayoutModal
        isOpen={showWagerModal}
        won={wagerWon}
        aiConfig={aiConfig}
        gameTitle="Word Anagram Scramble"
        onRematch={() => {
          setShowWagerModal(false);
          handleStartGame();
        }}
        onBackToHub={onBackToHub}
      />
    </div>
  );
};
