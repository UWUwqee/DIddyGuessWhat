import React from 'react';
import { Sparkles, Trophy, Clock, CheckCircle, Paintbrush } from 'lucide-react';
import { useGame } from '../context/GameContext';

export const RoundOverlay: React.FC = () => {
  const { gameState } = useGame();

  if (!gameState || gameState.status !== 'round_end') {
    return null;
  }

  const summary = gameState.roundSummary;
  if (!summary) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-center">
        {/* Header */}
        <div className="space-y-1">
          <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
            Round {gameState.currentRound} of {gameState.totalRounds}
          </span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white pt-2">
            The word was:
          </h3>
          <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 uppercase tracking-wider py-1">
            {summary.word}
          </div>
        </div>

        {/* Drawer summary */}
        {gameState.drawerName && (
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Paintbrush className="w-4 h-4 text-purple-500" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Artist: {gameState.drawerName}
              </span>
            </div>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
              +{summary.drawerBonus} pts
            </span>
          </div>
        )}

        {/* Guesses list */}
        <div className="space-y-2 text-left">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Guessed by ({summary.correctGuessers.length})</span>
            <span>Score Gained</span>
          </div>

          <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
            {summary.correctGuessers.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                Nobody guessed the word in time!
              </div>
            ) : (
              summary.correctGuessers.map((guesser, idx) => (
                <div
                  key={guesser.playerId}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400 w-4">#{idx + 1}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{guesser.name}</span>
                    <span className="text-[10px] text-slate-400">({guesser.time}s)</span>
                  </div>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                    +{guesser.scoreGained} pts
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Countdown footer */}
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-4">
          <Clock className="w-4 h-4 animate-spin text-indigo-500" />
          <span>Next turn starting shortly...</span>
        </div>
      </div>
    </div>
  );
};
