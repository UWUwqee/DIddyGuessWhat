import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  CheckCircle2,
  Gift,
  Flame,
  Sparkles,
  Zap,
  Clock,
  ChevronRight,
  X,
  Gamepad2,
  MessageSquare,
  Users,
  Coins,
} from 'lucide-react';
import { DailyMission } from '../types';
import { useAuth } from '../context/AuthContext';
import { soundManager } from '../utils/soundEffects';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'guesswhat_daily_missions_v2';

// Difficulty-based rewards: Easy (10k), Medium (30k), Hard (50k) PER CURRENCY - NOT MILLIONS!
const DEFAULT_MISSIONS: DailyMission[] = [
  {
    id: 'play_3_matches',
    title: 'Arcade Explorer',
    description: 'Play 3 matches in any multiplayer or arcade game mode.',
    icon: '🎮',
    category: 'play',
    target: 3,
    progress: 0,
    completed: false,
    claimed: false,
    difficulty: 'easy',
    reward: {
      diamonds: '10000', // 10K (Easy tier)
      amethysts: '10000',
      xp: 100,
    },
  },
  {
    id: 'win_1_match',
    title: 'Champion Spirit',
    description: 'Win 1 match or score 1st place on the round leaderboard.',
    icon: '🏆',
    category: 'win',
    target: 1,
    progress: 0,
    completed: false,
    claimed: false,
    difficulty: 'medium',
    reward: {
      diamonds: '30000', // 30K (Medium tier)
      amethysts: '30000',
      jades: '30000',
      xp: 200,
    },
  },
  {
    id: 'send_5_chats',
    title: 'Social Butterfly',
    description: 'Send 5 chat messages or react with emoji tapbacks to players.',
    icon: '💬',
    category: 'social',
    target: 5,
    progress: 0,
    completed: false,
    claimed: false,
    difficulty: 'easy',
    reward: {
      diamonds: '10000', // 10K (Easy tier)
      amethysts: '10000',
      xp: 100,
    },
  },
  {
    id: 'uno_or_trivia',
    title: 'Party Master',
    description: 'Play a round of UNO Party Showdown or Trivia Dash.',
    icon: '🃏',
    category: 'arcade',
    target: 1,
    progress: 0,
    completed: false,
    claimed: false,
    difficulty: 'medium',
    reward: {
      diamonds: '30000', // 30K (Medium tier)
      amethysts: '30000',
      jades: '30000',
      xp: 200,
    },
  },
  {
    id: 'guess_2_words',
    title: 'Master Guesser',
    description: 'Guess 2 words correctly in Drawing Arena or Guess Modes.',
    icon: '🎯',
    category: 'play',
    target: 2,
    progress: 0,
    completed: false,
    claimed: false,
    difficulty: 'hard',
    reward: {
      diamonds: '50000', // 50K (Hard tier)
      amethysts: '50000',
      jades: '50000',
      rubies: '50000',
      xp: 300,
    },
  },
];

interface DailyMissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyMissionsModal: React.FC<DailyMissionsModalProps> = ({ isOpen, onClose }) => {
  const { user, updateWallet } = useAuth();
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [timeLeftStr, setTimeLeftStr] = useState('');

  // Load / Initialize Daily Missions based on today's date
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.date === todayStr && Array.isArray(parsed.missions)) {
          // Sync with user's stats if applicable
          const gamesPlayed = user?.stats?.gamesPlayed || 0;
          const wins = user?.stats?.wins || 0;
          const wordsGuessed = user?.stats?.wordsGuessed || 0;

          const updated = parsed.missions.map((m: DailyMission) => {
            let prog = m.progress;
            if (m.id === 'play_3_matches') prog = Math.min(m.target, Math.max(prog, gamesPlayed % 10));
            if (m.id === 'win_1_match') prog = Math.min(m.target, Math.max(prog, wins > 0 ? 1 : 0));
            if (m.id === 'guess_2_words') prog = Math.min(m.target, Math.max(prog, wordsGuessed % 5));
            return {
              ...m,
              progress: prog,
              completed: prog >= m.target,
            };
          });
          setMissions(updated);
          return;
        }
      }
    } catch {
      // ignore
    }

    // Default Fresh Day Setup
    const fresh = DEFAULT_MISSIONS.map(m => ({ ...m }));
    setMissions(fresh);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayStr, missions: fresh }));
  }, [user]);

  // Daily Countdown Timer to midnight
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diffMs = midnight.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
      setTimeLeftStr(`${hours}h ${mins}m ${secs}s`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const saveMissions = (updated: DailyMission[]) => {
    setMissions(updated);
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayStr, missions: updated }));
  };

  const handleClaim = (mission: DailyMission) => {
    if (!mission.completed || mission.claimed) return;
    soundManager.playCorrect();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });

    if (mission.reward.diamonds) updateWallet('diamond', mission.reward.diamonds, 'add');
    if (mission.reward.amethysts) updateWallet('amethyst', mission.reward.amethysts, 'add');
    if (mission.reward.jades) updateWallet('jade', mission.reward.jades, 'add');
    if (mission.reward.rubies) updateWallet('ruby', mission.reward.rubies, 'add');

    const updated = missions.map(m => (m.id === mission.id ? { ...m, claimed: true } : m));
    saveMissions(updated);
  };

  const completedCount = missions.filter(m => m.completed).length;
  const claimedCount = missions.filter(m => m.claimed).length;
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'medium':
        return 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'hard':
        return 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Top Banner Header */}
          <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-start justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
                🎯
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black tracking-tight">Daily Missions</h2>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider">
                    Daily Reset
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/90 font-medium mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Resets in {timeLeftStr}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Overview Bar */}
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Completed:
              </span>
              <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                {completedCount} / {missions.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
              <Gift className="w-3.5 h-3.5 text-amber-500" />
              <span>Claimed: {claimedCount}</span>
            </div>
          </div>

          {/* Missions List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {missions.map((mission) => {
              const percent = Math.min(100, Math.round((mission.progress / mission.target) * 100));

              return (
                <div
                  key={mission.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    mission.claimed
                      ? 'bg-slate-50 dark:bg-slate-850/60 border-slate-200 dark:border-slate-800 opacity-70'
                      : mission.completed
                      ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-300 dark:border-amber-700 shadow-xs'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="text-2xl sm:text-3xl shrink-0 p-2 rounded-xl bg-slate-100 dark:bg-slate-700/50">
                        {mission.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                            {mission.title}
                          </h4>
                          {mission.difficulty && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wide ${getDifficultyColor(mission.difficulty)}`}>
                              {mission.difficulty}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {mission.description}
                        </p>

                        {/* Rewards Pill */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap text-[11px] font-black">
                          {mission.reward.diamonds && (
                            <span className="px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                              +{(parseInt(mission.reward.diamonds) / 1000).toFixed(0)}K 💎
                            </span>
                          )}
                          {mission.reward.amethysts && (
                            <span className="px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                              +{(parseInt(mission.reward.amethysts) / 1000).toFixed(0)}K 🔮
                            </span>
                          )}
                          {mission.reward.rubies && (
                            <span className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                              +{(parseInt(mission.reward.rubies) / 1000).toFixed(0)}K ♦️
                            </span>
                          )}
                          {mission.reward.jades && (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              +{(parseInt(mission.reward.jades) / 1000).toFixed(0)}K 🍵
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            +{mission.reward.xp} XP
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Claim / Status Action Button */}
                    <div className="shrink-0 pt-1">
                      {mission.claimed ? (
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Claimed</span>
                        </div>
                      ) : mission.completed ? (
                        <button
                          type="button"
                          onClick={() => handleClaim(mission)}
                          className="px-4 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
                        >
                          Claim Reward
                        </button>
                      ) : (
                        <div className="text-right">
                          <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                            {mission.progress} / {mission.target}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {!mission.claimed && (
                    <div className="mt-3 w-full bg-slate-100 dark:bg-slate-700/60 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          mission.completed
                            ? 'bg-gradient-to-r from-amber-500 to-emerald-500'
                            : 'bg-indigo-600 dark:bg-indigo-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 text-center shrink-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Complete daily missions to earn fortune gems & boost your Hall of Fame ranking!
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
