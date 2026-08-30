import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bomb,
  Flame,
  Heart,
  Sparkles,
  Trophy,
  RotateCcw,
  Volume2,
  VolumeX,
  Zap,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Bot,
  User,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../utils/soundEffects';
import { isValidEnglishWord, SYLLABLE_PROMPTS, SyllablePromptConfig } from '../../utils/dictionary';

interface WordBombProps {
  onBackToHub: () => void;
}

export const WordBomb: React.FC<WordBombProps> = ({ onBackToHub }) => {
  const { user, updateStats } = useAuth();

  // Game state
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'exploded' | 'victory'>('intro');
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [inputWord, setInputWord] = useState('');
  const [usedWords, setUsedWords] = useState<string[]>([]);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [totalTime, setTotalTime] = useState(10);
  const [defusedCount, setDefusedCount] = useState(0);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const [botOpponent, setBotOpponent] = useState(true);
  const [botTurn, setBotTurn] = useState(false);
  const [botThinkingText, setBotThinkingText] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentPrompt = SYLLABLE_PROMPTS[currentPromptIndex];

  // Start new game
  const handleStartGame = (withBot: boolean = true) => {
    setBotOpponent(withBot);
    setGameState('playing');
    setLives(3);
    setScore(0);
    setStreak(0);
    setDefusedCount(0);
    setUsedWords([]);
    setBotTurn(false);
    pickNewPrompt(10);
    soundManager.playRoundStart();
  };

  const pickNewPrompt = (timeAllowed: number = 10) => {
    const randomIndex = Math.floor(Math.random() * SYLLABLE_PROMPTS.length);
    setCurrentPromptIndex(randomIndex);
    setTimeLeft(timeAllowed);
    setTotalTime(timeAllowed);
    setInputWord('');
    setFeedback(null);
    setBotTurn(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Timer Tick-Tick-Boom loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeOut();
          return 0;
        }
        if (prev <= 4) {
          soundManager.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, botTurn, currentPromptIndex, lives]);

  // Handle Bomb Explosion when time runs out
  const handleTimeOut = () => {
    soundManager.playGameOver();
    setShakeScreen(true);
    setTimeout(() => setShakeScreen(false), 800);

    if (botTurn) {
      // Bot failed! Player gets bonus!
      setFeedback({ text: 'Bot exploded! You win the duel!', isError: false });
      setScore((s) => s + 250);
      setDefusedCount((c) => c + 1);
      setTimeout(() => {
        pickNewPrompt(Math.max(6, 10 - Math.floor(defusedCount / 2)));
      }, 1500);
      return;
    }

    // Player lost a life
    const newLives = lives - 1;
    setLives(newLives);

    if (newLives <= 0) {
      setGameState('exploded');
      updateStats({
        gamesPlayed: 1,
        totalScore: score,
        bombsDefused: defusedCount,
      });
    } else {
      setFeedback({ text: `BOOM! -1 Life! (${newLives} left)`, isError: true });
      setStreak(0);
      setTimeout(() => {
        pickNewPrompt(Math.max(6, 10 - Math.floor(defusedCount / 2)));
      }, 1500);
    }
  };

  // Handle Player Word Submit
  const handleWordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameState !== 'playing' || botTurn) return;

    const word = inputWord.trim().toUpperCase();
    if (!word) return;

    // Check 1: Must contain syllable prompt
    if (!word.includes(currentPrompt.prompt)) {
      soundManager.playTick();
      setFeedback({ text: `Must contain "${currentPrompt.prompt}"!`, isError: true });
      return;
    }

    // Check 2: Word length minimum 3 chars
    if (word.length < 3) {
      soundManager.playTick();
      setFeedback({ text: 'Word must be at least 3 letters!', isError: true });
      return;
    }

    // Check 3: Cannot reuse word in same match
    if (usedWords.includes(word)) {
      soundManager.playTick();
      setFeedback({ text: `"${word}" was already used this round!`, isError: true });
      return;
    }

    // Check 4: Strict English Dictionary Check (No random or fake words!)
    if (!isValidEnglishWord(word)) {
      soundManager.playTick();
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 500);
      setFeedback({ text: `❌ "${word}" is not a recognized English word!`, isError: true });
      return;
    }

    // Success! Defused!
    soundManager.playCorrectGuess();
    const multiplier = streak >= 4 ? 3 : streak >= 2 ? 2 : 1;
    const gained = Math.round((word.length * 15 + timeLeft * 10) * multiplier);

    setScore((s) => s + gained);
    setStreak((st) => st + 1);
    setDefusedCount((c) => c + 1);
    setUsedWords((prev) => [...prev, word]);
    setFeedback({ text: `+${gained} PTS! "${word}" accepted! Defused!`, isError: false });

    // Trigger Bot's Counter Turn if Bot mode is on
    if (botOpponent && Math.random() > 0.15) {
      setBotTurn(true);
      setBotThinkingText('SparkyBot is thinking of a word...');
      const botTime = Math.floor(2 + Math.random() * 2.5);
      setTimeLeft(botTime + 2);
      setTotalTime(botTime + 2);

      setTimeout(() => {
        if (gameState !== 'playing') return;
        // Bot selects verified valid word from examples or prompt list
        const candidateWords = currentPrompt.examples.filter(
          (w) => !usedWords.includes(w) && w !== word && isValidEnglishWord(w)
        );
        const botWord =
          candidateWords.length > 0
            ? candidateWords[Math.floor(Math.random() * candidateWords.length)]
            : currentPrompt.examples[0];

        setUsedWords((prev) => [...prev, botWord]);
        soundManager.playWordReveal();
        setFeedback({ text: `Bot played "${botWord}"! Your turn!`, isError: false });
        setTimeout(() => {
          pickNewPrompt(Math.max(6, 10 - Math.floor(defusedCount / 2)));
        }, 1200);
      }, botTime * 1000);
    } else {
      setTimeout(() => {
        pickNewPrompt(Math.max(6, 10 - Math.floor(defusedCount / 2)));
      }, 1000);
    }
  };

  const progressPercent = (timeLeft / totalTime) * 100;

  return (
    <div
      className={`w-full max-w-4xl mx-auto space-y-6 animate-fade-in font-sans select-none ${
        shakeScreen ? 'animate-bounce' : ''
      }`}
    >
      {/* Top Bar Header */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          onClick={onBackToHub}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Arcade Hub</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-md shadow-rose-500/20 text-white">
            <Bomb className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white leading-none">
              Word Bomb Chain
            </h2>
            <span className="text-[11px] font-bold text-amber-500">Tick-Tick-Boom!</span>
          </div>
        </div>

        {/* Lives Counter & Score */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: i <= lives ? 1 : 0.8 }}
                className={`transition-colors ${i <= lives ? 'text-rose-500 fill-rose-500' : 'text-slate-300 dark:text-slate-700'}`}
              >
                <Heart className={`w-5 h-5 ${i <= lives ? 'fill-rose-500' : ''}`} />
              </motion.div>
            ))}
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold block leading-none">SCORE</span>
            <span className="text-sm font-black text-amber-500">{score}</span>
          </div>
        </div>
      </div>

      {/* INTRO SCREEN */}
      {gameState === 'intro' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-xl relative overflow-hidden"
        >
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-rose-500 via-amber-500 to-yellow-500 flex items-center justify-center shadow-2xl shadow-rose-500/30 animate-pulse text-white">
            <Bomb className="w-12 h-12" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">
              Can You Defuse the Word Bomb?
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              A sizzling bomb with a burning fuse will appear on screen with a random syllable (e.g. <b>"STR"</b>). Quickly type any valid English word containing those letters before the clock hits zero!
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col items-center">
              <Clock className="w-6 h-6 text-amber-500 mb-1" />
              <p className="font-bold text-slate-800 dark:text-slate-200">10s Fast Fuse</p>
              <p className="text-[10px] text-slate-500">Accelerating ticks</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col items-center">
              <Flame className="w-6 h-6 text-rose-500 mb-1" />
              <p className="font-bold text-slate-800 dark:text-slate-200">Streak Combo</p>
              <p className="text-[10px] text-slate-500">Up to 3x Points</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col items-center">
              <Bot className="w-6 h-6 text-indigo-500 mb-1" />
              <p className="font-bold text-slate-800 dark:text-slate-200">Bot Relay</p>
              <p className="text-[10px] text-slate-500">Duel SparkyBot</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={() => handleStartGame(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-rose-600 via-amber-600 to-yellow-600 hover:from-rose-500 hover:to-yellow-500 transition-all shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
            >
              <Flame className="w-5 h-5 fill-white" />
              <span>Start 1v1 Bot Duel</span>
            </button>

            <button
              onClick={() => handleStartGame(false)}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl font-bold text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              <span>Solo Survival Mode</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* ACTIVE GAMEPLAY ARENA */}
      {gameState === 'playing' && (
        <div className="space-y-6">
          {/* Bomb Visual Stage */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl relative overflow-hidden flex flex-col items-center justify-center min-h-[380px]">
            {/* Animated Background Atmosphere */}
            <div
              className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
                timeLeft <= 3
                  ? 'bg-rose-500/15 animate-pulse'
                  : timeLeft <= 5
                  ? 'bg-amber-500/10'
                  : 'bg-transparent'
              }`}
            />

            {/* Streak Multiplier Badge */}
            {streak > 1 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-4 right-4 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-black shadow-lg shadow-amber-500/30"
              >
                <Flame className="w-4 h-4 fill-white" />
                <span>{streak}x STREAK ({streak >= 4 ? '3x' : '2x'} PTS)</span>
              </motion.div>
            )}

            {/* Syllable Prompt Centerpiece */}
            <div className="relative">
              {/* Bomb Glow Container */}
              <motion.div
                animate={{
                  scale: timeLeft <= 3 ? [1, 1.15, 1] : [1, 1.04, 1],
                  rotate: timeLeft <= 3 ? [-3, 3, -3] : [0, 0, 0],
                }}
                transition={{ repeat: Infinity, duration: timeLeft <= 3 ? 0.3 : 1 }}
                className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-slate-950 via-slate-800 to-slate-900 border-4 border-amber-500/40 flex flex-col items-center justify-center text-white shadow-2xl relative"
                style={{
                  boxShadow:
                    timeLeft <= 3
                      ? '0 0 50px rgba(244, 63, 94, 0.6)'
                      : '0 0 35px rgba(245, 158, 11, 0.4)',
                }}
              >
                {/* Fuse & Spark */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <motion.div
                    animate={{ rotate: [0, 360], scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 0.4 }}
                    className="text-amber-300 flex items-center justify-center"
                  >
                    <Sparkles className="w-5 h-5 fill-amber-300" />
                  </motion.div>
                  <div className="w-1.5 h-6 bg-amber-600 rounded-full" />
                </div>

                <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
                  Contains:
                </span>
                <span className="text-4xl sm:text-5xl font-black tracking-widest text-white drop-shadow-md">
                  {currentPrompt.prompt}
                </span>
              </motion.div>
            </div>

            {/* Time Bar */}
            <div className="w-full max-w-md space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400 flex items-center gap-1.5">
                  {botTurn ? <Bot className="w-4 h-4 text-indigo-500" /> : <Zap className="w-4 h-4 text-amber-500" />}
                  {botTurn ? 'BOT TURN' : 'YOUR TURN'}
                </span>
                <span
                  className={`font-mono text-sm font-black ${
                    timeLeft <= 3 ? 'text-rose-500 animate-pulse' : 'text-amber-500'
                  }`}
                >
                  {timeLeft}s
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                <motion.div
                  className={`h-full transition-all duration-300 rounded-full ${
                    timeLeft <= 3
                      ? 'bg-rose-500'
                      : timeLeft <= 6
                      ? 'bg-amber-500'
                      : 'bg-gradient-to-r from-emerald-500 to-indigo-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Feedback message */}
            <AnimatePresence mode="wait">
              {feedback && (
                <motion.div
                  key={feedback.text}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className={`px-4 py-1.5 rounded-full text-xs font-black inline-flex items-center gap-1.5 border ${
                    feedback.isError
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  }`}
                >
                  <span>{feedback.text}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Typing Form Input */}
          <form onSubmit={handleWordSubmit} className="relative max-w-xl mx-auto">
            <input
              ref={inputRef}
              type="text"
              value={inputWord}
              onChange={(e) => setInputWord(e.target.value.toUpperCase())}
              disabled={botTurn}
              placeholder={
                botTurn
                  ? 'SparkyBot is answering...'
                  : `Type word with "${currentPrompt.prompt}" & press ENTER...`
              }
              className="w-full px-6 py-4 text-center uppercase tracking-widest text-xl font-black bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl border-2 border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:outline-none shadow-lg disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={botTurn || !inputWord.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-30 transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
            >
              <Bomb className="w-3.5 h-3.5" />
              <span>DEFUSE</span>
            </button>
          </form>

          {/* Words Defused History Pill List */}
          {usedWords.length > 0 && (
            <div className="text-center space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Defused Words ({usedWords.length}):
              </span>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {usedWords.slice(-8).map((w, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* GAME OVER SCREEN */}
      {gameState === 'exploded' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-xl"
        >
          <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-inner">
            <Bomb className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Boom! Bomb Exploded!
            </h2>
            <p className="text-xs text-slate-500">
              Great effort! You survived multiple rounds of the word bomb chain.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md mx-auto">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-400 font-bold block">TOTAL SCORE</span>
              <span className="text-2xl font-black text-amber-500">{score}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-400 font-bold block">BOMBS DEFUSED</span>
              <span className="text-2xl font-black text-emerald-500">{defusedCount}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 col-span-2 sm:col-span-1">
              <span className="text-xs text-slate-400 font-bold block">BEST STREAK</span>
              <span className="text-2xl font-black text-purple-500">{streak}x</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => handleStartGame(botOpponent)}
              className="px-6 py-3 rounded-2xl font-black text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>
            <button
              onClick={onBackToHub}
              className="px-6 py-3 rounded-2xl font-bold text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              Back to Arcade Hub
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
