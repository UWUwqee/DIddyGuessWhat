import React from 'react';
import { Trophy, Crown, Medal, RotateCcw, Home, Sparkles, Award, Star } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { AvatarRenderer } from './AvatarRenderer';

export const GameOverModal: React.FC = () => {
  const { gameState, leaveRoom, isHost, startGame } = useGame();
  const { user } = useAuth();

  if (!gameState || gameState.status !== 'game_over') {
    return null;
  }

  // Sort players by score
  const podium = [...gameState.players].sort((a, b) => b.score - a.score);
  const first = podium[0];
  const second = podium[1];
  const third = podium[2];

  const isMeWinner = first?.id === user?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 text-center my-8">
        {/* Victory Banner */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 text-xs font-extrabold border border-amber-200 dark:border-amber-800 shadow-sm">
            <Trophy className="w-4 h-4 fill-amber-400" />
            MATCH COMPLETED!
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {isMeWinner ? 'Victory is Yours!' : `${first?.username} Wins!`}
          </h2>
          <p className="text-xs text-slate-500">
            Scores have been synced to the global leaderboard.
          </p>
        </div>

        {/* 3-Step Podium */}
        <div className="flex items-end justify-center gap-3 sm:gap-4 pt-4 pb-2 px-2">
          {/* 2nd Place */}
          {second && (
            <div className="flex-1 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-2xl mb-1 select-none bg-slate-100 dark:bg-slate-800">
                <AvatarRenderer avatar={second.avatar} className="w-full h-full object-cover" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[80px]">
                {second.username}
              </p>
              <span className="text-[11px] font-extrabold text-slate-500 mb-2">
                {second.score} pts
              </span>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-t-2xl h-24 flex flex-col items-center justify-start pt-2 border-t-4 border-slate-400">
                <span className="text-sm font-black text-slate-500">2nd</span>
                <Medal className="w-5 h-5 text-slate-400 mt-1" />
              </div>
            </div>
          )}

          {/* 1st Place (Winner) */}
          {first && (
            <div className="flex-1 flex flex-col items-center">
              <Crown className="w-7 h-7 text-amber-500 fill-amber-400 animate-bounce mb-0.5" />
              <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-3xl mb-1 select-none bg-amber-100 dark:bg-amber-950/60 ring-2 ring-amber-400">
                <AvatarRenderer avatar={first.avatar} className="w-full h-full object-cover" />
              </div>
              <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400 truncate max-w-[90px]">
                {first.username}
              </p>
              <span className="text-xs font-black text-amber-600 dark:text-amber-400 mb-2">
                {first.score} pts
              </span>
              <div className="w-full bg-gradient-to-t from-amber-200 to-amber-100 dark:from-amber-950 dark:to-amber-900/60 rounded-t-2xl h-32 flex flex-col items-center justify-start pt-2 border-t-4 border-amber-500 shadow-md">
                <span className="text-base font-black text-amber-700 dark:text-amber-300">1st</span>
                <Trophy className="w-6 h-6 text-amber-500 fill-amber-400 mt-1" />
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {third && (
            <div className="flex-1 flex flex-col items-center">
              <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-2xl mb-1 select-none bg-slate-100 dark:bg-slate-800">
                <AvatarRenderer avatar={third.avatar} className="w-full h-full object-cover" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[80px]">
                {third.username}
              </p>
              <span className="text-[11px] font-extrabold text-slate-500 mb-2">
                {third.score} pts
              </span>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-t-2xl h-16 flex flex-col items-center justify-start pt-2 border-t-4 border-amber-700">
                <span className="text-xs font-black text-slate-500">3rd</span>
                <Medal className="w-4 h-4 text-amber-700 mt-0.5" />
              </div>
            </div>
          )}
        </div>

        {/* Full Rankings List */}
        <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 text-left">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Final Standings
          </p>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {podium.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400 w-4">#{i + 1}</span>
                  <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center text-sm">
                    <AvatarRenderer avatar={p.avatar} className="w-full h-full object-cover" />
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{p.username}</span>
                </div>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{p.score} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          {isHost ? (
            <button
              onClick={startGame}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again (New Match)</span>
            </button>
          ) : (
            <div className="w-full sm:flex-1 text-xs text-slate-500 italic py-2">
              Waiting for host to rematch...
            </div>
          )}

          <button
            onClick={leaveRoom}
            className="w-full sm:w-auto py-3 px-5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
