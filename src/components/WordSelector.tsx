import React from 'react';
import { Sparkles, Clock, Zap, Award, Flame, Palette } from 'lucide-react';
import { WordChoice } from '../types';
import { useGame } from '../context/GameContext';

export const WordSelector: React.FC = () => {
  const { gameState, isDrawer, selectWord } = useGame();

  if (!gameState || gameState.status !== 'selecting_word' || !isDrawer) {
    return null;
  }

  const choices = gameState.wordChoices || [];

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'easy':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Easy
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Medium
          </span>
        );
      case 'hard':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Hard
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center mx-auto shadow-inner">
            <Palette className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Choose a Word to Draw!
          </h3>
          <p className="text-xs text-slate-500">
            Select one of the three options below before time runs out.
          </p>
        </div>

        {/* Countdown Timer Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              Time remaining
            </span>
            <span className="text-indigo-600 dark:text-indigo-400">{gameState.timeLeft}s</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${(gameState.timeLeft / 12) * 100}%` }}
            />
          </div>
        </div>

        {/* Word Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {choices.map((choice) => (
            <button
              key={choice.word}
              onClick={() => selectWord(choice)}
              className="p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/40 text-left transition-all hover:scale-[1.02] active:scale-[0.98] group flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                {getDifficultyBadge(choice.difficulty)}
                <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400">
                  +{choice.points} pts
                </span>
              </div>

              <div>
                <p className="text-lg font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {choice.word}
                </p>
                <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider mt-0.5">
                  {choice.category}
                </p>
              </div>

              {choice.hint && (
                <p className="text-[10px] text-slate-400 italic line-clamp-1 border-t border-slate-200 dark:border-slate-800 pt-2">
                  &quot;{choice.hint}&quot;
                </p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
