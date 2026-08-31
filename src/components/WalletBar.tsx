import React, { useState } from 'react';
import { Sparkles, Plus, Gift, ShieldAlert, ArrowUpRight, Check, Coins, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  CURRENCY_CONFIG,
  formatCompactCurrency,
  formatFullCurrency,
  getWalletKey,
} from '../utils/currencyUtils';
import { CurrencyType } from '../types';
import { soundManager } from '../utils/soundEffects';
import { DailyMissionsModal } from './DailyMissionsModal';

interface WalletBarProps {
  onOpenAdmin?: () => void;
}

export const WalletBar: React.FC<WalletBarProps> = ({ onOpenAdmin }) => {
  const { user, updateWallet, isAdmin } = useAuth();
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [showMissionsModal, setShowMissionsModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>('diamond');
  const [hasClaimedDaily, setHasClaimedDaily] = useState(false);
  const [dailyClaimMsg, setDailyClaimMsg] = useState<string | null>(null);

  const wallet = user?.wallet || {
    diamonds: '100000000',
    amethysts: '50000000',
    jades: '25000000',
    rubies: '10000000',
  };

  const handleDailyReward = () => {
    soundManager.playCorrect();
    updateWallet('diamond', '10000000', 'add'); // +10M
    updateWallet('amethyst', '5000000', 'add');  // +5M
    updateWallet('jade', '2500000', 'add');      // +2.5M
    updateWallet('ruby', '1000000', 'add');      // +1M
    setHasClaimedDaily(true);
    setDailyClaimMsg('+10M 💎 | +5M 🔮 | +2.5M 🍵 | +1M ♦️ Claimed!');
    setTimeout(() => setDailyClaimMsg(null), 4000);
  };

  const currencies: CurrencyType[] = ['diamond', 'amethyst', 'jade', 'ruby'];

  return (
    <>
      <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none py-0.5 max-w-[280px] xs:max-w-[340px] sm:max-w-none">
        {currencies.map((curr) => {
          const meta = CURRENCY_CONFIG[curr];
          const valStr = wallet[getWalletKey(curr)];
          const compact = formatCompactCurrency(valStr);
          const full = formatFullCurrency(valStr);

          return (
            <div
              key={curr}
              onClick={() => {
                setSelectedCurrency(curr);
                setShowQuickAddModal(true);
              }}
              title={`${meta.name}: ${full} (Click to manage/refill)`}
              className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-xl sm:rounded-2xl border transition-all cursor-pointer select-none hover:scale-105 active:scale-95 ${meta.bgColor} ${meta.borderColor} shrink-0`}
            >
              <span className="text-xs sm:text-sm">{meta.symbol}</span>
              <span className={`text-[10px] sm:text-xs font-black tracking-tight ${meta.textColor}`}>
                {compact}
              </span>
            </div>
          );
        })}

        {/* Daily Missions Button */}
        <button
          type="button"
          onClick={() => setShowMissionsModal(true)}
          title="Daily Missions & Quests"
          className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-xl text-[10px] sm:text-xs font-black transition-all cursor-pointer shrink-0 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-xs hover:scale-105 active:scale-95"
        >
          <Target className="w-3 h-3 text-amber-300" />
          <span className="hidden md:inline">Missions</span>
        </button>

        {/* Daily Fortune / Quick Top-up Button */}
        <button
          type="button"
          onClick={handleDailyReward}
          disabled={hasClaimedDaily}
          title={hasClaimedDaily ? 'Daily bonus already claimed today!' : 'Claim Daily Fortune Bonus'}
          className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-xl text-[10px] sm:text-xs font-black transition-all cursor-pointer shrink-0 ${
            hasClaimedDaily
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xs animate-pulse'
          }`}
        >
          <Gift className="w-3 h-3" />
          <span className="hidden md:inline">{hasClaimedDaily ? 'Claimed' : 'Free Fortune'}</span>
        </button>

        {/* Admin Console Shortcut if Admin */}
        {isAdmin && onOpenAdmin && (
          <button
            type="button"
            onClick={onOpenAdmin}
            title="Open Admin Economy & Currencies Panel"
            className="flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-xl text-[10px] sm:text-xs font-extrabold bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white shadow-sm transition-all cursor-pointer shrink-0"
          >
            <ShieldAlert className="w-3 h-3 text-amber-300" />
            <span className="hidden lg:inline">Admin Panel</span>
          </button>
        )}
      </div>

      {/* Floating daily reward alert */}
      {dailyClaimMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-2xl shadow-xl animate-bounce flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{dailyClaimMsg}</span>
        </div>
      )}

      {/* Quick Wallet Modal */}
      {showQuickAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  GW Balance Wallet
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Wallet Balances Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              {currencies.map((c) => {
                const meta = CURRENCY_CONFIG[c];
                const amount = wallet[getWalletKey(c)];
                const isSelected = selectedCurrency === c;

                return (
                  <div
                    key={c}
                    onClick={() => setSelectedCurrency(c)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? `${meta.bgColor} ${meta.borderColor} ring-2 ring-indigo-500/30`
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base">{meta.symbol}</span>
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        {meta.name}
                      </span>
                    </div>
                    <div className={`text-sm font-black truncate ${meta.textColor}`}>
                      {formatCompactCurrency(amount)}
                    </div>
                    <div className="text-[9px] text-slate-400 truncate mt-0.5" title={formatFullCurrency(amount)}>
                      {formatFullCurrency(amount)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Free Reloads */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <span>Reload {CURRENCY_CONFIG[selectedCurrency].symbol} {CURRENCY_CONFIG[selectedCurrency].name}</span>
                </span>
                <span className="text-[10px] text-slate-400">Free Arcade Faucet</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: '+100K', val: '100000' },
                  { label: '+1M', val: '1000000' },
                  { label: '+100M', val: '100000000' },
                  { label: '+1 Billion', val: '1000000000' },
                  { label: '+1 Trillion', val: '1000000000000' },
                  { label: '+1 Sextillion 🔥', val: '1000000000000000000000' },
                ].map((pack) => (
                  <button
                    key={pack.label}
                    type="button"
                    onClick={() => {
                      soundManager.playCorrect();
                      updateWallet(selectedCurrency, pack.val, 'add');
                    }}
                    className="py-1.5 px-2 rounded-xl text-[10px] font-bold bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 transition-all cursor-pointer truncate"
                  >
                    {pack.label}
                  </button>
                ))}
              </div>
            </div>

            {isAdmin && onOpenAdmin && (
              <button
                type="button"
                onClick={() => {
                  setShowQuickAddModal(false);
                  onOpenAdmin();
                }}
                className="w-full py-2.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <ShieldAlert className="w-4 h-4 text-amber-300" />
                <span>Open Full Admin Economy Console</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Daily Missions Modal */}
      <DailyMissionsModal
        isOpen={showMissionsModal}
        onClose={() => setShowMissionsModal(false)}
      />
    </>
  );
};
