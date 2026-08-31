import React, { useState, useEffect } from 'react';
import {
  Users,
  Play,
  PlusCircle,
  Hash,
  Search,
  Sparkles,
  Lock,
  Globe,
  RefreshCw,
  Coins,
  ChevronRight,
  ShieldCheck,
  Check,
  AlertTriangle,
  Flame,
  Palette,
  Layers,
  Bomb,
  Bot,
  Eye,
  Theater,
  Puzzle,
  Swords,
  Brain,
  SpellCheck,
  Zap,
  Keyboard,
  Music,
  Calculator,
  Building2,
  Crosshair,
} from 'lucide-react';
import {
  ArcadeGameMode,
  WordCategory,
  RoomSettings,
  CurrencyType,
  BettingConfig,
  RoomSummary,
} from '../types';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import {
  CURRENCY_CONFIG,
  getWalletKey,
  formatCompactCurrency,
  formatFullCurrency,
  BET_PRESET_PACKAGES,
  toBigInt,
} from '../utils/currencyUtils';
import { soundManager } from '../utils/soundEffects';
import { VsAiArena, AiGameConfig } from './VsAiArena';

interface LobbyProps {
  onOpenAuth?: () => void;
  currentMode?: ArcadeGameMode;
  onSelectMode?: (mode: ArcadeGameMode) => void;
  onLaunchAiGame?: (config: AiGameConfig) => void;
}

const ALL_GAME_MODES: Array<{
  id: ArcadeGameMode;
  label: string;
  icon: React.ElementType;
  badge: string;
  badgeColor: string;
}> = [
  {
    id: 'multiplayer_draw',
    label: 'Multiplayer Draw & Guess',
    icon: Palette,
    badge: 'Live Rooms',
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300',
  },
  {
    id: 'uno_party',
    label: 'UNO Party Showdown',
    icon: Layers,
    badge: 'Card Battle',
    badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300',
  },
  {
    id: 'trivia_dash',
    label: 'Trivia Dash Royale',
    icon: Brain,
    badge: 'Brain Battle',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
  },
  {
    id: 'anagram_rush',
    label: 'Word Anagram Rush',
    icon: SpellCheck,
    badge: 'Word Scramble',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
  },
  {
    id: 'bomb_chain',
    label: 'Word Bomb Chain',
    icon: Bomb,
    badge: 'Fast Action',
    badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300',
  },
  {
    id: 'emoji_charades',
    label: 'Emoji Charades',
    icon: Puzzle,
    badge: 'Pop Culture',
    badgeColor: 'bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300',
  },
  {
    id: 'ai_sketch_guess',
    label: 'AI Sketch Guesser',
    icon: Bot,
    badge: 'Neural AI',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300',
  },
  {
    id: 'speed_duel',
    label: '1v1 Canvas Speed Duel',
    icon: Swords,
    badge: '1v1 Arena',
    badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300',
  },
  {
    id: 'pixel_reveal',
    label: 'Pixel Reveal Mystery',
    icon: Eye,
    badge: 'Visual Rush',
    badgeColor: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-300',
  },
  {
    id: 'blindfold_maestro',
    label: 'Blindfold Maestro',
    icon: Theater,
    badge: 'Party Stage',
    badgeColor: 'bg-pink-100 text-pink-700 dark:bg-pink-900/60 dark:text-pink-300',
  },
  {
    id: 'sound_mystery',
    label: 'Sound & Audio Mystery',
    icon: Music,
    badge: 'Audio Game',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300',
  },
  {
    id: 'reflex_neon',
    label: 'Reflex Neon Blitz',
    icon: Zap,
    badge: 'Reflex Speed',
    badgeColor: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-300',
  },
  {
    id: 'color_clash',
    label: 'Color Clash Matrix',
    icon: Crosshair,
    badge: 'Stroop Reflex',
    badgeColor: 'bg-pink-100 text-pink-700 dark:bg-pink-900/60 dark:text-pink-300',
  },
  {
    id: 'cyber_typing',
    label: 'Cyber Typing Rush',
    icon: Keyboard,
    badge: 'WPM Duel',
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300',
  },
  {
    id: 'math_sprint',
    label: 'Math Sprint 60s',
    icon: Calculator,
    badge: 'Mental Math',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
  },
  {
    id: 'tower_stack',
    label: 'Cyber Tower Stacker',
    icon: Building2,
    badge: 'Stacking',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300',
  },
];

export const Lobby: React.FC<LobbyProps> = ({
  onOpenAuth,
  currentMode = 'multiplayer_draw',
  onSelectMode,
  onLaunchAiGame,
}) => {
  const { quickJoin, createRoom, joinRoom, publicRooms, fetchPublicRooms, errorMessage, clearError } = useGame();
  const { user, placeBet } = useAuth();

  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomSearch, setRoomSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [joinBetError, setJoinBetError] = useState<string | null>(null);

  // Create Room State Form
  const [selectedGameMode, setSelectedGameMode] = useState<ArcadeGameMode>('multiplayer_draw');
  const [roomName, setRoomName] = useState('');
  const [roundDuration, setRoundDuration] = useState<number>(60);
  const [maxRounds, setMaxRounds] = useState<number>(3);
  const [maxPlayers, setMaxPlayers] = useState<number>(8);
  const [wordCategory, setWordCategory] = useState<WordCategory>('all');
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowHints, setAllowHints] = useState(true);
  const [enableBots, setEnableBots] = useState(false);

  // Betting state for Create Room (Room Owner Choice)
  const [enableBetting, setEnableBetting] = useState<boolean>(false);
  const [betCurrency, setBetCurrency] = useState<CurrencyType>('diamond');
  const [betAmount, setBetAmount] = useState<string>('100000'); // 100K default
  const [betError, setBetError] = useState<string | null>(null);

  // Auto-fill room code from URL query parameter ?room=CODE
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomCodeInput(roomParam.toUpperCase());
    }
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPublicRooms();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    setJoinBetError(null);
    joinRoom(roomCodeInput.trim().toUpperCase());
  };

  // Safe Room Joining with Room Owner's Locked Currency Enforcement
  const handleJoinPublicRoom = (r: RoomSummary) => {
    setJoinBetError(null);

    // If room has betting enabled, player MUST bet the exact currency specified by the room owner!
    if (r.betting && r.betting.enabled) {
      const lockedCurrency = r.betting.currency;
      const requiredAmount = r.betting.amount;
      const key = getWalletKey(lockedCurrency);
      const userBalance = user?.wallet?.[key] || '0';

      const userBalBi = toBigInt(userBalance);
      const reqAmountBi = toBigInt(requiredAmount);

      if (userBalBi < reqAmountBi) {
        setJoinBetError(
          `Cannot join "${r.name}": Room host set a mandatory bet of ${formatCompactCurrency(
            requiredAmount
          )} ${CURRENCY_CONFIG[lockedCurrency].name}. Your ${CURRENCY_CONFIG[lockedCurrency].name} balance is ${formatCompactCurrency(
            userBalance
          )}.`
        );
        soundManager.playError();
        return;
      }

      // Deduct bet from joining player's balance
      const placed = placeBet(lockedCurrency, requiredAmount);
      if (!placed) {
        setJoinBetError('Failed to place bet for this room. Please verify your balance.');
        return;
      }
    }

    soundManager.playButton();
    joinRoom(r.code);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBetError(null);

    let bettingConfig: BettingConfig = {
      enabled: false,
      currency: 'diamond',
      amount: '0',
      totalPot: '0',
    };

    if (enableBetting) {
      const biAmount = toBigInt(betAmount);
      if (biAmount <= 0n) {
        setBetError('Bet amount must be greater than 0');
        return;
      }

      // Check if room owner has sufficient funds in their chosen currency
      const userBalance = user?.wallet?.[getWalletKey(betCurrency)] || '0';
      if (toBigInt(userBalance) < biAmount) {
        setBetError(
          `Insufficient ${CURRENCY_CONFIG[betCurrency].name} balance. You have ${formatCompactCurrency(
            userBalance
          )}, but bet is ${formatCompactCurrency(betAmount)}.`
        );
        return;
      }

      // Deduct bet from room creator's wallet
      const success = placeBet(betCurrency, betAmount);
      if (!success) {
        setBetError('Failed to place bet. Insufficient funds.');
        return;
      }

      // Lock room to creator's chosen currency
      bettingConfig = {
        enabled: true,
        currency: betCurrency,
        amount: betAmount,
        totalPot: betAmount,
      };
    }

    const settings: RoomSettings = {
      roundDuration,
      maxRounds,
      maxPlayers,
      wordCategory,
      customWords: [],
      isPrivate,
      allowHints,
      botPlayersEnabled: enableBots,
      gameMode: selectedGameMode,
      betting: bettingConfig,
    };

    createRoom(settings, roomName.trim() || `${user?.username || 'Player'}'s Arena`);
    setShowCreateModal(false);
  };

  const filteredRooms = publicRooms.filter(
    (r) =>
      r.name.toLowerCase().includes(roomSearch.toLowerCase()) ||
      r.code.toLowerCase().includes(roomSearch.toLowerCase())
  );

  const currencies: CurrencyType[] = ['diamond', 'amethyst', 'jade', 'ruby'];
  const userBalance = user?.wallet?.[getWalletKey(betCurrency)] || '0';

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-6 sm:space-y-8 animate-fade-in w-full">
      {/* Error Alert if any */}
      {(errorMessage || joinBetError) && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center justify-between gap-3 text-rose-800 dark:text-rose-200 text-xs font-semibold animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{joinBetError || errorMessage}</span>
          </div>
          <button
            onClick={() => {
              setJoinBetError(null);
              clearError();
            }}
            className="text-rose-600 dark:text-rose-400 hover:underline text-xs shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MATCHMAKING & ROOM ACTIONS (JOIN CODE / QUICK MATCH / CREATE ROOM)     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Col: Join Room with Code + Quick Match & Create Room */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Hash className="w-4 h-4 text-indigo-600" />
              <span>Join via Room Code</span>
            </h3>
            <p className="text-xs text-slate-500">
              Entering a private game or direct room? Enter the 5 or 6-character room code below.
            </p>
          </div>

          <form onSubmit={handleJoinWithCode} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="ROOM CODE (e.g. AB12CD)"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                maxLength={8}
                className="w-full pl-3 pr-3 py-2.5 text-xs font-mono font-bold tracking-widest uppercase bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={!roomCodeInput.trim()}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs shrink-0 cursor-pointer"
            >
              Enter Room
            </button>
          </form>

          {/* Quick Match & Create Room Buttons */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Matchmaking & Arena Creation
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={quickJoin}
                className="w-full py-3 px-4 rounded-2xl text-xs font-extrabold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Quick Match Now</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedGameMode(currentMode);
                  setIsPrivate(false);
                  setShowCreateModal(true);
                }}
                className="w-full py-3 px-4 rounded-2xl text-xs font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Custom Room & Bets</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Public Game Lobbies (Prominently featured on main screen) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-3.5 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Public Game Lobbies</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {publicRooms.length} active
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Sync
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Browse multiplayer rooms, view locked currency stakes, and join with one click!
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-44">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter rooms..."
                  value={roomSearch}
                  onChange={(e) => setRoomSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                title="Refresh Lobbies"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {filteredRooms.length === 0 ? (
            <div className="text-center py-7 sm:py-9 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5 my-auto">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-500 flex items-center justify-center mx-auto">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No active public lobbies found
                </p>
                <p className="text-xs text-slate-400">
                  Be the first to create an arena or start quick match matchmaking!
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedGameMode(currentMode);
                  setShowCreateModal(true);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create First Room</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
              {filteredRooms.map((r) => {
                const hasBet = r.betting && r.betting.enabled;
                const betCurrMeta = hasBet ? CURRENCY_CONFIG[r.betting!.currency] : null;

                return (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-700 transition-all flex flex-col justify-between gap-2.5 group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1 font-mono text-[11px] font-black tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                          <span>#{r.code}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {r.isPrivate ? (
                            <span className="p-1 rounded-lg bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 text-[10px] font-bold flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              <span>Private</span>
                            </span>
                          ) : (
                            <span className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              <span>Public</span>
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                            {r.playerCount}/{r.maxPlayers}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                          {r.name}
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          Host:{' '}
                          <strong className="text-slate-700 dark:text-slate-300">{r.hostName}</strong>
                        </p>
                      </div>

                      {/* Betting currency badge */}
                      {hasBet && betCurrMeta && (
                        <div
                          className={`p-1.5 rounded-xl text-[11px] font-bold border flex items-center justify-between ${betCurrMeta.bgColor} ${betCurrMeta.borderColor}`}
                        >
                          <div className="flex items-center gap-1">
                            <span>{betCurrMeta.symbol}</span>
                            <span className={`text-[10px] font-black ${betCurrMeta.textColor}`}>
                              {betCurrMeta.name}
                            </span>
                          </div>
                          <span className="font-mono font-black text-slate-900 dark:text-white text-[10px]">
                            {formatCompactCurrency(r.betting!.amount)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">
                        R{r.currentRound}/{r.maxRounds} • {r.roundDuration}s
                      </span>
                      <button
                        type="button"
                        onClick={() => handleJoinPublicRoom(r)}
                        className="px-3 py-1 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                      >
                        <span>Join</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DEDICATED VS AI ARCADE ARENA SECTION (CLEAN & PROFESSIONAL)             */}
      {/* ========================================================================= */}
      <VsAiArena
        onLaunchGame={(config) => {
          if (onLaunchAiGame) {
            onLaunchAiGame(config);
          } else if (onSelectMode) {
            onSelectMode(config.mode);
          }
        }}
      />

      {/* ========================================================================= */}
      {/* 4. CREATE CUSTOM ROOM MODAL (ROOM OWNER CHOOSES CURRENCY)                  */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Create Custom Room
                </h3>
                <p className="text-xs text-slate-500">
                  Select game mode, privacy, and set mandatory betting stakes for your arena.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              {/* 1. Game Mode Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Select Game Mode
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {ALL_GAME_MODES.map((g) => {
                    const GIcon = g.icon;
                    const isSelected = selectedGameMode === g.id;
                    return (
                      <button
                        type="button"
                        key={g.id}
                        onClick={() => setSelectedGameMode(g.id)}
                        className={`p-2 rounded-xl text-left border flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-900 dark:text-indigo-200 font-bold'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <GIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[11px] font-bold truncate">{g.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Room Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Room Name</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder={`${user?.username || 'Player'}'s Arena`}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 3. Room Owner Currency Betting Choice */}
              <div className="p-3 bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-800/50 dark:to-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <div>
                      <span className="font-extrabold text-slate-900 dark:text-white block">
                        Currency Betting Stakes
                      </span>
                      <span className="text-[10px] text-slate-400">
                        You choose the currency; all joining players match in this currency.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableBetting((prev) => !prev)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-black cursor-pointer transition-all ${
                      enableBetting
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {enableBetting ? '🔥 Betting ENABLED' : 'Casual (No Bet)'}
                  </button>
                </div>

                {enableBetting && (
                  <div className="space-y-2.5 pt-1 animate-fade-in">
                    {/* Choose Currency */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Select Currency (Room Lock):
                        </span>
                        <span className="text-slate-400">
                          Your Balance:{' '}
                          <strong className="text-slate-700 dark:text-slate-200">
                            {formatCompactCurrency(userBalance)}
                          </strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5">
                        {currencies.map((c) => {
                          const meta = CURRENCY_CONFIG[c];
                          const isSel = betCurrency === c;
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setBetCurrency(c)}
                              className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                                isSel
                                  ? `${meta.bgColor} ${meta.borderColor} ring-2 ring-indigo-500/30 shadow-xs`
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <div className="text-sm">{meta.symbol}</div>
                              <div className={`text-[10px] font-black truncate ${meta.textColor}`}>
                                {meta.name}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Bet Presets */}
                    <div className="space-y-1">
                      <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                        Preset Bet Chips:
                      </span>
                      <div className="grid grid-cols-4 gap-1">
                        {BET_PRESET_PACKAGES.slice(0, 4).map((pack) => (
                          <button
                            key={pack.label}
                            type="button"
                            onClick={() => setBetAmount(pack.amount)}
                            className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer truncate ${
                              betAmount === pack.amount
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50'
                            }`}
                          >
                            {pack.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom BigInt Bet Input */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300 text-[11px] flex items-center justify-between">
                        <span>Custom Bet Amount:</span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                          = {formatCompactCurrency(betAmount)} {CURRENCY_CONFIG[betCurrency].name}
                        </span>
                      </label>
                      <input
                        type="text"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="e.g. 1000000"
                        className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-[9px] text-slate-400 truncate">
                        Full: {formatFullCurrency(betAmount)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Round Duration & Counts */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Time per Round</label>
                  <div className="grid grid-cols-3 gap-1">
                    {[30, 60, 80].map((sec) => (
                      <button
                        type="button"
                        key={sec}
                        onClick={() => setRoundDuration(sec)}
                        className={`py-1.5 rounded-xl font-bold border transition-all cursor-pointer text-center ${
                          roundDuration === sec
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Rounds</label>
                  <div className="grid grid-cols-3 gap-1">
                    {[2, 3, 5].map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setMaxRounds(r)}
                        className={`py-1.5 rounded-xl font-bold border transition-all cursor-pointer text-center ${
                          maxRounds === r
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Room Privacy Choice (Public vs Private) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Room Visibility & Access
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setIsPrivate(false)}
                    className={`p-2.5 rounded-2xl border cursor-pointer transition-all ${
                      !isPrivate
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                        : 'bg-slate-100/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-0.5">
                      <span>🌐 Public Room</span>
                      {!isPrivate && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      Visible in Public Lobbies for anyone to join
                    </p>
                  </div>

                  <div
                    onClick={() => setIsPrivate(true)}
                    className={`p-2.5 rounded-2xl border cursor-pointer transition-all ${
                      isPrivate
                        ? 'bg-purple-50/80 dark:bg-purple-950/50 border-purple-500 text-purple-950 dark:text-purple-200 ring-2 ring-purple-500/20'
                        : 'bg-slate-100/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-0.5">
                      <span>🔒 Private Room</span>
                      {isPrivate && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      Only players with the room code can join
                    </p>
                  </div>
                </div>
              </div>

              {/* Bot Players & Solo Practice Toggle */}
              <div
                onClick={() => setEnableBots(!enableBots)}
                className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                  enableBots
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 text-indigo-950 dark:text-indigo-200'
                    : 'bg-slate-100/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <span>🤖 Allow AI Bot Companions (Optional)</span>
                    {enableBots && <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-extrabold">Allowed</span>}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Gives the host the option to add AI bots inside the room lobby
                  </p>
                </div>
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                    enableBots ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      enableBots ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {betError && (
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 p-2 bg-rose-50 dark:bg-rose-950/60 rounded-xl border border-rose-200 dark:border-rose-800">
                  {betError}
                </p>
              )}

              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-2xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-2xl font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  Create & Launch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
