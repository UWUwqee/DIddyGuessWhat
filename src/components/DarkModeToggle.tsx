import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { soundManager } from '../utils/soundEffects';

interface DarkModeToggleProps {
  className?: string;
  showLabels?: boolean;
}

export const DarkModeToggle: React.FC<DarkModeToggleProps> = ({
  className = '',
  showLabels = true,
}) => {
  const { darkMode, toggleDarkMode } = useAuth();

  const handleToggle = () => {
    soundManager.playTick();
    toggleDarkMode();
  };

  return (
    <>
      {/* Mobile-only compact 1-tap pill toggle (fits easily on iPhone & Android) */}
      <button
        type="button"
        onClick={handleToggle}
        className={`sm:hidden p-1.5 sm:p-2 rounded-xl border-2 transition-all cursor-pointer shadow-xs flex items-center justify-center ${
          darkMode
            ? 'bg-purple-950/90 text-purple-300 border-purple-700 shadow-purple-900/30'
            : 'bg-amber-100 text-amber-900 border-amber-300'
        } ${className}`}
        title={darkMode ? 'Dark Mode ON — Tap for Light Mode' : 'Light Mode ON — Tap for Dark Mode'}
      >
        {darkMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
      </button>

      {/* Tablet & Desktop segmented ON/OFF control */}
      <div
        className={`hidden sm:inline-flex items-center gap-1 p-1 rounded-xl bg-slate-200/90 dark:bg-slate-900/90 border-2 border-slate-300 dark:border-purple-800/80 shadow-xs backdrop-blur-sm transition-all select-none ${className}`}
      >
        {showLabels && (
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-purple-300 pl-1 hidden min-[640px]:inline-block">
            DARK:
          </span>
        )}

        {/* OFF Button */}
        <button
          type="button"
          onClick={() => {
            if (darkMode) handleToggle();
          }}
          className={`px-1.5 sm:px-2 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 transition-all cursor-pointer ${
            !darkMode
              ? 'bg-amber-400 text-slate-950 shadow-sm scale-102 border border-amber-300'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-800/50'
          }`}
          title="Turn Dark Mode OFF (Normal / Light Mode)"
        >
          <Sun className="w-3 h-3" />
          <span>OFF</span>
        </button>

        {/* ON Button */}
        <button
          type="button"
          onClick={() => {
            if (!darkMode) handleToggle();
          }}
          className={`px-1.5 sm:px-2 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 transition-all cursor-pointer ${
            darkMode
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-900/50 scale-102 border border-purple-400'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-800/50'
          }`}
          title="Turn Dark Mode ON (Deep Gothic Dark Mode)"
        >
          <Moon className="w-3 h-3" />
          <span>ON</span>
        </button>
      </div>
    </>
  );
};
