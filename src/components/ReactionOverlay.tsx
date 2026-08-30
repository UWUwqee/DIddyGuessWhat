import React from 'react';

interface ReactionItem {
  id: string;
  senderName: string;
  emoji: string;
  x: number;
}

export const ReactionOverlay: React.FC<{ reactions: ReactionItem[] }> = ({ reactions }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {reactions.map((rx) => (
        <div
          key={rx.id}
          className="absolute bottom-6 flex flex-col items-center animate-float-fade"
          style={{ left: `${rx.x}%` }}
        >
          <span className="text-3xl sm:text-4xl drop-shadow-md select-none transform transition-transform hover:scale-125">
            {rx.emoji}
          </span>
          <span className="text-[10px] font-bold text-white bg-slate-900/70 px-1.5 py-0.5 rounded-full backdrop-blur-xs mt-0.5 shadow">
            {rx.senderName}
          </span>
        </div>
      ))}
    </div>
  );
};
