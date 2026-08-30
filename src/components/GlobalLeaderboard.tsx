import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Flame, Search, X, Sparkles, TrendingUp, Award, User, RefreshCw, Activity, Coins, Zap } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { LeaderboardTimeframe, LeaderboardEntry } from '../types';
import { AvatarRenderer } from './AvatarRenderer';
import { fetchFirestoreLeaderboard } from '../services/firebase';
import { NgipBadge, NgipName } from './NgipBadge';

export const GlobalLeaderboard: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { globalLeaderboard } = useGame();
  const { user, activities } = useAuth();
  const [activeTab, setActiveTab] = useState<LeaderboardTimeframe | 'activities'>('all-time');
  const [searchQuery, setSearchQuery] = useState('');
  const [cloudEntries, setCloudEntries] = useState<LeaderboardEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLeaderboard = () => {
    setIsRefreshing(true);
    fetchFirestoreLeaderboard()
      .then((entries) => {
        if (entries && entries.length > 0) {
          setCloudEntries(entries);
        }
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    if (isOpen) {
      loadLeaderboard();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Merge context leaderboard with direct Firestore snapshot to ensure 100% up-to-date entries
  const entriesMap = new Map<string, LeaderboardEntry>();
  globalLeaderboard.forEach((e) => entriesMap.set(e.userId || e.username, e));
  cloudEntries.forEach((e) => {
    const key = e.userId || e.username;
    const existing = entriesMap.get(key);
    entriesMap.set(key, {
      ...existing,
      ...e,
      avatar: e.avatar || existing?.avatar || e.avatar,
    });
  });

  let allEntries = Array.from(entriesMap.values());

  if (user) {
    const existingIndex = allEntries.findIndex(
      (e) => e.userId === user.id || e.username.toLowerCase() === user.username.toLowerCase()
    );

    const safeGamesPlayed = Math.max(
      user.stats.gamesPlayed || 0,
      (user.stats.wins || 0) + (user.stats.drawingsCompleted || 0) > 0 ? 1 : 0
    );

    const userEntry: LeaderboardEntry = {
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      score: user.stats.totalScore || 0,
      wins: user.stats.wins || 0,
      gamesPlayed: safeGamesPlayed,
      wordsGuessed: user.stats.wordsGuessed || 0,
      rank: 1,
      winRate:
        safeGamesPlayed > 0
          ? Math.round(((user.stats.wins || 0) / safeGamesPlayed) * 100)
          : user.stats.wins
          ? 100
          : 0,
      lastActive: 'Active now',
      level: user.level || 1,
    };
    if (existingIndex >= 0) {
      allEntries[existingIndex] = { ...allEntries[existingIndex], ...userEntry };
    } else {
      allEntries.push(userEntry);
    }
  }

  // Filter and sort based on tab
  let filtered = [...allEntries];

  if (activeTab === 'wins') {
    filtered.sort((a, b) => b.wins - a.wins || b.score - a.score);
  } else if (activeTab === 'weekly') {
    filtered.sort((a, b) => (b.gamesPlayed || 0) - (a.gamesPlayed || 0) || b.score - a.score);
  } else {
    filtered.sort((a, b) => b.score - a.score || b.wins - a.wins);
  }

  // Recalculate display ranks
  filtered = filtered.map((entry, idx) => ({ ...entry, rank: idx + 1 }));

  // Search filter
  if (searchQuery.trim()) {
    filtered = filtered.filter((entry) =>
      entry.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Find user rank
  const myEntry = filtered.find(
    (e) => e.userId === user?.id || e.username.toLowerCase() === user?.username.toLowerCase()
  );

  const myGamesPlayed = user ? Math.max(user.stats.gamesPlayed || 0, (user.stats.wins || 0) > 0 ? 1 : 0) : 0;
  const myLosses = user ? Math.max(0, myGamesPlayed - (user.stats.wins || 0)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-500 shadow-inner shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Global Hall of Fame</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Official game points, wins, and losses across all players
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={loadLeaderboard}
              disabled={isRefreshing}
              title="Refresh Leaderboard"
              className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* My Position Highlight Banner */}
        {user && (
          <div className="p-3 sm:p-3.5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 flex items-center justify-center shrink-0 shadow-xs">
                <AvatarRenderer avatar={user.avatar} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                    {user.username}
                  </p>
                  <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold px-1.5 py-0.2 rounded-full">
                    You
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Level {user.level || 1} • {user.stats.wins || 0} Wins • {myLosses} Losses ({myGamesPlayed} Matches)
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-[10px] sm:text-xs text-slate-500 font-medium">
                Rank <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm">{myEntry ? `#${myEntry.rank}` : '#1'}</span>
              </div>
              <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">
                {user.stats.totalScore.toLocaleString()} pts
              </p>
            </div>
          </div>
        )}

        {/* Tab & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab('all-time')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'all-time'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              All-Time
            </button>
            <button
              onClick={() => setActiveTab('wins')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'wins'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Wins
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'weekly'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Matches
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'activities'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Activity className="w-3 h-3 text-rose-500" />
              <span>Live Feed</span>
              {activities.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              )}
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search player..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Leaderboard Table List OR Live Activities Feed */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {activeTab === 'activities' ? (
            activities.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No recent activity recorded yet. Play matches, level up, and win bets to generate live activity events!
              </div>
            ) : (
              activities.map((act) => {
                const isWin = act.type === 'match_win' || act.type === 'wager_won';
                const isLvl = act.type === 'level_up';
                const isBadge = act.type === 'badge_unlocked';

                return (
                  <div
                    key={act.id}
                    className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-3 transition-all hover:bg-slate-100/70 dark:hover:bg-slate-800/70"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs">
                        <AvatarRenderer avatar={act.avatar} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                            {act.username}
                          </span>
                          <span
                            className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                              isWin
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : isLvl
                                ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                                : isBadge
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {act.type.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate mt-0.5">
                          {act.title}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {act.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {act.pointsEarned ? (
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">
                          +{act.pointsEarned} PTS
                        </span>
                      ) : null}
                      <span className="text-[9px] text-slate-400 font-mono block">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No players found matching your query.
            </div>
          ) : (
            <>
              {filtered.map((entry) => {
                const isTop1 = entry.rank === 1;
                const isTop2 = entry.rank === 2;
                const isTop3 = entry.rank === 3;
                const isMe = entry.userId === user?.id;

                const games = Math.max(entry.gamesPlayed || 0, (entry.wins || 0) > 0 ? 1 : 0);
                const losses = Math.max(0, games - (entry.wins || 0));
                const winPercentage = games > 0 ? Math.round(((entry.wins || 0) / games) * 100) : (entry.wins ? 100 : 0);

                return (
                  <div
                    key={entry.userId}
                    className={`p-2.5 sm:p-3 rounded-2xl border flex items-center justify-between gap-2.5 transition-all ${
                      isMe
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700'
                        : isTop1
                        ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100/60 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    {/* Left: Rank & Avatar & Details */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Rank icon */}
                      <div className="w-6 flex items-center justify-center shrink-0 text-xs font-black">
                        {isTop1 ? (
                          <Crown className="w-5 h-5 text-amber-500 fill-amber-400" />
                        ) : isTop2 ? (
                          <Medal className="w-4 h-4 text-slate-400" />
                        ) : isTop3 ? (
                          <Medal className="w-4 h-4 text-amber-700" />
                        ) : (
                          <span className="text-slate-400 font-bold text-xs">#{entry.rank}</span>
                        )}
                      </div>

                      {/* Avatar */}
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs">
                        <AvatarRenderer avatar={entry.avatar} className="w-full h-full object-cover" />
                      </div>

                      {/* User & Stats */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <NgipName
                            name={entry.username}
                            isNgip={Boolean(entry.isNgip || (isMe && user?.isNgip))}
                            className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-[120px] sm:max-w-[200px]"
                          />
                          {Boolean(entry.isNgip || (isMe && user?.isNgip)) && <NgipBadge size="xs" />}
                          {isMe && (
                            <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900 px-1 py-0.2 rounded-full shrink-0">
                              You
                            </span>
                          )}
                        </div>

                        {/* Clean Single-Row Aligned Stats */}
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                          <span className="font-semibold text-slate-600 dark:text-slate-300">
                            Lvl {entry.level || 1}
                          </span>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {entry.wins || 0}W
                          </span>
                          <span className="text-rose-500 dark:text-rose-400 font-bold">
                            {losses}L
                          </span>
                          <span className="text-slate-400">
                            ({winPercentage}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Metric */}
                    <div className="text-right shrink-0 pl-1">
                      <span className="text-xs sm:text-sm font-black text-indigo-600 dark:text-indigo-400 block">
                        {activeTab === 'wins'
                          ? `${entry.wins} Wins`
                          : activeTab === 'weekly'
                          ? `${games} Matches`
                          : `${entry.score.toLocaleString()} pts`}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block">
                        {entry.lastActive || 'Active'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {filtered.length === 1 && (
                <div className="p-3 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
                  ⚡ Connected to Cloud Firestore. When other players join your rooms and play, their real-time rankings and scores will appear here.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
