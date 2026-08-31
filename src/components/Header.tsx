import React, { useState, useEffect } from 'react';
import {
  Trophy,
  User,
  LogOut,
  UserCheck,
  Music,
  Volume2,
  VolumeX,
  ShieldAlert,
  Gift,
  Flame,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { ArcadeGameMode } from '../types';
import { AvatarRenderer } from './AvatarRenderer';
import { GWLogo } from './GWLogo';
import { NgipBadge, NgipName } from './NgipBadge';
import { DarkModeToggle } from './DarkModeToggle';
import { themeMusic, ThemeMusicState } from '../utils/themeMusic';
import { WinstreakBanner } from './WinstreakBanner';

interface HeaderProps {
  currentMode?: ArcadeGameMode;
  onSelectMode?: (mode: ArcadeGameMode) => void;
  onOpenLeaderboard: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onOpenAuthGate?: () => void;
  onOpenAdmin?: () => void;
  onOpenDailyMissions?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode = 'multiplayer_draw',
  onSelectMode,
  onOpenLeaderboard,
  onOpenProfile,
  onOpenAuth,
  onOpenAuthGate,
  onOpenAdmin,
  onOpenDailyMissions,
}) => {
  const { user, isAdmin } = useAuth();
  const { gameState, leaveRoom } = useGame();
  const [musicState, setMusicState] = useState<ThemeMusicState>(themeMusic.getState());

  useEffect(() => {
    const unsub = themeMusic.subscribe((st) => setMusicState(st));
    return () => unsub();
  }, []);

  const isArcadeGame = currentMode !== 'multiplayer_draw';
  const isInMultiplayerRoom = Boolean(gameState);

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b-2 border-slate-300 dark:border-purple-900/60 shadow-md shadow-purple-950/5 transition-colors">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 h-13 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Left: Brand Logo & Back Button */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          {/* Universal Back Button when in game or room */}
          {(isArcadeGame || isInMultiplayerRoom) && (
            <button
              type="button"
              onClick={() => {
                if (isInMultiplayerRoom) {
                  leaveRoom();
                } else if (onSelectMode) {
                  onSelectMode('multiplayer_draw');
                }
              }}
              className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-black flex items-center gap-1 border-2 border-slate-300 dark:border-purple-800 shadow-xs cursor-pointer transition-all active:scale-95 shrink-0"
              title="Back to Lobby"
            >
              <span className="text-sm font-bold">←</span>
              <span className="hidden sm:inline">Back to Lobby</span>
            </button>
          )}

          <div
            onClick={() => onSelectMode && onSelectMode('multiplayer_draw')}
            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none group shrink-0"
          >
            <GWLogo size="sm" />
            <div className="hidden min-[360px]:block">
              <div className="flex items-center gap-1">
                <h1 className="text-xs sm:text-base font-black tracking-tight bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-500 bg-clip-text text-transparent leading-none">
                  GuessWhat
                </h1>
                <span className="text-[9px] sm:text-[10px] text-pink-500 font-black animate-pulse">✦</span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-purple-300 font-extrabold tracking-wide hidden sm:block">
                By Dąmon
              </p>
            </div>
          </div>

          {/* Active Room Badge (when in multiplayer room) */}
          {gameState && (
            <div className="hidden md:inline-flex items-center gap-1.5 ml-2 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded-xl animate-fade-in truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <span className="truncate">
                Room #{gameState.roomCode} ({gameState.players.length} Players)
              </span>
            </div>
          )}
        </div>

        {/* Right: Dark Mode Toggle, Theme Music Toggle, Leaderboard, Profile Avatar & Auth Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Dark Mode ON / OFF Button Switch */}
          <DarkModeToggle />

          {/* Theme Song Speaker / Music Button */}
          <button
            type="button"
            onClick={() => themeMusic.toggle()}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border-2 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0 ${
              musicState.isPlaying
                ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white border-purple-400 shadow-purple-500/25 ring-2 ring-purple-500/30'
                : 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border-slate-300 dark:border-purple-900 text-slate-600 dark:text-purple-300'
            }`}
            title={
              musicState.isPlaying
                ? 'Theme Song: Battle Hymn (Rockhestra) Playing — Tap to Pause'
                : 'Theme Song: Battle Hymn (Rockhestra) — Tap to Play'
            }
          >
            {musicState.isPlaying ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-pink-200 animate-pulse" />
                <span className="hidden md:inline text-[11px] font-bold">Theme ON</span>
                {/* 3 mini dancing equalizer bars */}
                <div className="hidden min-[480px]:flex items-end gap-0.5 h-3">
                  <span className="w-0.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s] h-full" />
                  <span className="w-0.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s] h-2" />
                  <span className="w-0.5 bg-white rounded-full animate-bounce [animation-delay:0s] h-2.5" />
                </div>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 opacity-70" />
                <span className="hidden md:inline text-[11px] font-bold opacity-80">Theme OFF</span>
              </>
            )}
          </button>

          {/* Quick Leave Room Button */}
          {gameState && (
            <button
              type="button"
              onClick={leaveRoom}
              className="px-2 sm:px-3 py-1.5 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
              title="Leave Room"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          )}

          {/* Daily Missions & Quests Button */}
          {onOpenDailyMissions && (
            <button
              type="button"
              onClick={onOpenDailyMissions}
              className="p-1.5 sm:px-3 sm:py-1.5 text-xs font-black text-pink-700 dark:text-pink-300 bg-pink-100/80 dark:bg-pink-950/50 hover:bg-pink-200/90 dark:hover:bg-pink-900/70 border-2 border-pink-300 dark:border-pink-700/80 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5 group"
              title="Daily Missions & Claim Rewards"
            >
              <Gift className="w-3.5 h-3.5 text-pink-500 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Missions</span>
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping shrink-0 hidden md:inline-block" />
            </button>
          )}

          {/* Leaderboard Button */}
          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="p-1.5 sm:px-3 sm:py-1.5 text-xs font-black text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/50 hover:bg-amber-200/90 dark:hover:bg-amber-900/70 border-2 border-amber-300 dark:border-amber-700/80 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1"
            title="Hall of Fame & Leaderboards"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Hall of Fame</span>
          </button>

          {/* Admin Panel Master Command Button */}
          {isAdmin && onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="p-1.5 sm:px-3 sm:py-1.5 text-xs font-black text-white bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:brightness-110 border-2 border-amber-400/80 rounded-xl transition-all shadow-md shrink-0 cursor-pointer animate-pulse flex items-center gap-1"
              title="Open Master Admin & Player Manager"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-200" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}

          {/* Profile Avatar / Auth */}
          {user ? (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={onOpenProfile}
                className="flex items-center gap-1 sm:gap-1.5 p-1 sm:pl-1.5 sm:pr-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border-2 border-slate-300 dark:border-purple-800/80 transition-all shrink-0 cursor-pointer shadow-xs"
                title={`${user.username} (Lvl ${user.level})`}
              >
                <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-xs select-none bg-slate-200 dark:bg-slate-800 relative shrink-0">
                  <AvatarRenderer avatar={user.avatar} className="w-full h-full object-cover" />
                </div>
                <div className="text-left hidden md:block">
                  <div className="flex items-center gap-1">
                    <NgipName
                      name={user.username}
                      isNgip={Boolean(user.isNgip || user.isAdmin)}
                      className="text-xs font-black text-slate-800 dark:text-slate-100 truncate max-w-[80px]"
                    />
                    {Boolean(user.isNgip || user.isAdmin) && <NgipBadge size="xs" />}
                  </div>
                  <p className="text-[10px] text-purple-600 dark:text-purple-400 font-extrabold leading-none">
                    Lvl {user.level}
                  </p>
                </div>
              </button>

              {onOpenAuthGate && (
                <button
                  type="button"
                  onClick={onOpenAuthGate}
                  title="Switch Player / Sign In"
                  className="p-1 sm:p-1.5 text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border-2 border-slate-200 dark:border-slate-800 text-xs font-bold shrink-0 cursor-pointer hidden min-[400px]:block"
                >
                  <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthGate || onOpenAuth}
              className="px-2.5 sm:px-3.5 py-1.5 text-xs font-black text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 rounded-xl transition-all shadow-md shrink-0 cursor-pointer flex items-center gap-1"
            >
              <User className="w-3.5 h-3.5 sm:hidden" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
