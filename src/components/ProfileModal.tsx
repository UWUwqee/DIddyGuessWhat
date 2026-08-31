import React, { useState, useEffect } from 'react';
import {
  User,
  Trophy,
  Award,
  Flame,
  Sparkles,
  LogOut,
  Check,
  X,
  Shield,
  Zap,
  Pencil,
  Coins,
  Volume2,
  VolumeX,
  ArrowLeft,
  Settings,
  Save,
  Crown,
  ShieldAlert,
  Sliders,
  PlusCircle,
  MinusCircle,
  RotateCcw,
} from 'lucide-react';
import { useAuth, ADMIN_EMAILS } from '../context/AuthContext';
import { AvatarSelector } from './AvatarSelector';
import { AvatarRenderer } from './AvatarRenderer';
import { AdminPanel } from './AdminPanel';
import {
  CURRENCY_CONFIG,
  formatCompactCurrency,
  formatFullCurrency,
  getWalletKey,
} from '../utils/currencyUtils';
import { CurrencyType } from '../types';
import { soundManager } from '../utils/soundEffects';
import { NgipBadge, NgipName } from './NgipBadge';

export const ProfileModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const {
    user,
    isAdmin,
    isNgip,
    canClaimNgipSalary,
    ngipSalaryTimeRemaining,
    claimNgipDailySalary,
    logout,
    updateAvatar,
    updateUsername,
    updateWallet,
    reduceCurrencies,
    overrideStats,
    unlockAllAchievements,
    resetUserStats,
  } = useAuth();

  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminSelectedCurrency, setAdminSelectedCurrency] = useState<CurrencyType>('diamond');

  useEffect(() => {
    if (user) {
      setNameInput(user.username);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSaveName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = nameInput.trim();
    if (clean && clean !== user.username) {
      updateUsername(clean);
      soundManager.playCorrect();
      setSaveSuccessMsg('Username updated instantly!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    }
    setIsEditingName(false);
  };

  const handleToggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const safeGamesPlayed = Math.max(
    user.stats.gamesPlayed || 0,
    (user.stats.wins || 0) + (user.stats.drawingsCompleted || 0) > 0 ? 1 : 0
  );
  const losses = Math.max(0, safeGamesPlayed - (user.stats.wins || 0));
  const winRate =
    safeGamesPlayed > 0 ? Math.round(((user.stats.wins || 0) / safeGamesPlayed) * 100) : 0;

  const xpForNextLevel = (user.level || 1) * 600;
  const currentLevelXp = user.xp % 600;
  const xpPercent = Math.min(100, Math.round((currentLevelXp / 600) * 100));

  const currencies: CurrencyType[] = ['diamond', 'amethyst', 'jade', 'ruby'];
  const wallet = user.wallet || {
    diamonds: '10000',
    amethysts: '10000',
    jades: '10000',
    rubies: '10000',
  };

  // Check if current user is owner admin strictly by verified email
  const isOwnerAdmin = Boolean(
    user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase().trim())
  );

  const formatSalaryCountdown = (ms: number): string => {
    const totalSecs = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
          {/* Header with Back Button and Close */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 ml-1">
                <Settings className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Player Profile & Settings</span>
              </h3>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success toast */}
          {saveSuccessMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* User Profile Card with Avatar & Name Editing */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                title="Change Avatar or Upload Picture"
                className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border-2 border-indigo-500/40 hover:border-indigo-600 flex items-center justify-center text-4xl shadow-md transition-transform hover:scale-105 select-none relative group overflow-hidden cursor-pointer shrink-0"
              >
                <AvatarRenderer avatar={user.avatar} className="w-full h-full object-cover" />
                <span className="absolute bottom-1 right-1 p-1 bg-indigo-600 text-white rounded-full shadow-sm z-10">
                  <Pencil className="w-2.5 h-2.5" />
                </span>
              </button>

              <div className="flex-1 min-w-0">
                {isEditingName ? (
                  <form onSubmit={handleSaveName} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      maxLength={24}
                      autoFocus
                      className="flex-1 px-2.5 py-1 text-xs sm:text-sm font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter new username"
                    />
                    <button
                      type="submit"
                      className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                      title="Save Username"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNameInput(user.username);
                        setIsEditingName(false);
                      }}
                      className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <NgipName
                      name={user.username}
                      isNgip={Boolean(user.isNgip || isAdmin)}
                      className="text-base font-extrabold text-slate-900 dark:text-white truncate"
                    />
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Edit Name"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    {Boolean(user.isNgip || isAdmin) && <NgipBadge size="xs" />}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shrink-0">
                      Level {user.level || 1}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-xs text-slate-400 truncate">
                    {user.email || 'Cloud Synced Player'}
                  </p>
                  {isOwnerAdmin && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black border border-amber-500/30">
                      <Crown className="w-2.5 h-2.5" />
                      <span>Owner Admin</span>
                    </span>
                  )}
                </div>

                {/* XP Progress Bar */}
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                    <span>Level Progression</span>
                    <span>{currentLevelXp} / 600 XP</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                      style={{ width: `${xpPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Avatar Picker Accordion */}
          {showAvatarPicker && (
            <div className="p-4 bg-slate-900/95 border border-indigo-500/30 rounded-2xl space-y-3 animate-scale-in text-white">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-200">
                  Select Avatar or Upload Custom Picture:
                </p>
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Close
                </button>
              </div>

              <AvatarSelector
                value={user.avatar}
                onChange={(newAvatar) => {
                  updateAvatar(newAvatar);
                }}
                compact={true}
              />
            </div>
          )}

          {/* Audio & Settings Section */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Sound Effects & Audio
                </p>
                <p className="text-[10px] text-slate-400">
                  {isMuted ? 'Muted (Audio Off)' : 'Active (SFX & Music On)'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleSound}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isMuted
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  : 'bg-indigo-600 text-white shadow-xs'
              }`}
            >
              {isMuted ? 'Turn Sound On' : 'Turn Sound Off'}
            </button>
          </div>

          {/* GW Currencies Wallet Showcase */}
          <div className="space-y-2">
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>GW Balance</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {currencies.map((c) => {
                const meta = CURRENCY_CONFIG[c];
                const val = wallet[getWalletKey(c)];
                return (
                  <div
                    key={c}
                    className={`p-2.5 rounded-2xl border ${meta.bgColor} ${meta.borderColor}`}
                  >
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="text-sm">{meta.symbol}</span>
                      <span className="text-[10px] font-bold uppercase text-slate-400">{meta.name}</span>
                    </div>
                    <div className={`text-xs font-black truncate ${meta.textColor}`}>
                      {formatCompactCurrency(val)}
                    </div>
                    <div className="text-[9px] text-slate-400 truncate mt-0.5" title={formatFullCurrency(val)}>
                      {formatFullCurrency(val)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 👑 VIP งip 100K Daily Salary (24-Hour Cooldown) Section */}
          {isNgip && (
            <div className="p-4 bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-pink-500/15 dark:from-amber-950/60 dark:via-purple-950/60 dark:to-pink-950/60 rounded-2xl border-2 border-amber-400 dark:border-amber-500/70 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 font-black shadow-sm">
                    <Crown className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>VIP งip 100K Daily Salary</span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/40">
                        24h Cooldown
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-300">
                      Claim +100,000 Diamonds, Amethysts, Jades & Rubies every 24 hours!
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                {canClaimNgipSalary ? (
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await claimNgipDailySalary();
                      setSaveSuccessMsg(res.message);
                      setTimeout(() => setSaveSuccessMsg(null), 4000);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 animate-pulse"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Claim +100K For All Currencies Now!</span>
                  </button>
                ) : (
                  <div className="w-full py-2.5 px-4 rounded-xl bg-slate-200 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold flex items-center justify-center gap-2">
                    <span>⏳ Cooldown Active: Next 100K in</span>
                    <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                      {formatSalaryCountdown(ngipSalaryTimeRemaining)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SPECIAL SECTION: EXCLUSIVE OWNER ADMIN CONSOLE (ONLY FOR FRANKLINKYLELUZANO / ADMIN) */}
          {isOwnerAdmin && (
            <div className="p-4 bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-indigo-500/10 dark:from-amber-950/40 dark:via-purple-950/40 dark:to-indigo-950/40 rounded-2xl border-2 border-amber-400/60 dark:border-amber-600/60 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-amber-500 text-white shadow-xs">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Owner Admin Management</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold uppercase">
                        Exclusive
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Economy modification, player currency reduction & VIP controls
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAdminModal(true)}
                  className="px-2.5 py-1 rounded-xl text-xs font-black text-white bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Full Admin Panel</span>
                </button>
              </div>

              {/* Quick Currency Modifier inside Profile */}
              <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-amber-300/40 dark:border-amber-700/40 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-700 dark:text-slate-300">
                    Quick Currency Action:
                  </span>
                  <div className="flex items-center gap-1">
                    {currencies.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAdminSelectedCurrency(c)}
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                          adminSelectedCurrency === c
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {CURRENCY_CONFIG[c].symbol}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Add / Reduce / Set Action Chips */}
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      updateWallet(adminSelectedCurrency, '1000000000', 'add');
                      soundManager.playCorrect();
                      setSaveSuccessMsg(`+1 Billion ${CURRENCY_CONFIG[adminSelectedCurrency].name} added!`);
                      setTimeout(() => setSaveSuccessMsg(null), 3000);
                    }}
                    className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3 h-3 text-emerald-600" />
                    <span>+1B</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      reduceCurrencies(adminSelectedCurrency, '100000000');
                      soundManager.playCorrect();
                      setSaveSuccessMsg(`-100M ${CURRENCY_CONFIG[adminSelectedCurrency].name} deducted!`);
                      setTimeout(() => setSaveSuccessMsg(null), 3000);
                    }}
                    className="p-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <MinusCircle className="w-3 h-3 text-rose-600" />
                    <span>-100M</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateWallet(adminSelectedCurrency, '10000', 'set');
                      soundManager.playCorrect();
                      setSaveSuccessMsg(`Set to 10K starter balance.`);
                      setTimeout(() => setSaveSuccessMsg(null), 3000);
                    }}
                    className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-[10px] font-black flex items-center justify-center cursor-pointer"
                  >
                    <span>= 10K</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateWallet(adminSelectedCurrency, '1000000000000000000000', 'set');
                      soundManager.playCorrect();
                      setSaveSuccessMsg(`Set to 1 Sextillion 🔥`);
                      setTimeout(() => setSaveSuccessMsg(null), 3000);
                    }}
                    className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 border border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 rounded-lg text-[10px] font-black flex items-center justify-center cursor-pointer truncate"
                  >
                    <span>= 1 Sx 🔥</span>
                  </button>
                </div>

                {/* Quick 1-click Stats booster */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      overrideStats(
                        { totalScore: (user.stats.totalScore || 0) + 100000, wins: (user.stats.wins || 0) + 50 },
                        100,
                        60000
                      );
                      unlockAllAchievements();
                      soundManager.playCorrect();
                      setSaveSuccessMsg('Level 100 VIP + All Badges Activated!');
                      setTimeout(() => setSaveSuccessMsg(null), 3000);
                    }}
                    className="py-1.5 px-2 rounded-lg bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 text-amber-900 dark:text-amber-200 text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Crown className="w-3 h-3 text-amber-600" />
                    <span>Boost Lvl 100 & Badges</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Reset all your stats to zero?')) {
                        resetUserStats();
                        soundManager.playCorrect();
                        setSaveSuccessMsg('Career stats reset.');
                        setTimeout(() => setSaveSuccessMsg(null), 3000);
                      }
                    }}
                    className="py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 text-slate-600 dark:text-slate-400 hover:text-rose-600 text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Stats to 0</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lifetime Stats Grid with Win / Loss Breakdown */}
          <div className="space-y-2">
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Career Records & Win/Loss Count
            </p>
            <div className="grid grid-cols-3 gap-2">
              {/* Wins */}
              <div className="p-2.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center">
                <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {user.stats.wins || 0}
                </p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold uppercase">Wins</p>
              </div>

              {/* Losses */}
              <div className="p-2.5 bg-rose-50/60 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-800 text-center">
                <p className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400">
                  {losses}
                </p>
                <p className="text-[10px] text-rose-700 dark:text-rose-300 font-bold uppercase">Losses</p>
              </div>

              {/* Games Played */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
                <p className="text-base sm:text-lg font-black text-slate-700 dark:text-slate-300">
                  {safeGamesPlayed}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Total Games</p>
              </div>

              {/* Total Points */}
              <div className="p-2.5 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800 text-center">
                <p className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400">
                  {user.stats.totalScore.toLocaleString()}
                </p>
                <p className="text-[10px] text-indigo-700 dark:text-indigo-300 font-semibold uppercase">Points</p>
              </div>

              {/* Win Rate */}
              <div className="p-2.5 bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800 text-center">
                <p className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400">
                  {winRate}%
                </p>
                <p className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold uppercase">Win Rate</p>
              </div>

              {/* Words Guessed */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
                <p className="text-base sm:text-lg font-black text-slate-700 dark:text-slate-300">
                  {user.stats.wordsGuessed || 0}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Guessed</p>
              </div>
            </div>
          </div>

          {/* Badges & Achievements */}
          <div className="space-y-2">
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Unlocked Achievements
            </p>
            <div className="flex flex-wrap gap-2">
              {user.unlockedBadges.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Logout / Switch User */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Reset / Switch Player</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Panel Modal launched from Profile */}
      {showAdminModal && <AdminPanel onClose={() => setShowAdminModal(false)} />}
    </>
  );
};
