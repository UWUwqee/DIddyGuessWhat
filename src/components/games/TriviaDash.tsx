import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Brain,
  Timer,
  Trophy,
  Zap,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Flame,
  Award,
  RefreshCw,
  Eye,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../utils/soundEffects';

interface TriviaQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  points: number;
}

const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    id: 't1',
    category: 'Gaming',
    question: 'In Minecraft, which block is immune to explosions from Creepers and TNT?',
    options: ['Cobblestone', 'Obsidian', 'Iron Block', 'Oak Wood'],
    correctIndex: 1,
    explanation: 'Obsidian has an extremely high blast resistance of 1,200.',
    points: 120,
  },
  {
    id: 't2',
    category: 'Science',
    question: 'What is the most abundant chemical element in the universe?',
    options: ['Oxygen', 'Carbon', 'Hydrogen', 'Helium'],
    correctIndex: 2,
    explanation: 'Hydrogen accounts for roughly 75% of the baryonic mass of the universe.',
    points: 100,
  },
  {
    id: 't3',
    category: 'Tech & AI',
    question: 'Which company created the first graphical user interface (GUI) and computer mouse?',
    options: ['Apple', 'Xerox (PARC)', 'Microsoft', 'IBM'],
    correctIndex: 1,
    explanation: 'Xerox PARC developed the Alto in 1973, pioneering GUIs and mice.',
    points: 140,
  },
  {
    id: 't4',
    category: 'Pop Culture',
    question: 'What is the name of the fictional kingdom in Disney’s "Frozen"?',
    options: ['Genovia', 'Arendelle', 'Florin', 'Corona'],
    correctIndex: 1,
    explanation: 'Elsa and Anna rule over the kingdom of Arendelle.',
    points: 100,
  },
  {
    id: 't5',
    category: 'Geography',
    question: 'Which is the only continent covered entirely by a single country?',
    options: ['Antarctica', 'Australia', 'Europe', 'South America'],
    correctIndex: 1,
    explanation: 'The continent of Australia is occupied entirely by the nation of Australia.',
    points: 110,
  },
  {
    id: 't6',
    category: 'Gaming',
    question: 'What was Mario’s original name in the 1981 arcade game Donkey Kong?',
    options: ['Luigi', 'Plumber Pete', 'Jumpman', 'Red Cap'],
    correctIndex: 2,
    explanation: 'Mario was first introduced as Jumpman before receiving his iconic name.',
    points: 130,
  },
  {
    id: 't7',
    category: 'Space',
    question: 'Which planet in our solar system has the most prominent ring system?',
    options: ['Jupiter', 'Uranus', 'Neptune', 'Saturn'],
    correctIndex: 3,
    explanation: 'Saturn possesses the most extensive ring system made of ice and rock particles.',
    points: 100,
  },
  {
    id: 't8',
    category: 'Anime & Manga',
    question: 'In "One Piece", what kind of Devil Fruit power did Monkey D. Luffy eat?',
    options: ['Flame-Flame Fruit', 'Gum-Gum Fruit (Hito Hito no Mi)', 'Chop-Chop Fruit', 'Ice-Ice Fruit'],
    correctIndex: 1,
    explanation: 'Luffy ate the Gomu Gomu no Mi (Model Nika).',
    points: 130,
  },
  {
    id: 't9',
    category: 'Science',
    question: 'What is the speed of light in a vacuum (approximate)?',
    options: ['300,000 km/s', '150,000 km/s', '1,000,000 km/s', '50,000 km/s'],
    correctIndex: 0,
    explanation: 'Light travels at approximately 299,792 kilometers per second in a vacuum.',
    points: 130,
  },
  {
    id: 't10',
    category: 'Cinema',
    question: 'Which movie won the first ever Academy Award for Best Animated Feature in 2002?',
    options: ['Monsters, Inc.', 'Shrek', 'Jimmy Neutron', 'Finding Nemo'],
    correctIndex: 1,
    explanation: 'DreamWorks’ Shrek won the inaugural Best Animated Feature Oscar.',
    points: 150,
  },
  {
    id: 't11',
    category: 'Gaming',
    question: 'In "The Legend of Zelda: Ocarina of Time", what is the name of Link’s companion fairy?',
    options: ['Tatl', 'Midna', 'Navi', 'Fi'],
    correctIndex: 2,
    explanation: 'Navi famously guides Link throughout his quest with "Hey! Listen!".',
    points: 120,
  },
  {
    id: 't12',
    category: 'Tech & AI',
    question: 'What does "HTML" stand for in web development?',
    options: [
      'HyperText Markup Language',
      'HighTech Modular Language',
      'Hyperlink Text Management Layout',
      'Home Tool Markup Language',
    ],
    correctIndex: 0,
    explanation: 'HTML stands for HyperText Markup Language, the standard document format for the web.',
    points: 100,
  },
  {
    id: 't13',
    category: 'Nature',
    question: 'Which is the largest living mammal on planet Earth?',
    options: ['African Elephant', 'Blue Whale', 'Colossal Squid', 'Giraffe'],
    correctIndex: 1,
    explanation: 'The Blue Whale can reach lengths of up to 30 meters and weigh close to 200 tons.',
    points: 100,
  },
  {
    id: 't14',
    category: 'History',
    question: 'In what year did the Apollo 11 mission successfully land the first humans on the Moon?',
    options: ['1965', '1969', '1972', '1959'],
    correctIndex: 1,
    explanation: 'Neil Armstrong and Buzz Aldrin set foot on the moon on July 20, 1969.',
    points: 140,
  },
  {
    id: 't15',
    category: 'Music',
    question: 'Which iconic British rock band was known as the "Fab Four"?',
    options: ['Queen', 'The Rolling Stones', 'The Beatles', 'Led Zeppelin'],
    correctIndex: 2,
    explanation: 'The Beatles (John, Paul, George, and Ringo) were nicknamed the Fab Four.',
    points: 110,
  },
  {
    id: 't16',
    category: 'Gaming',
    question: 'What is the highest-grossing media franchise of all time worldwide?',
    options: ['Star Wars', 'Pokémon', 'Marvel Cinematic Universe', 'Super Mario'],
    correctIndex: 1,
    explanation: 'Pokémon has generated over $100 billion in lifetime revenue.',
    points: 140,
  },
  {
    id: 't17',
    category: 'Science',
    question: 'What is the powerhouse organelle of the eukaryotic cell?',
    options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi Apparatus'],
    correctIndex: 1,
    explanation: 'Mitochondria produce ATP, providing biochemical energy for cells.',
    points: 100,
  },
  {
    id: 't18',
    category: 'Geography',
    question: 'What is the longest river in the world by consensus measurements?',
    options: ['Amazon River', 'Nile River', 'Yangtze River', 'Mississippi River'],
    correctIndex: 1,
    explanation: 'The Nile River flows for approximately 6,650 kilometers (4,132 miles).',
    points: 120,
  },
  {
    id: 't19',
    category: 'Cinema',
    question: 'Which director directed the blockbuster sci-fi movie "Interstellar" and "Inception"?',
    options: ['Steven Spielberg', 'Christopher Nolan', 'Denis Villeneuve', 'James Cameron'],
    correctIndex: 1,
    explanation: 'Christopher Nolan directed both acclaimed sci-fi classics.',
    points: 120,
  },
  {
    id: 't20',
    category: 'Pop Culture',
    question: 'What is the world record speedrun time category for beating Minecraft called?',
    options: ['Any% Glitchless', '100% Complete', 'Hardcore Max', 'Boss Rush'],
    correctIndex: 0,
    explanation: 'Any% Glitchless is the most popular competitive speedrun category.',
    points: 130,
  },
];

interface TriviaDashProps {
  onBackToHub: () => void;
}

export const TriviaDash: React.FC<TriviaDashProps> = ({ onBackToHub }) => {
  const { user, updateStats } = useAuth();

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'round_end' | 'game_over'>('intro');
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);
  const [hasUsed5050, setHasUsed5050] = useState(false);
  const [hasUsedHint, setHasUsedHint] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQ = questions[currentIndex];

  const handleStartGame = () => {
    // Shuffle questions
    const shuffled = [...TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCorrectCount(0);
    setHasUsed5050(false);
    setHasUsedHint(false);
    setShowHint(false);
    setEliminatedOptions([]);
    setSelectedOption(null);
    setTimeLeft(15);
    setGameState('playing');
    soundManager.playRoundStart();
  };

  // Question Timer
  useEffect(() => {
    if (gameState !== 'playing') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
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
  }, [gameState, currentIndex]);

  const handleTimeOut = () => {
    soundManager.playCloseGuess();
    setStreak(0);
    setGameState('round_end');
  };

  const handleSelectOption = (index: number) => {
    if (selectedOption !== null || gameState !== 'playing') return;

    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedOption(index);

    const isCorrect = index === currentQ.correctIndex;

    if (isCorrect) {
      soundManager.playCorrectGuess();
      const timeBonus = Math.round(timeLeft * 10);
      const streakBonus = streak * 25;
      const totalEarned = currentQ.points + timeBonus + streakBonus;

      setScore((s) => s + totalEarned);
      setStreak((st) => {
        const next = st + 1;
        if (next > maxStreak) setMaxStreak(next);
        return next;
      });
      setCorrectCount((c) => c + 1);
    } else {
      soundManager.playCloseGuess();
      setStreak(0);
    }

    setGameState('round_end');
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 >= questions.length || currentIndex >= 7) {
      handleGameOver();
    } else {
      setCurrentIndex((idx) => idx + 1);
      setSelectedOption(null);
      setEliminatedOptions([]);
      setShowHint(false);
      setTimeLeft(15);
      setGameState('playing');
      soundManager.playRoundStart();
    }
  };

  const handleUse5050 = () => {
    if (hasUsed5050 || selectedOption !== null || !currentQ) return;
    soundManager.playTick();
    setHasUsed5050(true);

    const wrongIndexes = [0, 1, 2, 3].filter((i) => i !== currentQ.correctIndex);
    const toEliminate = wrongIndexes.sort(() => Math.random() - 0.5).slice(0, 2);
    setEliminatedOptions(toEliminate);
  };

  const handleUseHint = () => {
    if (hasUsedHint || !currentQ) return;
    soundManager.playTick();
    setHasUsedHint(true);
    setShowHint(true);
  };

  const handleGameOver = () => {
    soundManager.playVictory();
    setGameState('game_over');
    updateStats(
      {
        gamesPlayed: 1,
        wins: correctCount >= 5 ? 1 : 0,
        totalScore: score,
      },
      correctCount >= 5
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 animate-fade-in font-sans select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          onClick={onBackToHub}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Arcade Hub</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-md text-white">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white leading-none">
              Trivia Dash Royale
            </h2>
            <span className="text-[11px] font-bold text-indigo-500">Live Knowledge Clash</span>
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
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-2xl text-white animate-pulse">
            <Brain className="w-12 h-12" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">
              Trivia Dash Royale
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Race against the 15-second clock across Gaming, Science, Tech, and Pop Culture. Build streak combos and activate lifelines!
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col items-center">
              <Timer className="w-6 h-6 text-indigo-500 mb-1" />
              <p className="font-bold text-slate-800 dark:text-slate-200">15s Speed Blitz</p>
              <p className="text-[10px] text-slate-500">Fast answers score +10x</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col items-center">
              <Flame className="w-6 h-6 text-rose-500 mb-1" />
              <p className="font-bold text-slate-800 dark:text-slate-200">Streak Combos</p>
              <p className="text-[10px] text-slate-500">Consecutive hit bonuses</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col items-center">
              <HelpCircle className="w-6 h-6 text-amber-500 mb-1" />
              <p className="font-bold text-slate-800 dark:text-slate-200">50:50 Lifeline</p>
              <p className="text-[10px] text-slate-500">Cut 2 wrong options</p>
            </div>
          </div>

          <button
            onClick={handleStartGame}
            className="px-8 py-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95"
          >
            <span>Start Trivia Sprint</span>
          </button>
        </motion.div>
      )}

      {/* ACTIVE PLAYING & ROUND END */}
      {(gameState === 'playing' || gameState === 'round_end') && currentQ && (
        <div className="space-y-4">
          {/* Progress & Timer Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">
                Question {currentIndex + 1} of {Math.min(questions.length, 8)}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase">
                {currentQ.category}
              </span>
            </div>

            {/* Lifeline Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUse5050}
                disabled={hasUsed5050 || selectedOption !== null}
                className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-all"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>50:50</span>
              </button>

              <button
                type="button"
                onClick={handleUseHint}
                disabled={hasUsedHint || selectedOption !== null}
                className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>Hint</span>
              </button>
            </div>

            {/* Time Left Badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-black ${
                timeLeft <= 4
                  ? 'bg-rose-500 text-white animate-bounce'
                  : 'bg-indigo-600 text-white'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>{timeLeft}s</span>
            </div>
          </div>

          {/* Question Card */}
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl"
          >
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white text-center leading-snug">
              {currentQ.question}
            </h3>

            {showHint && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs rounded-xl text-center font-bold flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Hint: Category is {currentQ.category}. Think carefully!</span>
              </motion.div>
            )}

            {/* 4 Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQ.options.map((opt, idx) => {
                const isEliminated = eliminatedOptions.includes(idx);
                const isChosen = selectedOption === idx;
                const isCorrect = idx === currentQ.correctIndex;
                const showResult = gameState === 'round_end';

                let btnStyle =
                  'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-750';

                if (showResult) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30';
                  } else if (isChosen) {
                    btnStyle = 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30';
                  } else {
                    btnStyle = 'opacity-40 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isEliminated || gameState === 'round_end'}
                    onClick={() => handleSelectOption(idx)}
                    className={`p-4 rounded-2xl border-2 font-bold text-sm text-left flex items-center justify-between transition-all select-none ${btnStyle} ${
                      isEliminated ? 'opacity-20 cursor-not-allowed line-through' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-black/10 dark:bg-white/10 flex items-center justify-center text-xs font-black">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </div>

                    {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-white" />}
                    {showResult && isChosen && !isCorrect && <XCircle className="w-5 h-5 text-white" />}
                  </button>
                );
              })}
            </div>

            {/* Round Explanation & Next Button */}
            {gameState === 'round_end' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <b>Explanation:</b> {currentQ.explanation}
                </p>

                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md transition-all whitespace-nowrap"
                >
                  Next Question →
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}

      {/* GAME OVER SUMMARY */}
      {gameState === 'game_over' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-xl"
        >
          <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-inner">
            <Trophy className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Trivia Dash Complete!
            </h2>
            <p className="text-xs text-slate-400">
              You scored <b>{score} PTS</b> with <b>{correctCount} correct answers</b>!
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <p className="text-xl font-black text-indigo-500">{score}</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Total Score</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <p className="text-xl font-black text-emerald-500">{correctCount} / 8</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Correct</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <p className="text-xl font-black text-rose-500">{maxStreak}x</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Best Streak</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleStartGame}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md transition-all"
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
    </div>
  );
};
