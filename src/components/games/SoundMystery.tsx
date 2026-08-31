import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Flame,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Music,
  Radio,
  Disc3,
  Award,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../utils/soundEffects';

interface MysterySoundItem {
  id: string;
  name: string;
  soundKey: string;
  category: string;
  icon: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
  hint: string;
  funFact: string;
  options: string[];
}

const SOUND_COLLECTION: MysterySoundItem[] = [
  {
    id: 's1',
    name: 'Thunder & Rainstorm',
    soundKey: 'thunder',
    category: 'Nature & Weather',
    icon: '⚡',
    difficulty: 'Easy',
    points: 150,
    hint: 'Atmospheric electrostatic discharge accompanied by rumbling acoustic waves',
    funFact: 'Thunder can reach temperatures five times hotter than the surface of the sun!',
    options: ['Thunder & Rainstorm', 'Ocean Waves', 'Avalanche', 'Fireworks Show'],
  },
  {
    id: 's2',
    name: 'Sci-Fi Laser Blaster',
    soundKey: 'laser',
    category: 'Sci-Fi & Arcade',
    icon: '🔫',
    difficulty: 'Easy',
    points: 140,
    hint: 'Futuristic high-energy plasma weapon heard in space battles',
    funFact: 'Classic Star Wars blaster sounds were recorded by striking metal radio tower guy-wires with a wrench!',
    options: ['Sci-Fi Laser Blaster', 'Camera Shutter', 'Whip Crack', 'Electric Spark'],
  },
  {
    id: 's3',
    name: 'V8 Sports Car Engine Rev',
    soundKey: 'car_engine',
    category: 'Vehicles & Machinery',
    icon: '🏎️',
    difficulty: 'Easy',
    points: 150,
    hint: 'High-horsepower internal combustion engine accelerating rapidly',
    funFact: 'Supercar exhausts are acoustically tuned by sound engineers like musical instruments.',
    options: ['V8 Sports Car Engine Rev', 'Motorcycle Idling', 'Helicopter Rotor', 'Chainsaw Cutting'],
  },
  {
    id: 's4',
    name: 'Extraterrestrial UFO Beam',
    soundKey: 'ufo',
    category: 'Sci-Fi & Mystery',
    icon: '🛸',
    difficulty: 'Medium',
    points: 190,
    hint: 'Pulsating modulated magnetic ray from an alien spacecraft',
    funFact: 'Theremins and frequency-modulated synthesizers created early 1950s UFO sounds.',
    options: ['Extraterrestrial UFO Beam', 'Police Siren', 'Whale Call', 'Wind Chimes'],
  },
  {
    id: 's5',
    name: 'Domestic Cat Purr & Meow',
    soundKey: 'cat_meow',
    category: 'Animals',
    icon: '🐱',
    difficulty: 'Easy',
    points: 130,
    hint: 'Vocal feline greeting expressing affection and contentment',
    funFact: 'Cats purr at frequencies between 25 and 150 Hz, which has been shown to improve bone density and heal muscles!',
    options: ['Domestic Cat Purr & Meow', 'Songbird Chirp', 'Puppy Whine', 'Dolphin Squeak'],
  },
  {
    id: 's6',
    name: 'Microwave Oven Timer Ding',
    soundKey: 'microwave_ding',
    category: 'Household & Daily',
    icon: '🍲',
    difficulty: 'Medium',
    points: 170,
    hint: 'Kitchen appliance chime announcing your meal is thoroughly warmed',
    funFact: 'Microwave ovens were accidentally invented when an engineer noticed a chocolate bar melted in his pocket near radar equipment.',
    options: ['Microwave Oven Timer Ding', 'Elevator Arrival Chime', 'Bicycle Bell', 'Hotel Front Desk Bell'],
  },
  {
    id: 's7',
    name: '8-Bit Arcade Jump',
    soundKey: 'retro_jump',
    category: 'Retro Gaming',
    icon: '🕹️',
    difficulty: 'Easy',
    points: 140,
    hint: 'Classic 1980s square-wave audio bounce from vintage platformer games',
    funFact: 'Early video game chips only had 3 to 4 simultaneous sound channels available.',
    options: ['8-Bit Arcade Jump', 'Pinball Bumper', 'Spring Boing', 'Subway Token Insert'],
  },
  {
    id: 's8',
    name: 'Vintage Rotary Telephone Ring',
    soundKey: 'telephone',
    category: 'Vintage Tech',
    icon: '☎️',
    difficulty: 'Medium',
    points: 180,
    hint: 'Dual-frequency bell ringback signal on early telecommunications networks',
    funFact: 'The standard telephone ring frequency in North America combines 440 Hz and 480 Hz tones.',
    options: ['Vintage Rotary Telephone Ring', 'School Fire Alarm', 'Cash Register Ring', 'Doorbell Chime'],
  },
  {
    id: 's9',
    name: 'Space Rocket Launch Booster',
    soundKey: 'rocket_launch',
    category: 'Space & Aerodynamics',
    icon: '🚀',
    difficulty: 'Hard',
    points: 220,
    hint: 'Massive cryogenic rocket thrust roaring during atmospheric liftoff',
    funFact: 'Saturn V rocket launches produced sound waves so powerful they registered on seismographs miles away.',
    options: ['Space Rocket Launch Booster', 'Jet Engine Afterburner', 'Volcanic Eruption', 'Submarine Torpedo'],
  },
  {
    id: 's10',
    name: 'Antique Grandfather Clock Ticking',
    soundKey: 'clock_tick',
    category: 'Objects & Antiques',
    icon: '🕰️',
    difficulty: 'Medium',
    points: 180,
    hint: 'Mechanical escapement pendulum swinging back and forth in rhythmic cadence',
    funFact: 'Galileo Galilei discovered the isochronism of pendulums while watching a swinging lamp in Pisa Cathedral.',
    options: ['Antique Grandfather Clock Ticking', 'Metronome Cadence', 'Typewriter Key Clacks', 'Dripping Water Faucet'],
  },
  {
    id: 's11',
    name: 'Human Heartbeat Cadence',
    soundKey: 'heartbeat',
    category: 'Human Biology',
    icon: '💓',
    difficulty: 'Easy',
    points: 140,
    hint: 'Rhythmic systolic and diastolic valve contractions pumping life throughout veins',
    funFact: 'An average human heart beats roughly 100,000 times a day and pumps about 2,000 gallons of blood!',
    options: ['Human Heartbeat Cadence', 'Bass Drum Kick', 'Footsteps in Dark', 'Horse Gallop'],
  },
];

interface SoundMysteryProps {
  onBackToLobby?: () => void;
}

export const SoundMystery: React.FC<SoundMysteryProps> = ({ onBackToLobby }) => {
  const { user, updateStats } = useAuth();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [waveSeed, setWaveSeed] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const currentSound = SOUND_COLLECTION[currentIndex];

  // Play audio and trigger waveform animation
  const handlePlaySound = () => {
    if (!currentSound) return;
    setIsPlaying(true);
    setWaveSeed((s) => s + 1);
    soundManager.playMysterySound(currentSound.soundKey);

    setTimeout(() => {
      setIsPlaying(false);
    }, 2200);
  };

  // Canvas Neon Waveform Visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Dark Neon Grid lines
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.12)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Draw Center Baseline Glow
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // Dynamic Frequency Oscilloscope
      const bars = 48;
      const barWidth = width / bars;

      for (let i = 0; i < bars; i++) {
        const x = i * barWidth;
        const norm = i / bars;
        const ampMultiplier = isPlaying ? 1 : 0.15;
        const freq1 = Math.sin(norm * Math.PI * 6 + phase) * 35 * ampMultiplier;
        const freq2 = Math.cos(norm * Math.PI * 12 - phase * 1.5) * 20 * ampMultiplier;
        const barHeight = Math.abs(freq1 + freq2) + (isPlaying ? Math.random() * 25 : 4);

        // Gradient color for spectrum bars
        const grad = ctx.createLinearGradient(0, centerY - barHeight, 0, centerY + barHeight);
        if (isPlaying) {
          grad.addColorStop(0, '#38BDF8'); // Sky
          grad.addColorStop(0.5, '#A855F7'); // Purple
          grad.addColorStop(1, '#EC4899'); // Pink
        } else {
          grad.addColorStop(0, '#475569');
          grad.addColorStop(1, '#1E293B');
        }

        ctx.fillStyle = grad;
        ctx.fillRect(x + 2, centerY - barHeight, barWidth - 4, barHeight * 2);
      }

      // Foreground Sine Wave Line
      ctx.beginPath();
      ctx.lineWidth = isPlaying ? 3.5 : 1.5;
      ctx.strokeStyle = isPlaying ? '#FACC15' : 'rgba(245, 158, 11, 0.4)';

      for (let x = 0; x < width; x += 3) {
        const normX = x / width;
        const wave = isPlaying
          ? Math.sin(normX * 14 + phase * 2) * 28 + Math.sin(normX * 28 - phase * 3) * 12
          : Math.sin(normX * 8 + phase) * 6;
        const y = centerY + wave;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      phase += isPlaying ? 0.08 : 0.02;
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, waveSeed]);

  // Handle Guess Selection
  const handleSelectOption = (option: string) => {
    if (isAnswerRevealed || !currentSound) return;

    setSelectedAnswer(option);
    setIsAnswerRevealed(true);

    const isCorrect = option === currentSound.name;

    if (isCorrect) {
      soundManager.playCorrectGuess();
      const pointsEarned = currentSound.points + streak * 30;
      setScore((s) => s + pointsEarned);
      setStreak((st) => {
        const next = st + 1;
        if (next > bestStreak) setBestStreak(next);
        return next;
      });
      setSolvedCount((c) => c + 1);

      if (user) {
        updateStats({
          soundsIdentified: (user.stats?.soundsIdentified || 0) + 1,
          totalScore: (user.stats?.totalScore || 0) + pointsEarned,
        });
      }
    } else {
      soundManager.playWrongGuess();
      setStreak(0);
    }
  };

  // Next Question / Reset
  const handleNextSound = () => {
    if (currentIndex + 1 < SOUND_COLLECTION.length) {
      setCurrentIndex((idx) => idx + 1);
      setSelectedAnswer(null);
      setIsAnswerRevealed(false);
      setShowHint(false);
      // Auto-play next sound after small delay
      setTimeout(() => {
        handlePlaySound();
      }, 400);
    } else {
      setGameComplete(true);
      soundManager.playVictory();
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswerRevealed(false);
    setShowHint(false);
    setScore(0);
    setStreak(0);
    setSolvedCount(0);
    setGameComplete(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 animate-fade-in p-2 sm:p-4">
      {/* Top Banner & Stats Bar */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Audio Mystery
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-black uppercase tracking-wider">
                Sound Guesser
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Listen carefully to the acoustic soundscapes and identify the mystery source!
            </p>
          </div>
        </div>

        {/* Counters */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Score */}
          <div className="px-3.5 py-1.5 rounded-2xl bg-slate-800/90 border border-slate-700 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none">
              Score
            </span>
            <span className="text-base font-black text-amber-400">{score}</span>
          </div>

          {/* Streak */}
          <div className="px-3.5 py-1.5 rounded-2xl bg-slate-800/90 border border-slate-700 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none flex items-center justify-center gap-0.5">
              <Flame className="w-2.5 h-2.5 text-orange-400" />
              <span>Streak</span>
            </span>
            <span className="text-base font-black text-orange-400">{streak}x</span>
          </div>

          {/* Progress */}
          <div className="px-3.5 py-1.5 rounded-2xl bg-slate-800/90 border border-slate-700 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none">
              Progress
            </span>
            <span className="text-base font-black text-indigo-400">
              {currentIndex + 1}/{SOUND_COLLECTION.length}
            </span>
          </div>
        </div>
      </div>

      {!gameComplete ? (
        <div className="space-y-5">
          {/* Audio Player Station & Oscilloscope Visualizer */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
            {/* Ambient Background Lights */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Turntable / Vinyl & Waveform Center */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              {/* Animated Cassette / Vinyl Record */}
              <div className="relative flex items-center justify-center">
                <motion.div
                  animate={{ rotate: isPlaying ? 360 : 0 }}
                  transition={{
                    repeat: isPlaying ? Infinity : 0,
                    duration: 3,
                    ease: 'linear',
                  }}
                  className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-slate-950 via-slate-900 to-black border-4 border-slate-800 shadow-2xl flex items-center justify-center relative p-3 group"
                >
                  {/* Concentric Vinyl Grooves */}
                  <div className="w-full h-full rounded-full border-2 border-slate-800/60 border-dashed flex items-center justify-center">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-slate-700/50 flex items-center justify-center">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-inner shadow-black/50">
                        <Disc3 className={`w-7 h-7 ${isPlaying ? 'animate-spin' : ''}`} />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Tone Arm Needle Accent */}
                <div
                  className={`absolute -top-2 -right-2 w-12 h-16 pointer-events-none transition-transform duration-500 origin-top-right ${
                    isPlaying ? 'rotate-12' : '-rotate-12'
                  }`}
                >
                  <div className="w-1.5 h-14 bg-gradient-to-b from-amber-400 to-slate-400 rounded-full shadow-md ml-auto" />
                </div>
              </div>

              {/* Dynamic Oscilloscope Canvas */}
              <div className="flex-1 w-full flex flex-col items-center space-y-3">
                <div className="w-full bg-black/60 rounded-2xl border border-slate-800 p-2 shadow-inner relative overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1 text-[10px] text-cyan-400 font-mono tracking-widest uppercase">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
                        }`}
                      />
                      <span>{isPlaying ? 'AUDIO STREAMING ACTIVE' : 'STANDBY MODE'}</span>
                    </span>
                    <span>CHANNEL 01 • STEREO</span>
                  </div>

                  <canvas
                    ref={canvasRef}
                    width={560}
                    height={140}
                    className="w-full h-28 sm:h-36 rounded-xl"
                  />
                </div>

                {/* Big Action Play Sound Button */}
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePlaySound}
                    className={`px-8 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2.5 shadow-xl transition-all ${
                      isPlaying
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-pink-500/30 ring-4 ring-pink-500/20'
                        : 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 text-white shadow-indigo-600/30 hover:shadow-indigo-600/50'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Volume2 className="w-5 h-5 animate-bounce" />
                        <span>Playing Audio Track...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 fill-white" />
                        <span>Play Mystery Sound</span>
                      </>
                    )}
                  </motion.button>

                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
                    title="Toggle Clue Hint"
                  >
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline">Hint</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Hint Box if expanded */}
            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5"
                >
                  <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span>
                    <strong>Acoustic Clue:</strong> {currentSound.hint}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 4 Multi-Choice Option Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
              Select Your Guess:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {currentSound.options.map((option, idx) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentSound.name;

                let cardStyle =
                  'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 text-white';

                if (isAnswerRevealed) {
                  if (isCorrect) {
                    cardStyle =
                      'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/30';
                  } else if (isSelected && !isCorrect) {
                    cardStyle =
                      'bg-rose-950/80 border-rose-500 text-rose-200 shadow-lg shadow-rose-500/20';
                  } else {
                    cardStyle = 'bg-slate-900/40 border-slate-800/40 text-slate-500 opacity-60';
                  }
                }

                return (
                  <motion.button
                    key={option}
                    whileHover={!isAnswerRevealed ? { scale: 1.02 } : undefined}
                    whileTap={!isAnswerRevealed ? { scale: 0.98 } : undefined}
                    disabled={isAnswerRevealed}
                    onClick={() => handleSelectOption(option)}
                    className={`p-4 sm:p-5 rounded-2xl border text-left font-bold text-sm sm:text-base flex items-center justify-between gap-3 transition-all ${cardStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono font-black flex items-center justify-center text-slate-300">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{option}</span>
                    </div>

                    {isAnswerRevealed && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
                    )}
                    {isAnswerRevealed && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Reveal Feedback & Next Button */}
          <AnimatePresence>
            {isAnswerRevealed && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{currentSound.icon}</span>
                    <h4 className="text-base font-black text-white">
                      {selectedAnswer === currentSound.name
                        ? `Spot on! +${currentSound.points + streak * 30} PTS`
                        : `Answer: ${currentSound.name}`}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 max-w-lg">
                    💡 <strong>Fun Fact:</strong> {currentSound.funFact}
                  </p>
                </div>

                <button
                  onClick={handleNextSound}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
                >
                  <span>Next Sound</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* Game Completion Celebration Screen */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/95 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl max-w-xl mx-auto"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-white mx-auto shadow-xl shadow-amber-500/30">
            <Trophy className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white tracking-tight">
              Sound Maestro Certified!
            </h2>
            <p className="text-sm text-slate-400">
              You listened and cracked acoustic mystery audio waves across all categories!
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Total Score
              </span>
              <span className="text-xl font-black text-amber-400">{score}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Sounds Solved
              </span>
              <span className="text-xl font-black text-emerald-400">
                {solvedCount}/{SOUND_COLLECTION.length}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Best Streak
              </span>
              <span className="text-xl font-black text-orange-400">{bestStreak}x</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleRestart}
              className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>

            {onBackToLobby && (
              <button
                onClick={onBackToLobby}
                className="px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700"
              >
                Back to Arcade Hub
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};
