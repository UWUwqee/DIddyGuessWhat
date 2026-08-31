import React from 'react';
import {
  Trophy,
  Paintbrush,
  CheckCircle2,
  Crown,
  Flame,
  Play,
  Copy,
  Users,
  WifiOff,
  Sparkles,
  Clock,
  ArrowLeft,
  AlertCircle,
  X,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { AvatarRenderer } from './AvatarRenderer';
import { NgipName, NgipBadge } from './NgipBadge';
import { soundManager } from '../utils/soundEffects';

export const Scoreboard: React.FC = () => {
  const { gameState, isHost, startGame, leaveRoom, errorMessage, clearError } = useGame();
  const { user } = useAuth();
  const [copiedCode, setCopiedCode] = React.useState(false);

  if (!gameState) return null;

  // Sort players by score descending
  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
  const activeConnectedCount = gameState.players.filter(p => p.isConnected && !p.id.startsWith('bot_')).length;

  const handleCopyCode = () => {
    if (!gameState.roomId) return;
    const code = gameState.roomCode || (gameState.roomId.includes('_') ? gameState.roomId.split('_')[1] : gameState.roomId);
    navigator.clipboard?.writeText(code.toUpperCase());
    setCopiedCode(true);
    soundManager.playTick();
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleStartGameClick = () => {
    soundManager.playButton();
    startGame();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header with Room Code and Copy */}
      <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={leaveRoom}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
            title="Back to Lobby"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider truncate">
            Scoreboard
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyCode}
            title="Click to copy Room Code"
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-mono font-bold hover:bg-indigo-100 transition-all cursor-pointer"
          >
            <Copy className="w-2.5 h-2.5" />
            <span>{copiedCode ? 'COPIED!' : 'CODE'}</span>
          </button>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {gameState.players.length}P
          </span>
        </div>
      </div>

      {/* Players List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {sortedPlayers.map((player, index) => {
          const isMe = player.id === user?.id;
          const isCurrentDrawer = player.id === gameState.drawerId;
          const hasGuessed = player.hasGuessed;

          return (
            <div
              key={player.id}
              className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                isMe
                  ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80 shadow-xs'
                  : 'bg-slate-50/60 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800'
              } ${!player.isConnected ? 'opacity-50' : ''}`}
            >
              {/* Left: Rank & Avatar & Name */}
              <div className="flex items-center gap-2 min-w-0">
                {/* Rank Badge */}
                <div className="w-5 h-5 flex items-center justify-center font-bold text-xs">
                  {index === 0 && player.score > 0 ? (
                    <Crown className="w-4 h-4 text-amber-500 fill-amber-400" />
                  ) : index === 1 && player.score > 0 ? (
                    <span className="text-slate-400 font-bold">2</span>
                  ) : index === 2 && player.score > 0 ? (
                    <span className="text-amber-700 font-bold">3</span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">#{index + 1}</span>
                  )}
                </div>

                {/* Avatar */}
                <div
                  className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center text-sm relative select-none"
                  style={{ backgroundColor: `${player.color || '#6366F1'}20` }}
                >
                  <AvatarRenderer avatar={player.avatar} className="w-full h-full object-cover" />
                  {isCurrentDrawer && (
                    <span className="absolute -top-1 -right-1 bg-purple-600 text-white p-0.5 rounded-full shadow-xs">
                      <Paintbrush className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                {/* Username & Badges */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <NgipName
                      name={player.username}
                      isNgip={Boolean(player.isNgip || (isMe && user?.isNgip))}
                      className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[100px] sm:max-w-[130px]"
                    />
                    {Boolean(player.isNgip || (isMe && user?.isNgip)) && <NgipBadge size="xs" />}
                    {isMe && (
                      <span className="text-[9px] font-extrabold uppercase px-1 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                        You
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    {player.streak > 1 && (
                      <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                        <Flame className="w-2.5 h-2.5 fill-amber-400" />
                        {player.streak}x
                      </span>
                    )}
                    {player.isHost && (
                      <span className="text-slate-500 font-semibold">Host</span>
                    )}
                    {!player.isConnected && (
                      <span className="text-rose-500 flex items-center gap-0.5">
                        <WifiOff className="w-2.5 h-2.5" /> Offline
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: State / Score */}
              <div className="flex items-center gap-2">
                {/* Guess status badge during drawing */}
                {gameState.status === 'drawing' && !isCurrentDrawer && (
                  <div>
                    {hasGuessed ? (
                      <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3" />
                        Guessed
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400">
                        Thinking...
                      </span>
                    )}
                  </div>
                )}

                {/* Score */}
                <div className="text-right">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {player.score}
                  </span>
                  <span className="text-[10px] text-slate-400 block -mt-1">pts</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Message Toast in Room */}
      {errorMessage && (
        <div className="mx-2.5 my-1.5 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-bold flex items-center justify-between gap-1.5 animate-fade-in">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="truncate">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={clearError}
            className="p-0.5 hover:bg-rose-100 dark:hover:bg-rose-900 rounded cursor-pointer shrink-0"
            title="Dismiss error"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Lobby Controls Footer (Start Game button if in lobby) */}
      {gameState.status === 'lobby' && (
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 space-y-2">
          {isHost ? (
            <div className="space-y-2">
              {/* Host Action: Start Game */}
              <button
                type="button"
                onClick={handleStartGameClick}
                disabled={activeConnectedCount < 2}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all ${
                  activeConnectedCount >= 2
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-600/25 active:scale-95 cursor-pointer'
                    : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>
                  {activeConnectedCount >= 2
                    ? `Start ${gameState.settings?.gameMode ? gameState.settings.gameMode.replace(/_/g, ' ').toUpperCase() : 'GAME'}`
                    : `Waiting for 2 real players (${activeConnectedCount}/2)`}
                </span>
              </button>

              {activeConnectedCount < 2 && (
                <p className="text-[10px] text-center text-slate-500 dark:text-slate-400">
                  Share code <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{gameState.roomCode || (gameState.roomId.includes('_') ? gameState.roomId.split('_')[1].toUpperCase() : gameState.roomId)}</span> with real friends. Multiplayer rooms do not use AI bots.
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              <span>Waiting for host to start the game...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
