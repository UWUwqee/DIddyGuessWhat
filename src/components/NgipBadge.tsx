import React from 'react';
import { Sparkles, Zap, Crown } from 'lucide-react';

interface NgipBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const NgipBadge: React.FC<NgipBadgeProps> = ({
  size = 'sm',
  showLabel = true,
  className = '',
}) => {
  const sizeClasses = {
    xs: 'text-[9px] px-1 py-0.2 gap-0.5',
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-0.8 gap-1.5',
    lg: 'text-sm px-3.5 py-1.2 gap-2',
  };

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center font-black rounded-lg bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white shadow-md shadow-amber-500/30 border border-amber-300/60 dark:border-amber-400/40 select-none animate-pulse ${sizeClasses[size]} ${className}`}
      title="งip VIP Privilege: Fast Animated Rainbow Name, 3x Bet Multiplier on All Games & Exclusive VIP Lounge Access!"
    >
      <Crown className={`${iconSizes[size]} text-amber-200 fill-amber-300 shrink-0`} />
      {showLabel && (
        <span className="tracking-wider uppercase font-black text-amber-100 drop-shadow-xs">
          งip
        </span>
      )}
    </span>
  );
};

interface NgipNameProps {
  name: string;
  isNgip?: boolean;
  color?: string;
  className?: string;
  badgeSize?: 'xs' | 'sm' | 'md';
  showBadge?: boolean;
}

export const NgipName: React.FC<NgipNameProps> = ({
  name,
  isNgip = false,
  color,
  className = '',
  badgeSize = 'xs',
  showBadge = false,
}) => {
  if (isNgip) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <span className="ngip-fast-recolor cursor-default font-black tracking-tight" title="งip VIP Member">
          {name}
        </span>
        {showBadge && <NgipBadge size={badgeSize} />}
      </span>
    );
  }

  return (
    <span className={`truncate ${color ? '' : 'text-slate-800 dark:text-slate-200'} ${className}`} style={color ? { color } : undefined}>
      {name}
    </span>
  );
};
