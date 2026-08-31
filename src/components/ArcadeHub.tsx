import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Users,
  Bot,
  Flame,
  Swords,
  Brain,
  Trophy,
  ArrowRight,
  Zap,
  Play,
  Eye,
  Bomb,
  Theater,
  Palette,
  Layers,
  Puzzle,
  SpellCheck,
  Gamepad2,
  CheckCircle2,
  Crown,
  Search,
  Radio,
  Keyboard,
  Music,
  Calculator,
  Grid,
  Crosshair,
  Building2,
} from 'lucide-react';
import { ArcadeGameMode } from '../types';
import { useAuth } from '../context/AuthContext';
import { soundManager } from '../utils/soundEffects';
import { AvatarRenderer } from './AvatarRenderer';
import { GWLogo } from './GWLogo';

interface ArcadeHubProps {
  selectedMode: ArcadeGameMode;
  onSelectMode: (mode: ArcadeGameMode) => void;
  onOpenLeaderboard: () => void;
}

type GameCategory = 'all' | 'multiplayer' | 'brain' | 'solo' | 'ngip_vip';

interface GameCardConfig {
  id: ArcadeGameMode;
  title: string;
  category: GameCategory;
  tag: string;
  badgeColor: string;
  icon: React.ElementType;
  gradient: string;
  glowColor: string;
  description: string;
  playersCount: string;
  difficulty: 'Easy' | 'Medium' | 'Challenging' | 'Party';
  popular?: boolean;
  highlight?: string;
  isNgipOnly?: boolean;
}

const ARCADE_GAMES: GameCardConfig[] = [
  {
    id: 'ngip_mega_wheel',
    title: 'งip Supreme High Roller Wheel',
    category: 'ngip_vip',
    tag: 'งip Exclusive 3X',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-400/40',
    icon: Crown,
    gradient: 'from-amber-500 via-rose-500 to-purple-600',
    glowColor: 'group-hover:border-amber-400',
    description: 'High-stakes VIP spinning wheel with customizable gem bets up to 100 Quadrillion and automatic 3x Multiplier Payout on all wins!',
    playersCount: 'VIP Lounge Exclusive',
    difficulty: 'Party',
    popular: true,
    highlight: 'Guaranteed 3X Base Multiplier',
    isNgipOnly: true,
  },
  {
    id: 'ngip_vault_hacker',
    title: 'งip Cyber Decryption Matrix',
    category: 'ngip_vip',
    tag: 'งip Exclusive 3X',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-400/40',
    icon: Zap,
    gradient: 'from-cyan-500 via-purple-600 to-amber-500',
    glowColor: 'group-hover:border-cyan-400',
    description: '4-Tier cybersecurity infiltration matrix. Crack encrypted hexadecimal security nodes to unlock massive multi-trillion gem rewards!',
    playersCount: 'VIP Code Decryption',
    difficulty: 'Challenging',
    popular: true,
    highlight: '4 Security Firewalls & 3X Multiplier',
    isNgipOnly: true,
  },
  {
    id: 'multiplayer_draw',
    title: 'Multiplayer Draw & Guess',
    category: 'multiplayer',
    tag: 'Live Multiplayer',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    icon: Palette,
    gradient: 'from-indigo-600 to-purple-600',
    glowColor: 'group-hover:border-indigo-500/50',
    description: 'The real-time multiplayer drawing party! Create or join rooms, draw words on canvas, and race to guess in live chat.',
    playersCount: '2 - 10 Players',
    difficulty: 'Party',
    popular: true,
    highlight: 'Real-time Canvas & Live Chat',
  },
  {
    id: 'uno_party',
    title: 'UNO Party Showdown',
    category: 'multiplayer',
    tag: 'Official Card Rules',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    icon: Layers,
    gradient: 'from-rose-600 via-amber-500 to-blue-600',
    glowColor: 'group-hover:border-rose-500/50',
    description: 'Match colors, drop Wild +4s, Skips & Reverse, and draw 1 card when you have no match. Shout UNO before opponents catch you!',
    playersCount: '2 - 10 Players',
    difficulty: 'Easy',
    popular: true,
    highlight: 'Authentic Draw-1 Rule & Wilds',
  },
  {
    id: 'color_clash',
    title: 'Color Clash Matrix',
    category: 'brain',
    tag: 'Stroop Reflex Duel',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    icon: Zap,
    gradient: 'from-amber-500 via-rose-500 to-indigo-600',
    glowColor: 'group-hover:border-amber-500/50',
    description: 'Fast-match the ink color vs written word under psychological pressure! Build 4x combo multipliers.',
    playersCount: 'Reflex Duel',
    difficulty: 'Medium',
    popular: true,
    highlight: 'Stroop Reaction Test',
  },
  {
    id: 'cyber_typing',
    title: 'Cyber Velocity Typing',
    category: 'solo',
    tag: 'WPM Keystroke Rush',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    icon: Keyboard,
    gradient: 'from-cyan-600 via-indigo-600 to-pink-600',
    glowColor: 'group-hover:border-cyan-500/50',
    description: 'Type high-speed streams of glowing cybernetic words to boost your WPM speed rating and win prizes.',
    playersCount: 'Typing Sprint',
    difficulty: 'Medium',
    popular: true,
    highlight: 'Instant WPM Speed Blitz',
  },
  {
    id: 'simon_sequence',
    title: 'Simon Sound Matrix',
    category: 'brain',
    tag: 'Audio-Visual Memory',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    icon: Music,
    gradient: 'from-emerald-600 via-teal-600 to-indigo-600',
    glowColor: 'group-hover:border-emerald-500/50',
    description: 'Listen to procedural acoustic frequencies and memorize the glowing color sequence step by step.',
    playersCount: 'Memory Matrix',
    difficulty: 'Medium',
    popular: true,
    highlight: 'Synthesized Tones & Colors',
  },
  {
    id: 'math_sprint',
    title: 'Math Sprint Lightning',
    category: 'brain',
    tag: 'Arithmetic Blitz',
    badgeColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    icon: Calculator,
    gradient: 'from-amber-500 via-orange-500 to-rose-600',
    glowColor: 'group-hover:border-orange-500/50',
    description: 'Rapid-fire mental arithmetic challenges against the 30-second clock! Build streak combos.',
    playersCount: 'Brain Sprint',
    difficulty: 'Medium',
    popular: true,
    highlight: 'Speed Arithmetic Rush',
  },
  {
    id: 'emoji_match',
    title: 'Emoji Tile Memory Match',
    category: 'brain',
    tag: 'Tile Pair Flip',
    badgeColor: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
    icon: Grid,
    gradient: 'from-pink-600 via-purple-600 to-indigo-600',
    glowColor: 'group-hover:border-pink-500/50',
    description: 'Flip smooth animated tiles to find matching emoji pairs with minimal moves and high accuracy.',
    playersCount: 'Solo Puzzle',
    difficulty: 'Easy',
    highlight: 'Card Flip Animations',
  },
  {
    id: 'whack_doodle',
    title: 'Whack-A-Doodle Reflex',
    category: 'solo',
    tag: 'Pop-Up Tap Arena',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    icon: Crosshair,
    gradient: 'from-rose-600 via-purple-600 to-indigo-600',
    glowColor: 'group-hover:border-rose-500/50',
    description: 'Tap playful emojis and doodles popping in and out of 9 arcade holes before they duck away!',
    playersCount: 'Rapid Tap Arena',
    difficulty: 'Easy',
    popular: true,
    highlight: '9-Hole Pop Reflexes',
  },
  {
    id: 'tower_stack',
    title: 'Cyber Tower Stacker',
    category: 'solo',
    tag: 'Block Slice Physics',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    icon: Building2,
    gradient: 'from-indigo-600 via-purple-600 to-pink-500',
    glowColor: 'group-hover:border-indigo-500/50',
    description: 'Drop moving neon slabs with precision timing. Overhanging edges slice off as you reach the sky!',
    playersCount: 'Skyscraper Timing',
    difficulty: 'Challenging',
    popular: true,
    highlight: 'Precision Block Physics',
  },
  {
    id: 'sound_mystery',
    title: 'Audio Mystery Guess',
    category: 'brain',
    tag: 'New Audio Wave',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    icon: Radio,
    gradient: 'from-cyan-600 via-indigo-600 to-purple-600',
    glowColor: 'group-hover:border-cyan-500/50',
    description: 'Listen to animated acoustic waveforms, vinyl records & synthesized soundscapes. Identify the mystery sound with live clues!',
    playersCount: 'Acoustic Guesser',
    difficulty: 'Easy',
    popular: true,
    highlight: 'Oscilloscope Visualizer & Vinyl FX',
  },
  {
    id: 'reflex_neon',
    title: 'Neon Reflex Rhythm Strike',
    category: 'solo',
    tag: 'New Rhythm',
    badgeColor: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
    icon: Zap,
    gradient: 'from-pink-600 via-purple-600 to-amber-500',
    glowColor: 'group-hover:border-pink-500/50',
    description: 'Strike falling cyber notes on 4 neon lanes with key or touch inputs. Build combo multipliers up to 8x with perfect timing!',
    playersCount: 'Rhythm Velocity Sprint',
    difficulty: 'Party',
    popular: true,
    highlight: '4-Lane Highway & Particle Spark FX',
  },
  {
    id: 'bomb_chain',
    title: 'Word Bomb Chain',
    category: 'multiplayer',
    tag: 'Tick-Tick-Boom',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    icon: Bomb,
    gradient: 'from-amber-600 to-rose-600',
    glowColor: 'group-hover:border-amber-500/50',
    description: 'Type words containing matching syllable prompts before the bomb fuse runs out! Fast-paced survival with combo bonuses.',
    playersCount: 'Solo or Duel',
    difficulty: 'Medium',
    popular: true,
    highlight: 'Rapid Word Reflexes',
  },
  {
    id: 'trivia_dash',
    title: 'Trivia Dash Royale',
    category: 'brain',
    tag: 'Knowledge Sprint',
    badgeColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
    icon: Brain,
    gradient: 'from-violet-600 to-indigo-600',
    glowColor: 'group-hover:border-violet-500/50',
    description: '15-second rapid trivia blitz spanning Gaming, Science, Tech, and Pop Culture with 50:50 lifelines and streak combos!',
    playersCount: 'High-Score Sprint',
    difficulty: 'Medium',
    popular: true,
    highlight: '400+ Verified Trivia Questions',
  },
  {
    id: 'anagram_rush',
    title: 'Word Anagram Scramble',
    category: 'brain',
    tag: 'Letter Tile Rush',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    icon: SpellCheck,
    gradient: 'from-emerald-600 to-teal-600',
    glowColor: 'group-hover:border-emerald-500/50',
    description: 'Unscramble jumbled letter tiles against the timer! Tap and swap slots to decode mystery words with instant dictionary check.',
    playersCount: 'Solo Sprint',
    difficulty: 'Medium',
    highlight: 'Letter Tile Rearranging',
  },
  {
    id: 'emoji_charades',
    title: 'Emoji Charades Party',
    category: 'brain',
    tag: 'Visual Icon Puzzle',
    badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
    icon: Puzzle,
    gradient: 'from-teal-600 to-emerald-600',
    glowColor: 'group-hover:border-teal-500/50',
    description: 'Decode hit movies, famous idioms, dishes & video games represented exclusively through visual emojis and hints.',
    playersCount: 'Solo or Party Relay',
    difficulty: 'Easy',
    highlight: 'Pop Culture & Movie Riddles',
  },
  {
    id: 'ai_sketch_guess',
    title: 'AI Sketch Guesser',
    category: 'solo',
    tag: 'Neural AI Duel',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    icon: Bot,
    gradient: 'from-purple-600 to-pink-600',
    glowColor: 'group-hover:border-purple-500/50',
    description: 'Can you draw fast enough? The neural AI inspects every stroke on your canvas in real-time and guesses before the timer expires.',
    playersCount: 'Solo vs Neural AI',
    difficulty: 'Party',
    popular: true,
    highlight: 'Live Stroke AI Recognition',
  },
  {
    id: 'pixel_reveal',
    title: 'Pixel Reveal Mystery',
    category: 'solo',
    tag: 'Unblur & Guess',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    icon: Eye,
    gradient: 'from-cyan-600 to-blue-600',
    glowColor: 'group-hover:border-cyan-500/50',
    description: 'A heavily pixelated drawing progressively unblurs over time. Buzz in early with letter clues for high-score multipliers!',
    playersCount: '5 Mystery Rounds',
    difficulty: 'Challenging',
    highlight: 'Progressive Resolution Unblur',
  },
  {
    id: 'blindfold_maestro',
    title: 'Blindfold Maestro',
    category: 'solo',
    tag: 'Blind Canvas',
    badgeColor: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
    icon: Theater,
    gradient: 'from-pink-600 to-rose-600',
    glowColor: 'group-hover:border-pink-500/50',
    description: 'Draw funny prompts without seeing your brush strokes! The grand curtain opens at the end to reveal your chaotic masterpiece.',
    playersCount: 'Party Stage & AI Judge',
    difficulty: 'Party',
    highlight: 'Hidden Strokes & Grand Reveal',
  },
  {
    id: 'speed_duel',
    title: '1v1 Canvas Speed Duel',
    category: 'solo',
    tag: 'Side-by-Side Arena',
    badgeColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    icon: Swords,
    gradient: 'from-orange-600 to-red-600',
    glowColor: 'group-hover:border-orange-500/50',
    description: 'Duel against a speed bot on side-by-side canvases! Draw the secret topic and let the AI judge decide the victor.',
    playersCount: '1v1 Battle Arena',
    difficulty: 'Challenging',
    highlight: 'Side-by-Side Duel & Scoring',
  },
  {
    id: 'memory_rush',
    title: 'Memory Doodle Rush',
    category: 'solo',
    tag: 'Visual Recall',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    icon: Brain,
    gradient: 'from-blue-600 to-indigo-600',
    glowColor: 'group-hover:border-blue-500/50',
    description: 'Inspect a complex scene for 5 seconds before it disappears. Redraw all key objects from visual memory to earn 3 stars!',
    playersCount: 'Brain Trainer',
    difficulty: 'Challenging',
    highlight: '5-Second Scene Memory Test',
  },
];

export const ArcadeHub: React.FC<ArcadeHubProps> = ({
  selectedMode,
  onSelectMode,
  onOpenLeaderboard,
}) => {
  const { user, isNgip } = useAuth();
  const [activeCategory, setActiveCategory] = useState<GameCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Strictly filter out VIP games for non-งip users
  const visibleGames = ARCADE_GAMES.filter((game) => !game.isNgipOnly || isNgip);

  const filteredGames = visibleGames.filter((game) => {
    const matchesCategory = activeCategory === 'all' || game.category === activeCategory;
    const matchesSearch =
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.tag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories: Array<{ id: GameCategory; label: string; count: number }> = [
    { id: 'all', label: 'All Games', count: visibleGames.length },
    ...(isNgip
      ? [
          {
            id: 'ngip_vip' as GameCategory,
            label: '👑 งip VIP Lounge',
            count: visibleGames.filter((g) => g.category === 'ngip_vip').length,
          },
        ]
      : []),
    { id: 'multiplayer', label: 'Multiplayer & Party', count: visibleGames.filter((g) => g.category === 'multiplayer').length },
    { id: 'brain', label: 'Brain & Words', count: visibleGames.filter((g) => g.category === 'brain').length },
    { id: 'solo', label: 'Solo & AI Arena', count: visibleGames.filter((g) => g.category === 'solo').length },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in font-sans">
      {/* Exclusive งip VIP Lounge Banner for งip Members */}
      {isNgip && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-amber-950 border-2 border-amber-400 p-5 sm:p-6 text-white shadow-2xl shadow-amber-500/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 font-black px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-amber-500 to-purple-600 text-white text-xs shadow-md border border-amber-300">
                  <Crown className="w-3.5 h-3.5 text-amber-200 fill-amber-300" />
                  งip VIP SECRET LOUNGE
                </span>
                <span className="text-xs font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-500/40">
                  ⚡ 3X BET MULTIPLIER ACTIVE
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-purple-300">
                Welcome to your High Roller VIP Games
              </h2>
              <p className="text-xs text-slate-300 max-w-xl">
                As a verified งip holder, you have unlocked the Supreme Mega Wheel, Cyber Decryption Matrix, fast animated chroma name, and automatic 3X payouts!
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onSelectMode('ngip_mega_wheel')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-black text-xs shadow-lg shadow-amber-500/30 flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Crown className="w-4 h-4 text-amber-200" />
                Mega Wheel (3X)
              </button>
              <button
                onClick={() => onSelectMode('ngip_vault_hacker')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-black text-xs shadow-lg shadow-cyan-500/30 flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Zap className="w-4 h-4 text-cyan-200" />
                Cyber Vault
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>Guess What? Arcade ✦ Y2K Edition</span>
            </div>

            <div className="pt-0.5">
              <GWLogo size="lg" showText={true} />
            </div>

            <p className="text-xs sm:text-sm text-slate-300">
              Host multiplayer drawing rooms, battle in UNO Party showdowns, survive rapid word bombs, or test neural AI stroke guessing!
            </p>
          </div>

          {/* Quick Player Profile & Hall of Fame CTA */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {user && (
              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 backdrop-blur-md flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden border-2"
                  style={{ backgroundColor: `${user.color}25`, borderColor: user.color }}
                >
                  <AvatarRenderer avatar={user.avatar} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-white">{user.username}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300">
                      Lvl {user.level}
                    </span>
                  </div>
                  <p className="text-xs text-amber-400 font-bold flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    <span>{user.stats.totalScore.toLocaleString()} Pts</span>
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={onOpenLeaderboard}
              className="px-4 py-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Hall of Fame</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                soundManager.playTick();
                setActiveCategory(cat.id);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeCategory === cat.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Game Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence>
          {filteredGames.map((game, index) => {
            const isSelected = selectedMode === game.id;
            const IconComp = game.icon;

            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                onClick={() => {
                  soundManager.playTick();
                  onSelectMode(game.id);
                }}
                className={`group relative overflow-hidden rounded-3xl p-5 border transition-all cursor-pointer flex flex-col justify-between space-y-4 bg-white dark:bg-slate-900 ${
                  isSelected
                    ? 'border-indigo-600 dark:border-indigo-500 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/30'
                    : `border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm ${game.glowColor}`
                }`}
              >
                {/* Top: Icon & Tags */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${game.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}
                    >
                      <IconComp className="w-6 h-6" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {game.popular && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                          <Flame className="w-2.5 h-2.5 text-amber-500" />
                          <span>Hot</span>
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${game.badgeColor}`}>
                        {game.tag}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {game.title}
                      </h3>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {game.description}
                    </p>
                  </div>

                  {/* Highlight feature pill */}
                  {game.highlight && (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-slate-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">{game.highlight}</span>
                    </div>
                  )}
                </div>

                {/* Bottom: Player Capacity & Launch CTA */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>{game.playersCount}</span>
                  </div>

                  <button
                    type="button"
                    className={`px-4 py-2 rounded-xl text-xs font-black text-white flex items-center gap-1.5 shadow-md transition-all ${
                      isSelected
                        ? 'bg-indigo-600 shadow-indigo-600/30 scale-105'
                        : 'bg-slate-900 dark:bg-slate-800 group-hover:bg-indigo-600 group-hover:shadow-indigo-600/20'
                    }`}
                  >
                    <span>{isSelected ? 'Resume Game' : 'Play Now'}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredGames.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Gamepad2 className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No games matched your filter</h3>
          <button
            onClick={() => {
              setActiveCategory('all');
              setSearchQuery('');
            }}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
