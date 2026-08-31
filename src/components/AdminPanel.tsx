import React, { useState } from 'react';
import {
  ShieldAlert,
  Coins,
  Sparkles,
  Send,
  Users,
  Flame,
  CheckCircle2,
  AlertCircle,
  Database,
  Crown,
  Zap,
  MinusCircle,
  PlusCircle,
  Equal,
  Trophy,
  Award,
  RotateCcw,
  Sliders,
  Check,
  Radio,
  Search,
  UserCheck,
  UserX,
  ExternalLink,
  Gift,
  Eye,
  Edit3,
  X,
  Lock,
} from 'lucide-react';
import { useAuth, ADMIN_EMAILS } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { CurrencyType, UserWallet, PlayerStats, UserProfile } from '../types';
import {
  CURRENCY_CONFIG,
  formatCompactCurrency,
  formatFullCurrency,
  getWalletKey,
  ADMIN_GRANT_PACKAGES,
  ADMIN_SET_EXACT_PRESETS,
  toBigInt,
  INITIAL_DEFAULT_WALLET,
} from '../utils/currencyUtils';
import { soundManager } from '../utils/soundEffects';
import { AvatarRenderer } from './AvatarRenderer';
import { NgipBadge, NgipName } from './NgipBadge';

interface AdminPanelProps {
  onClose: () => void;
}

type AdminTab = 'accounts' | 'economy' | 'ngip_perks' | 'server';
type CurrencyAction = 'add' | 'sub' | 'set';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const {
    user,
    allRegisteredUsers,
    updateWallet,
    reduceCurrencies,
    airdropCurrenciesGlobally,
    overrideStats,
    resetUserStats,
    unlockAllAchievements,
    toggleUserNgip,
    adminModifyOtherUserWallet,
    adminOverrideOtherUserStats,
  } = useAuth();
  const { publicRooms } = useGame();

  // Strict access control: Authorized admin email can view or interact with the Admin Panel
  const isAuthorizedOwner = Boolean(
    user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase().trim())
  );

  const [activeTab, setActiveTab] = useState<AdminTab>('accounts');
  const [searchQuery, setSearchQuery] = useState('');
  const [accountFilter, setAccountFilter] = useState<'all' | 'ngip_only' | 'admins'>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>('diamond');
  const [currencyAction, setCurrencyAction] = useState<CurrencyAction>('add');
  const [customAmount, setCustomAmount] = useState<string>('1000000000000000000000'); // 1 Sextillion
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Selected User Modal for deep editing
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editUserCustomAmount, setEditUserCustomAmount] = useState<string>('1000000000000');
  const [editUserSelectedCurr, setEditUserSelectedCurr] = useState<CurrencyType>('diamond');
  const [editUserScore, setEditUserScore] = useState<string>('0');
  const [editUserLevel, setEditUserLevel] = useState<string>('1');

  if (!isAuthorizedOwner) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans">
        <div className="bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-6 max-w-md w-full text-center space-y-4 text-white shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/40">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black tracking-wide text-rose-400">Restricted Admin Portal</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            The Master Admin & Economy Command Center is strictly restricted to authorized administrator accounts (<span className="text-amber-400 font-bold">{ADMIN_EMAILS[0]}</span>).
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer border border-slate-700"
          >
            Return to App
          </button>
        </div>
      </div>
    );
  }

  // Prepare full list of accounts: combine all registered accounts and current user
  const accountMap = new Map<string, UserProfile>();
  if (user) {
    accountMap.set(user.id, user);
  }
  allRegisteredUsers.forEach((u) => {
    accountMap.set(u.id, u);
  });
  const allAccountsList = Array.from(accountMap.values());

  const filteredAccounts = allAccountsList.filter((acc) => {
    const matchesSearch =
      acc.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (acc.email && acc.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      acc.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (accountFilter === 'ngip_only') return Boolean(acc.isNgip || acc.isAdmin);
    if (accountFilter === 'admins') return Boolean(acc.isAdmin);
    return true;
  });

  const showNotification = (msg: string) => {
    soundManager.playCorrect();
    setSuccessNotice(msg);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  // Toggle งip status for an account
  const handleToggleNgip = async (targetUser: UserProfile) => {
    const nextState = !targetUser.isNgip;
    await toggleUserNgip(targetUser.id, nextState);
    showNotification(
      nextState
        ? `✨ Granted งip Status to ${targetUser.username}! (Fast Name + 3X Bets + VIP Lounge)`
        : `Revoked งip Status from ${targetUser.username}.`
    );
  };

  // Grant quick currency to a target account
  const handleQuickGrantToAccount = async (
    targetUser: UserProfile,
    currency: CurrencyType,
    amount: string
  ) => {
    await adminModifyOtherUserWallet(targetUser.id, currency, amount, 'add');
    const currMeta = CURRENCY_CONFIG[currency];
    showNotification(
      `Added +${formatCompactCurrency(amount)} ${currMeta.symbol} ${currMeta.name} to ${targetUser.username}'s balance!`
    );
  };

  const handleOpenEditUserModal = (target: UserProfile) => {
    setEditingUser(target);
    setEditUserScore(target.stats?.totalScore?.toString() || '0');
    setEditUserLevel(target.level?.toString() || '1');
  };

  const handleSaveUserModalChanges = async () => {
    if (!editingUser) return;
    const scoreNum = Math.max(0, parseInt(editUserScore, 10) || 0);
    const levelNum = Math.max(1, parseInt(editUserLevel, 10) || 1);

    await adminOverrideOtherUserStats(
      editingUser.id,
      { totalScore: scoreNum },
      levelNum
    );

    showNotification(`Updated ${editingUser.username}'s Level to ${levelNum} and Score to ${scoreNum}!`);
    setEditingUser(null);
  };

  const handleApplyUserCurrencyModal = async (action: 'add' | 'sub' | 'set') => {
    if (!editingUser) return;
    await adminModifyOtherUserWallet(editingUser.id, editUserSelectedCurr, editUserCustomAmount, action);
    const currMeta = CURRENCY_CONFIG[editUserSelectedCurr];
    showNotification(
      `Updated ${editingUser.username}'s ${currMeta.name} balance (${action} ${formatCompactCurrency(editUserCustomAmount)})!`
    );
  };

  // Self & Global Airdrops
  const handleGlobalOrSelfEconomy = (amountStr: string, action: CurrencyAction) => {
    const currMeta = CURRENCY_CONFIG[selectedCurrency];
    if (action === 'add') {
      airdropCurrenciesGlobally(selectedCurrency, amountStr);
      showNotification(
        `🚀 Global Airdrop Executed! +${formatCompactCurrency(amountStr)} ${currMeta.symbol} ${currMeta.name} given to ALL accounts!`
      );
    } else if (action === 'set') {
      updateWallet(selectedCurrency, amountStr, 'set');
      showNotification(`Set your personal wallet balance to ${formatCompactCurrency(amountStr)} ${currMeta.name}!`);
    } else if (action === 'sub') {
      reduceCurrencies(selectedCurrency, amountStr);
      showNotification(`Deducted -${formatCompactCurrency(amountStr)} ${currMeta.name}.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto font-sans">
      <div className="relative w-full max-w-5xl bg-slate-900 border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Control Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-purple-950 to-slate-950 border-b border-amber-500/30 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-wide">
                  Master Admin & Economy Command Center
                </h2>
                <NgipBadge size="xs" />
              </div>
              <p className="text-xs text-amber-300/80 font-mono">
                Operator: <span className="font-bold text-white">{user?.email || 'franklinkyleluzano@gmail.com'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all shadow-md active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-3 bg-slate-950/80 border-b border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'accounts'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>👥 Registered Accounts & งip Manager</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
              {allAccountsList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('economy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'economy'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>💎 Fast Airdrop & Global Economy</span>
          </button>

          <button
            onClick={() => setActiveTab('ngip_perks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'ngip_perks'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>👑 งip 3X Engine & Perks</span>
          </button>

          <button
            onClick={() => setActiveTab('server')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'server'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>🎮 Live Rooms ({publicRooms.length})</span>
          </button>
        </div>

        {/* Success Alert Banner */}
        {successNotice && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Tab 1: Registered Accounts & งip Manager */}
        {activeTab === 'accounts' && (
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {/* Search & Filter Header */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user accounts by username, email, or user ID..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setAccountFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    accountFilter === 'all'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  All ({allAccountsList.length})
                </button>
                <button
                  onClick={() => setAccountFilter('ngip_only')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    accountFilter === 'ngip_only'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-400'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>งip Members ({allAccountsList.filter((a) => a.isNgip || a.isAdmin).length})</span>
                </button>
                <button
                  onClick={() => setAccountFilter('admins')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    accountFilter === 'admins'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-400'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  Admins ({allAccountsList.filter((a) => a.isAdmin).length})
                </button>
              </div>
            </div>

            {/* User List Cards */}
            <div className="space-y-3">
              {filteredAccounts.length === 0 ? (
                <div className="text-center py-12 bg-slate-950/60 rounded-3xl border border-slate-800">
                  <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-400">No matching user accounts found.</p>
                  <p className="text-xs text-slate-600 mt-1">Accounts will automatically appear as users login and play.</p>
                </div>
              ) : (
                filteredAccounts.map((account) => {
                  const accWallet = account.wallet || INITIAL_DEFAULT_WALLET;
                  const isAccountNgip = Boolean(account.isNgip || account.isAdmin);
                  const isCurrentUser = account.id === user?.id;

                  return (
                    <div
                      key={account.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                        isAccountNgip
                          ? 'bg-gradient-to-r from-slate-950 via-purple-950/40 to-slate-950 border-amber-500/50 shadow-lg shadow-amber-500/5'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Left: Avatar & Identity */}
                      <div className="flex items-center gap-3 min-w-[220px]">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden border-2 shrink-0 relative"
                          style={{ backgroundColor: `${account.color}25`, borderColor: account.color }}
                        >
                          <AvatarRenderer avatar={account.avatar} className="w-full h-full object-cover" />
                          {isAccountNgip && (
                            <div className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 p-0.5 rounded-full shadow-md">
                              <Crown className="w-2.5 h-2.5 fill-current" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <NgipName name={account.username} isNgip={isAccountNgip} className="font-black text-sm text-white" />
                            {isCurrentUser && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                YOU
                              </span>
                            )}
                            {account.isAdmin && (
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                OWNER
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-400 font-mono">
                            {account.email || `ID: ${account.id.substring(0, 12)}...`}
                          </p>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span className="font-bold text-indigo-400">Lvl {account.level || 1}</span>
                            <span>•</span>
                            <span className="text-amber-400 font-bold">{account.stats?.totalScore?.toLocaleString() || 0} Pts</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Live Currencies Balances */}
                      <div className="grid grid-cols-4 gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-center min-w-[240px]">
                        <div>
                          <span className="text-[10px] text-slate-400 block">💎 Dia</span>
                          <span className="text-xs font-mono font-black text-cyan-300">
                            {formatCompactCurrency(accWallet.diamonds)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">🔮 Ame</span>
                          <span className="text-xs font-mono font-black text-purple-300">
                            {formatCompactCurrency(accWallet.amethysts)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">🍵 Jad</span>
                          <span className="text-xs font-mono font-black text-emerald-300">
                            {formatCompactCurrency(accWallet.jades)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">♦️ Rub</span>
                          <span className="text-xs font-mono font-black text-rose-300">
                            {formatCompactCurrency(accWallet.rubies)}
                          </span>
                        </div>
                      </div>

                      {/* Right: Quick Action Controls */}
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {/* งip Toggle Button */}
                        <button
                          onClick={() => handleToggleNgip(account)}
                          className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md active:scale-95 ${
                            isAccountNgip
                              ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white border border-amber-300 shadow-amber-500/20'
                              : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-500/50'
                          }`}
                        >
                          <Crown className="w-3.5 h-3.5" />
                          <span>{isAccountNgip ? 'งip ACTIVE ✨' : 'Grant งip 👑'}</span>
                        </button>

                        {/* Quick 1B Diamonds Button */}
                        <button
                          onClick={() => handleQuickGrantToAccount(account, 'diamond', '1000000000')}
                          className="px-2.5 py-2 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold rounded-xl active:scale-95 transition-all"
                          title="Grant +1 Billion Diamonds"
                        >
                          +1B 💎
                        </button>

                        {/* Quick 1T All Gems Button */}
                        <button
                          onClick={() => handleQuickGrantToAccount(account, 'diamond', '1000000000000')}
                          className="px-2.5 py-2 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 text-xs font-bold rounded-xl active:scale-95 transition-all"
                          title="Grant +1 Trillion Diamonds"
                        >
                          +1T 🔮
                        </button>

                        {/* Open Detailed Modal */}
                        <button
                          onClick={() => handleOpenEditUserModal(account)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-all shadow-md active:scale-95"
                          title="Open Custom Economy & Stats Editor"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Fast Economy & Global Airdrops */}
        {activeTab === 'economy' && (
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
            <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Gift className="w-5 h-5 text-amber-400" />
                    Global Currency Airdrop & Balance Setter
                  </h3>
                  <p className="text-xs text-slate-400">
                    Airdrop gems to ALL registered and active users simultaneously or set balances.
                  </p>
                </div>
              </div>

              {/* Currency Selector */}
              <div className="grid grid-cols-4 gap-2">
                {(['diamond', 'amethyst', 'jade', 'ruby'] as CurrencyType[]).map((c) => {
                  const conf = CURRENCY_CONFIG[c];
                  const isSelected = selectedCurrency === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setSelectedCurrency(c)}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/40'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-xl block">{conf.symbol}</span>
                      <span className="text-xs font-bold capitalize">{conf.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Preset Packages */}
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wider">
                  Instant Airdrop Amounts
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ADMIN_GRANT_PACKAGES.map((pkg) => (
                    <button
                      key={pkg.label}
                      onClick={() => handleGlobalOrSelfEconomy(pkg.amount, 'add')}
                      className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 rounded-2xl text-left transition-all active:scale-95 group"
                    >
                      <span className="text-xs font-black text-amber-300 group-hover:text-amber-200 block">
                        +{pkg.label}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{pkg.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input */}
              <div className="pt-2">
                <label className="text-xs font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
                  Custom Arbitrary Amount
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono font-black text-amber-200 focus:outline-none focus:border-amber-400"
                    placeholder="1000000000000"
                  />
                  <button
                    onClick={() => handleGlobalOrSelfEconomy(customAmount, 'add')}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-black text-xs rounded-xl shadow-lg active:scale-95 transition-all"
                  >
                    AIRDROP TO ALL 🚀
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: งip 3X Engine & Perks */}
        {activeTab === 'ngip_perks' && (
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
            <div className="bg-gradient-to-r from-purple-950 via-slate-950 to-amber-950 p-6 rounded-3xl border-2 border-amber-400 space-y-4">
              <div className="flex items-center gap-3">
                <NgipBadge size="lg" />
                <div>
                  <h3 className="text-lg font-black text-white">
                    งip VIP High Roller System Active
                  </h3>
                  <p className="text-xs text-amber-300">
                    Full overview of privilege perks, fast recoloring names, 3x multipliers, and exclusive games.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-400/40 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                    <span>Fast Rainbow Recoloring</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Live dynamic RGB chroma animation applied across chat messages, scoreboards, leaderboards, and lobbies.
                  </p>
                  <div className="pt-2">
                    <NgipName name="SamplePlayer" isNgip={true} className="text-sm font-black" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-400/40 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>3X Bet Multiplier</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Every bet won across ALL games automatically credits 3x the standard payout to the player's wallet.
                  </p>
                  <div className="text-xs font-mono font-bold text-amber-400 pt-2">
                    Bet: 1M ➔ Won: 3M Payout (3x)
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-400/40 space-y-2">
                  <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                    <Lock className="w-4 h-4 text-purple-400" />
                    <span>Exclusive VIP Games</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Supreme High Roller Wheel & Cyber Decryption Matrix. Completely hidden from non-งip users.
                  </p>
                  <div className="text-xs text-purple-300 font-bold pt-2">
                    2 Secret Games Live
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Live Server & Rooms */}
        {activeTab === 'server' && (
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400" />
                Active Multiplayer Rooms & Lobbies ({publicRooms.length})
              </h3>

              {publicRooms.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No active multiplayer rooms right now.</p>
              ) : (
                <div className="space-y-2">
                  {publicRooms.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                    >
                      <span className="font-bold text-white">{r.name}</span>
                      <span className="text-slate-400">
                        {r.playersCount}/{r.maxPlayers} Players • {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Deep Edit User Currencies & Stats */}
        {editingUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-slate-900 border-2 border-amber-400 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <AvatarRenderer avatar={editingUser.avatar} className="w-8 h-8 rounded-lg" />
                  <span className="font-black text-white text-sm">{editingUser.username}</span>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Currency Selector */}
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block uppercase">Select Currency</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['diamond', 'amethyst', 'jade', 'ruby'] as CurrencyType[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setEditUserSelectedCurr(c)}
                      className={`p-2 rounded-xl border text-xs font-bold ${
                        editUserSelectedCurr === c
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {CURRENCY_CONFIG[c].symbol} {CURRENCY_CONFIG[c].name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block uppercase">Amount</label>
                <input
                  type="text"
                  value={editUserCustomAmount}
                  onChange={(e) => setEditUserCustomAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-200 focus:outline-none focus:border-amber-400"
                />
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <button
                    onClick={() => handleApplyUserCurrencyModal('add')}
                    className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
                  >
                    + Add
                  </button>
                  <button
                    onClick={() => handleApplyUserCurrencyModal('sub')}
                    className="py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl"
                  >
                    - Deduct
                  </button>
                  <button
                    onClick={() => handleApplyUserCurrencyModal('set')}
                    className="py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl"
                  >
                    = Set Exact
                  </button>
                </div>
              </div>

              {/* Stats edit */}
              <div className="pt-2 border-t border-slate-800">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block uppercase">Level</label>
                    <input
                      type="number"
                      value={editUserLevel}
                      onChange={(e) => setEditUserLevel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block uppercase">Score</label>
                    <input
                      type="number"
                      value={editUserScore}
                      onChange={(e) => setEditUserScore(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSaveUserModalChanges}
                  className="w-full mt-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Save Stats & Level
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
