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
    <div
      className={`inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/90 dark:bg-slate-900/90 border-2 border-slate-300 dark:border-purple-800/80 shadow-xs backdrop-blur-sm transition-all select-none ${className}`}
    >
      {showLabels && (
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-purple-300 pl-1 hidden min-[480px]:inline-block">
          DARK MODE:
        </span>
      )}

      {/* OFF Button */}
      <button
        type="button"
        onClick={() => {
          if (darkMode) handleToggle();
        }}
        className={`px-2 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer ${
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
        className={`px-2 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer ${
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
  );
};
