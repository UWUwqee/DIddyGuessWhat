import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, PlayerStats, FirebaseConfig, CurrencyType, UserWallet, PlayerActivity } from '../types';
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  ensureAnonymousAuth,
  logoutFirebase,
  saveProfileToFirestore,
  fetchProfileFromFirestore,
  subscribeToUserProfile,
  fetchAllUsersFromFirestore,
  subscribeToAllUsersFromFirestore,
  adminUpdateUserProfileInFirestore,
  isFirebaseConfigured,
  getFirebaseAuth,
  initFirebaseService,
  logActivityToFirestore,
  subscribeToFirestoreActivities,
} from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { PRESET_AVATARS } from '../utils/avatarIcons';
import {
  INITIAL_DEFAULT_WALLET,
  addCurrency,
  subCurrency,
  getWalletKey,
  toBigInt,
  CURRENCY_CONFIG,
  formatCompactCurrency,
} from '../utils/currencyUtils';
import { soundManager } from '../utils/soundEffects';

const STORAGE_KEY_USER = 'guess_what_current_user';
export const ADMIN_EMAILS = [
  'kyledesillarico@gmail.com',
  'kyledesillarico1014@gmail.com',
  'desillakyle@gmail.com',
  'desillaricokyle@gmail.com',
  'franklinkyleluzano@gmail.com',
];
export const NGIP_DAILY_SALARY_AMOUNT = '100000'; // 100,000 for each currency
export const SALARY_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 Hours in ms

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isFirebaseConnected: boolean;
  isAdmin: boolean;
  isNgip: boolean;
  canClaimNgipSalary: boolean;
  ngipSalaryTimeRemaining: number;
  claimNgipDailySalary: () => Promise<{ success: boolean; message: string }>;
  darkMode: boolean;
  toggleDarkMode: (explicitVal?: boolean) => void;
  activities: PlayerActivity[];
  allRegisteredUsers: UserProfile[];
  connectCustomFirebase: (config: FirebaseConfig) => boolean;
  loginGuest: (username: string, avatar: string, color?: string) => void;
  loginWithFirebaseGoogle: () => Promise<void>;
  loginWithFirebaseEmail: (email: string, pass: string) => Promise<void>;
  registerWithFirebaseEmail: (email: string, pass: string, username: string, avatar?: string, color?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateStats: (statDelta: Partial<PlayerStats>, wonGame?: boolean, gameTitle?: string) => void;
  logPlayerActivity: (activity: Omit<PlayerActivity, 'id' | 'userId' | 'username' | 'avatar' | 'timestamp'>) => void;
  updateAvatar: (avatar: string, color?: string) => void;
  updateUsername: (username: string) => void;
  updateWallet: (currency: CurrencyType, amount: string | number | bigint, op?: 'add' | 'sub' | 'set') => void;
  placeBet: (currency: CurrencyType, amount: string | number | bigint) => boolean;
  winBetReward: (currency: CurrencyType, amount: string | number | bigint, gameTitle?: string) => { amountWon: string; multiplier: number };
  grantCurrenciesToUser: (currency: CurrencyType, amount: string | number | bigint, targetUserId?: string) => void;
  reduceCurrencies: (currency: CurrencyType, amount: string | number | bigint) => void;
  airdropCurrenciesGlobally: (currency: CurrencyType, amount: string | number | bigint) => void;
  overrideStats: (newStats: Partial<PlayerStats>, newLevel?: number, newXp?: number) => void;
  resetUserStats: () => void;
  unlockAllAchievements: () => void;
  toggleAdminRole: () => void;
  toggleUserNgip: (targetUserId: string, ngipState: boolean) => Promise<void>;
  adminModifyOtherUserWallet: (targetUserId: string, currency: CurrencyType, amount: string | number | bigint, op: 'add' | 'sub' | 'set') => Promise<void>;
  adminOverrideOtherUserStats: (targetUserId: string, newStats: Partial<PlayerStats>, level?: number) => Promise<void>;
}

const DEFAULT_AVATARS = PRESET_AVATARS.map((a) => a.id);
const DEFAULT_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export const AVATAR_OPTIONS = DEFAULT_AVATARS;
export const COLOR_OPTIONS = DEFAULT_COLORS;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeWallet(w?: Partial<UserWallet>): UserWallet {
  return {
    diamonds: w?.diamonds || INITIAL_DEFAULT_WALLET.diamonds,
    amethysts: w?.amethysts || INITIAL_DEFAULT_WALLET.amethysts,
    jades: w?.jades || INITIAL_DEFAULT_WALLET.jades,
    rubies: w?.rubies || INITIAL_DEFAULT_WALLET.rubies,
  };
}

function normalizeStats(s?: Partial<PlayerStats>): PlayerStats {
  const stats: PlayerStats = {
    gamesPlayed: s?.gamesPlayed || 0,
    wins: s?.wins || 0,
    totalScore: s?.totalScore || 0,
    wordsGuessed: s?.wordsGuessed || 0,
    drawingsCompleted: s?.drawingsCompleted || 0,
    highestRoundScore: s?.highestRoundScore || 0,
    totalBetsWon: s?.totalBetsWon ? String(s.totalBetsWon) : '0',
    totalBetsPlaced: s?.totalBetsPlaced ? String(s.totalBetsPlaced) : '0',
    bombsDefused: s?.bombsDefused || 0,
    pixelsGuessed: s?.pixelsGuessed || 0,
    blindfoldScores: s?.blindfoldScores || 0,
    unoWins: s?.unoWins || 0,
    unoCardsPlayed: s?.unoCardsPlayed || 0,
  };
  if (typeof s?.fastestGuessSec === 'number' && !isNaN(s.fastestGuessSec)) {
    stats.fastestGuessSec = s.fastestGuessSec;
  }
  if (typeof s?.aiDrawsBeaten === 'number') stats.aiDrawsBeaten = s.aiDrawsBeaten;
  if (typeof s?.emojiPuzzlesSolved === 'number') stats.emojiPuzzlesSolved = s.emojiPuzzlesSolved;
  if (typeof s?.memoryStarsEarned === 'number') stats.memoryStarsEarned = s.memoryStarsEarned;
  if (typeof s?.duelsWon === 'number') stats.duelsWon = s.duelsWon;
  if (typeof s?.soundsIdentified === 'number') stats.soundsIdentified = s.soundsIdentified;
  if (typeof s?.reflexCombosHit === 'number') stats.reflexCombosHit = s.reflexCombosHit;
  return stats;
}

function normalizeUserProfile(p: Partial<UserProfile> & { id: string; username: string }): UserProfile {
  const stats = normalizeStats(p.stats);
  const xp = typeof p.xp === 'number' ? p.xp : stats.totalScore || 0;
  const level = p.level && p.level > 0 ? p.level : Math.max(1, Math.floor(xp / 600) + 1);
  const badges = Array.isArray(p.unlockedBadges) && p.unlockedBadges.length > 0 ? p.unlockedBadges : ['Newbie Artist'];
  const wallet = normalizeWallet(p.wallet);
  const email = p.email || undefined;
  
  // OWNER IS EXCLUSIVELY franklinkyleluzano@gmail.com
  const isOwnerEmail = Boolean(email && ADMIN_EMAILS.includes(email.toLowerCase()));
  const isAdmin = Boolean((p.isAdmin && isOwnerEmail) || isOwnerEmail);
  
  // Newly registered users do NOT get งip unless explicitly granted in Firestore (p.isNgip === true) or owner email
  const isNgip = Boolean(isOwnerEmail || p.isNgip === true);
  const darkMode = typeof p.darkMode === 'boolean' ? p.darkMode : true;

  const profile: UserProfile = {
    id: p.id,
    username: p.username || 'Player',
    avatar: p.avatar || DEFAULT_AVATARS[0],
    color: p.color || DEFAULT_COLORS[0],
    createdAt: p.createdAt || new Date().toISOString(),
    stats,
    level,
    xp,
    unlockedBadges: badges,
    wallet,
    isAdmin,
    isNgip,
    darkMode,
  };

  if (p.email) {
    profile.email = p.email;
  }
  if (p.lastNgipSalaryClaim) {
    profile.lastNgipSalaryClaim = p.lastNgipSalaryClaim;
  }

  return profile;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<PlayerActivity[]>([]);
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

  // Initialize Dark Mode: check localStorage or default to true (Y2K Gothic Dark Mode)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const savedMode = localStorage.getItem('guess_what_dark_mode');
      if (savedMode !== null) return savedMode === 'true';
    } catch {
      // ignore
    }
    return true;
  });

  // Apply dark mode class to HTML / body elements
  const applyDarkModeToDOM = (isDark: boolean) => {
    if (typeof document !== 'undefined') {
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    }
  };

  // Sync DOM whenever darkMode state changes
  useEffect(() => {
    applyDarkModeToDOM(darkMode);
  }, [darkMode]);

  // Toggle or explicitly set dark mode, and persist to user profile in Firestore
  const toggleDarkMode = (explicitVal?: boolean) => {
    const nextMode = typeof explicitVal === 'boolean' ? explicitVal : !darkMode;
    setDarkMode(nextMode);
    applyDarkModeToDOM(nextMode);
    try {
      localStorage.setItem('guess_what_dark_mode', String(nextMode));
    } catch (e) {
      console.warn('LocalStorage darkmode save issue', e);
    }
    if (user) {
      const updated: UserProfile = {
        ...user,
        darkMode: nextMode,
      };
      saveUser(updated);
    }
  };

  // Check if current user is owner/admin
  const isAdmin = Boolean(
    user?.isAdmin ||
    (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()))
  );

  const isNgip = Boolean(user?.isNgip || isAdmin);

  // 24-Hour Daily Ngip Salary Calculation
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const ngipSalaryTimeRemaining = React.useMemo(() => {
    if (!isNgip) return SALARY_COOLDOWN_MS;
    if (!user?.lastNgipSalaryClaim) return 0;
    const lastClaim = new Date(user.lastNgipSalaryClaim).getTime();
    if (isNaN(lastClaim)) return 0;
    const elapsed = currentTime - lastClaim;
    return Math.max(0, SALARY_COOLDOWN_MS - elapsed);
  }, [isNgip, user?.lastNgipSalaryClaim, currentTime]);

  const canClaimNgipSalary = Boolean(isNgip && ngipSalaryTimeRemaining <= 0);

  const claimNgipDailySalary = async (): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: 'You must be logged in to claim.' };
    }
    if (!isNgip) {
      return { success: false, message: 'Exclusive to งip VIP members. Upgrade to unlock 100K daily salary!' };
    }
    if (!canClaimNgipSalary) {
      const hours = Math.floor(ngipSalaryTimeRemaining / (1000 * 60 * 60));
      const mins = Math.floor((ngipSalaryTimeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((ngipSalaryTimeRemaining % (1000 * 60)) / 1000);
      return {
        success: false,
        message: `24-hour cooldown active. Next 100k claim available in ${hours}h ${mins}m ${secs}s.`,
      };
    }

    const currWallet = normalizeWallet(user.wallet);
    const updatedWallet: UserWallet = {
      diamonds: addCurrency(currWallet.diamonds, NGIP_DAILY_SALARY_AMOUNT),
      amethysts: addCurrency(currWallet.amethysts, NGIP_DAILY_SALARY_AMOUNT),
      jades: addCurrency(currWallet.jades, NGIP_DAILY_SALARY_AMOUNT),
      rubies: addCurrency(currWallet.rubies, NGIP_DAILY_SALARY_AMOUNT),
    };

    const updatedUser: UserProfile = {
      ...user,
      wallet: updatedWallet,
      lastNgipSalaryClaim: new Date().toISOString(),
    };

    saveUser(updatedUser);

    logPlayerActivity({
      type: 'wager_won',
      title: '👑 Claimed 100K Daily งip Salary',
      description: `${user.username} received +100,000 Diamonds, Amethysts, Jades & Rubies!`,
      pointsEarned: 500,
    });

    soundManager.playVictory();
    return {
      success: true,
      message: '🎉 Successfully claimed +100,000 for ALL 4 currencies! Next reward ready in 24 hours.',
    };
  };

  useEffect(() => {
    setIsFirebaseConnected(isFirebaseConfigured());

    // 1. Subscribe to live global activities
    const unsubActivities = subscribeToFirestoreActivities((liveActs) => {
      if (liveActs && liveActs.length > 0) {
        setActivities(liveActs);
      }
    });

    // 2. Subscribe to all registered/active user accounts for admin panel
    const unsubUsers = subscribeToAllUsersFromFirestore((liveUsers) => {
      if (liveUsers && liveUsers.length > 0) {
        setAllRegisteredUsers(liveUsers.map(normalizeUserProfile));
      }
    });

    // 3. Load saved user profile from localStorage immediately
    let initialUser: UserProfile | null = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          const normalized = normalizeUserProfile(parsed);
          initialUser = normalized;
          setUser(normalized);
          if (typeof normalized.darkMode === 'boolean') {
            setDarkMode(normalized.darkMode);
            applyDarkModeToDOM(normalized.darkMode);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load user from localStorage', e);
    } finally {
      setIsLoading(false);
    }

    let unsubRealtimeProfile: (() => void) | null = null;

    // 4. Bind Firebase auth listener for instant real-time synchronization
    const auth = getFirebaseAuth();
    if (auth) {
      const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          setIsFirebaseConnected(true);

          // Real-time live profile subscription: unlocks perks IMMEDIATELY without page refresh when admin grants งip!
          if (unsubRealtimeProfile) unsubRealtimeProfile();
          unsubRealtimeProfile = subscribeToUserProfile(fbUser.uid, (cloudDoc) => {
            if (cloudDoc) {
              const normalized = normalizeUserProfile({
                ...cloudDoc,
                id: fbUser.uid,
                email: fbUser.email || cloudDoc.email,
                username: cloudDoc.username || fbUser.displayName || 'Player',
              });
              setUser(normalized);
              try {
                localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(normalized));
              } catch (e) {
                console.warn(e);
              }
              if (typeof normalized.darkMode === 'boolean') {
                setDarkMode(normalized.darkMode);
                applyDarkModeToDOM(normalized.darkMode);
              }
            }
          });

          const cloudProfile = await fetchProfileFromFirestore(fbUser.uid);
          if (cloudProfile) {
            const normalizedCloud = normalizeUserProfile({
              ...cloudProfile,
              id: fbUser.uid,
              email: fbUser.email || cloudProfile.email,
              username: cloudProfile.username || fbUser.displayName || 'Player',
            });
            setUser(normalizedCloud);
            if (typeof normalizedCloud.darkMode === 'boolean') {
              setDarkMode(normalizedCloud.darkMode);
              applyDarkModeToDOM(normalizedCloud.darkMode);
              try {
                localStorage.setItem('guess_what_dark_mode', String(normalizedCloud.darkMode));
              } catch (e) {
                console.warn(e);
              }
            }
            try {
              localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(normalizedCloud));
            } catch (e) {
              console.warn('LocalStorage error saving cloud profile', e);
            }
          } else if (initialUser) {
            // Cloud profile not initialized yet for this account: sync local profile to cloud!
            const merged: UserProfile = normalizeUserProfile({
              ...initialUser,
              id: fbUser.uid,
              email: fbUser.email || initialUser.email,
              username: fbUser.displayName || initialUser.username,
              avatar: initialUser.avatar || fbUser.photoURL || DEFAULT_AVATARS[0],
            });
            setUser(merged);
            if (typeof merged.darkMode === 'boolean') {
              setDarkMode(merged.darkMode);
              applyDarkModeToDOM(merged.darkMode);
            }
            try {
              localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(merged));
            } catch (e) {
              console.warn('LocalStorage error', e);
            }
            saveProfileToFirestore(merged);
          }
        } else {
          if (unsubRealtimeProfile) {
            unsubRealtimeProfile();
            unsubRealtimeProfile = null;
          }
          // Attempt anonymous auth if user is a guest so Firestore permissions work seamlessly
          ensureAnonymousAuth().catch((err) => console.warn('Anonymous auth note:', err));
        }
      });
      return () => {
        unsubscribeAuth();
        if (unsubRealtimeProfile) unsubRealtimeProfile();
        unsubActivities();
        unsubUsers();
      };
    }

    return () => {
      unsubActivities();
      unsubUsers();
    };
  }, []);

  const saveUser = (newUser: UserProfile) => {
    const normalized = normalizeUserProfile(newUser);
    setUser(normalized);

    // Synchronize local registered users list immediately so UI & Admin Panel reflect instant updates
    setAllRegisteredUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === normalized.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = normalized;
        return next;
      }
      return [normalized, ...prev];
    });

    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(normalized));
    } catch (e) {
      console.warn('LocalStorage quota or serialization issue:', e);
    }
    if (isFirebaseConfigured()) {
      saveProfileToFirestore(normalized);
    }
  };

  const logPlayerActivity = (activityData: Omit<PlayerActivity, 'id' | 'userId' | 'username' | 'avatar' | 'timestamp'>) => {
    if (!user) return;
    const newAct: PlayerActivity = {
      ...activityData,
      id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      timestamp: new Date().toISOString(),
    };

    // Optimistically prepend to activities state
    setActivities((prev) => [newAct, ...prev.filter((a) => a.id !== newAct.id)].slice(0, 50));

    // Save to Firestore
    logActivityToFirestore(newAct);
  };

  const updateStats = (statDelta: Partial<PlayerStats>, wonGame: boolean = false, gameTitle?: string) => {
    if (!user) return;
    const prev = user.stats || {
      gamesPlayed: 0,
      wins: 0,
      totalScore: 0,
      wordsGuessed: 0,
      drawingsCompleted: 0,
      highestRoundScore: 0,
      totalBetsWon: '0',
      totalBetsPlaced: '0',
    };

    const deltaGames = statDelta.gamesPlayed !== undefined ? statDelta.gamesPlayed : 1;
    const deltaWins = wonGame ? 1 : (statDelta.wins || 0);
    const addedScore = statDelta.totalScore || 0;

    const newStats: PlayerStats = {
      gamesPlayed: (prev.gamesPlayed || 0) + deltaGames,
      wins: (prev.wins || 0) + deltaWins,
      totalScore: (prev.totalScore || 0) + addedScore,
      wordsGuessed: (prev.wordsGuessed || 0) + (statDelta.wordsGuessed || 0),
      drawingsCompleted: (prev.drawingsCompleted || 0) + (statDelta.drawingsCompleted || 0),
      highestRoundScore: Math.max(prev.highestRoundScore || 0, statDelta.highestRoundScore || addedScore || 0),
      totalBetsWon: statDelta.totalBetsWon
        ? addCurrency(prev.totalBetsWon || '0', statDelta.totalBetsWon)
        : prev.totalBetsWon || '0',
      totalBetsPlaced: statDelta.totalBetsPlaced
        ? addCurrency(prev.totalBetsPlaced || '0', statDelta.totalBetsPlaced)
        : prev.totalBetsPlaced || '0',
      bombsDefused: (prev.bombsDefused || 0) + (statDelta.bombsDefused || 0),
      pixelsGuessed: (prev.pixelsGuessed || 0) + (statDelta.pixelsGuessed || 0),
      blindfoldScores: Math.max(prev.blindfoldScores || 0, statDelta.blindfoldScores || 0),
      unoWins: (prev.unoWins || 0) + (statDelta.unoWins || 0),
      unoCardsPlayed: (prev.unoCardsPlayed || 0) + (statDelta.unoCardsPlayed || 0),
    };

    const bestFastest = typeof statDelta.fastestGuessSec === 'number'
      ? (typeof prev.fastestGuessSec === 'number' ? Math.min(prev.fastestGuessSec, statDelta.fastestGuessSec) : statDelta.fastestGuessSec)
      : prev.fastestGuessSec;
    if (typeof bestFastest === 'number' && !isNaN(bestFastest)) {
      newStats.fastestGuessSec = bestFastest;
    }

    const newXp = (user.xp || 0) + addedScore;
    const oldLevel = user.level || 1;
    const newLevel = Math.max(1, Math.floor(newXp / 600) + 1);

    // Badges calculation
    const badges = [...(user.unlockedBadges || [])];
    const newlyUnlocked: string[] = [];
    if (newStats.wordsGuessed >= 10 && !badges.includes('Sharp Guesser')) { badges.push('Sharp Guesser'); newlyUnlocked.push('Sharp Guesser'); }
    if (newStats.wordsGuessed >= 50 && !badges.includes('Word Prodigy')) { badges.push('Word Prodigy'); newlyUnlocked.push('Word Prodigy'); }
    if (newStats.wins >= 5 && !badges.includes('Champion')) { badges.push('Champion'); newlyUnlocked.push('Champion'); }
    if (newStats.drawingsCompleted >= 10 && !badges.includes('Master Artist')) { badges.push('Master Artist'); newlyUnlocked.push('Master Artist'); }
    if (newStats.highestRoundScore >= 300 && !badges.includes('Lightning Speed')) { badges.push('Lightning Speed'); newlyUnlocked.push('Lightning Speed'); }
    if ((newStats.unoWins || 0) >= 3 && !badges.includes('UNO Master')) { badges.push('UNO Master'); newlyUnlocked.push('UNO Master'); }

    const updatedUser: UserProfile = {
      ...user,
      stats: newStats,
      xp: newXp,
      level: newLevel,
      unlockedBadges: badges,
    };

    saveUser(updatedUser);

    // Global Activity Logging
    if (wonGame) {
      logPlayerActivity({
        type: 'match_win',
        title: `Match Victory in ${gameTitle || 'Arcade Arena'}!`,
        description: `${user.username} emerged victorious (+${addedScore || 100} EXP)`,
        gameMode: gameTitle || 'Multiplayer Match',
        pointsEarned: addedScore || 100,
      });
    } else if (addedScore > 0) {
      logPlayerActivity({
        type: 'game_played',
        title: `Played ${gameTitle || 'Match'}`,
        description: `${user.username} scored ${addedScore} Points and gained EXP!`,
        gameMode: gameTitle || 'Game',
        pointsEarned: addedScore,
      });
    }

    if (newLevel > oldLevel) {
      logPlayerActivity({
        type: 'level_up',
        title: `Level Up! Reached Level ${newLevel}`,
        description: `${user.username} ranked up to Level ${newLevel}!`,
        pointsEarned: 300,
      });
    }

    for (const b of newlyUnlocked) {
      logPlayerActivity({
        type: 'badge_unlocked',
        title: `Badge Unlocked: ${b}`,
        description: `${user.username} earned the ${b} badge!`,
      });
    }
  };

  const loginGuest = (username: string, avatar: string, color?: string) => {
    const trimmed = username.trim() || `Player_${Math.floor(100 + Math.random() * 900)}`;
    const updated: UserProfile = normalizeUserProfile(
      user
        ? {
            ...user,
            username: trimmed,
            avatar: avatar || user.avatar,
            color: color || user.color,
          }
        : {
            id: 'guest_' + Math.random().toString(36).substring(2, 9),
            username: trimmed,
            avatar: avatar || DEFAULT_AVATARS[0],
            color: color || DEFAULT_COLORS[0],
            createdAt: new Date().toISOString(),
            stats: {
              gamesPlayed: 0,
              wins: 0,
              totalScore: 0,
              wordsGuessed: 0,
              drawingsCompleted: 0,
              highestRoundScore: 0,
            },
            level: 1,
            xp: 0,
            unlockedBadges: ['Newbie Artist'],
            wallet: { ...INITIAL_DEFAULT_WALLET },
          }
    );
    saveUser(updated);
  };

  const loginWithFirebaseGoogle = async () => {
    const fbUser = await loginWithGoogle();
    if (fbUser) {
      const cloudProfile = await fetchProfileFromFirestore(fbUser.uid);
      if (cloudProfile) {
        const normalized = normalizeUserProfile({
          ...cloudProfile,
          id: fbUser.uid,
          email: fbUser.email || cloudProfile.email,
          username: cloudProfile.username || fbUser.displayName || 'Player',
        });
        saveUser(normalized);
        setIsFirebaseConnected(true);
        return;
      }

      const profile: UserProfile = normalizeUserProfile({
        id: fbUser.uid,
        username: fbUser.displayName || user?.username || 'SketchStar',
        email: fbUser.email || undefined,
        avatar: user?.avatar || fbUser.photoURL || DEFAULT_AVATARS[0],
        color: user?.color || DEFAULT_COLORS[0],
        createdAt: new Date().toISOString(),
        stats: user?.stats,
        level: user?.level,
        xp: user?.xp,
        unlockedBadges: user?.unlockedBadges,
        wallet: user?.wallet,
      });
      saveUser(profile);
      setIsFirebaseConnected(true);
    }
  };

  const loginWithFirebaseEmail = async (email: string, pass: string) => {
    const fbUser = await loginWithEmail(email, pass);
    if (fbUser) {
      const cloudProfile = await fetchProfileFromFirestore(fbUser.uid);
      if (cloudProfile) {
        const normalized = normalizeUserProfile({
          ...cloudProfile,
          id: fbUser.uid,
          email: fbUser.email || cloudProfile.email,
          username: cloudProfile.username || fbUser.displayName || email.split('@')[0],
        });
        saveUser(normalized);
        setIsFirebaseConnected(true);
        return;
      }

      const profile: UserProfile = normalizeUserProfile({
        id: fbUser.uid,
        username: fbUser.displayName || email.split('@')[0],
        email: fbUser.email || email,
        avatar: user?.avatar || DEFAULT_AVATARS[0],
        color: user?.color || DEFAULT_COLORS[0],
        createdAt: new Date().toISOString(),
        stats: user?.stats,
        level: user?.level,
        xp: user?.xp,
        unlockedBadges: user?.unlockedBadges,
        wallet: user?.wallet,
      });
      saveUser(profile);
      setIsFirebaseConnected(true);
    }
  };

  const registerWithFirebaseEmail = async (
    email: string,
    pass: string,
    username: string,
    avatar?: string,
    color?: string
  ) => {
    const fbUser = await registerWithEmail(email, pass);
    if (fbUser) {
      const chosenName = username.trim() || email.split('@')[0];
      const chosenAvatar = avatar || user?.avatar || DEFAULT_AVATARS[0];
      const chosenColor = color || user?.color || DEFAULT_COLORS[0];

      const profile: UserProfile = normalizeUserProfile({
        id: fbUser.uid,
        username: chosenName,
        email: fbUser.email || email,
        avatar: chosenAvatar,
        color: chosenColor,
        createdAt: new Date().toISOString(),
        stats: {
          gamesPlayed: 0,
          wins: 0,
          totalScore: 0,
          wordsGuessed: 0,
          drawingsCompleted: 0,
          highestRoundScore: 0,
          totalBetsWon: '0',
          totalBetsPlaced: '0',
        },
        level: 1,
        xp: 0,
        unlockedBadges: ['Early Adopter', 'Newbie Artist'],
        wallet: { ...INITIAL_DEFAULT_WALLET },
      });

      saveUser(profile);
      setIsFirebaseConnected(true);

      // Log welcome activity into Firestore feed
      logPlayerActivity({
        type: 'badge_unlocked',
        title: '🎉 Joined the Community',
        description: `${chosenName} registered a new account on Guess What!`,
        pointsEarned: 100,
      });
    }
  };

  const logout = async () => {
    await logoutFirebase();
    const randAvatar = DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
    const guest: UserProfile = normalizeUserProfile({
      id: 'guest_' + Math.random().toString(36).substring(2, 9),
      username: `Player_${Math.floor(100 + Math.random() * 900)}`,
      avatar: randAvatar,
      color: DEFAULT_COLORS[0],
      createdAt: new Date().toISOString(),
      stats: {
        gamesPlayed: 0,
        wins: 0,
        totalScore: 0,
        wordsGuessed: 0,
        drawingsCompleted: 0,
        highestRoundScore: 0,
      },
      level: 1,
      xp: 0,
      unlockedBadges: ['Guest Player'],
      wallet: { ...INITIAL_DEFAULT_WALLET },
    });
    saveUser(guest);
  };

  const updateAvatar = (avatar: string, color?: string) => {
    if (!user) return;
    saveUser({
      ...user,
      avatar,
      color: color || user.color,
    });
  };

  const updateUsername = (username: string) => {
    if (!user) return;
    const cleanName = username.trim() || user.username;
    saveUser({
      ...user,
      username: cleanName,
    });
  };

  // Wallet operations (BigInt safe)
  const updateWallet = (
    currency: CurrencyType,
    amount: string | number | bigint,
    op: 'add' | 'sub' | 'set' = 'add'
  ) => {
    if (!user) return;
    const currentWallet = normalizeWallet(user.wallet);
    const key = getWalletKey(currency);
    let newValue = currentWallet[key];

    if (op === 'add') {
      newValue = addCurrency(currentWallet[key], amount);
    } else if (op === 'sub') {
      newValue = subCurrency(currentWallet[key], amount);
    } else if (op === 'set') {
      newValue = toBigInt(amount).toString();
    }

    const updatedUser: UserProfile = {
      ...user,
      wallet: {
        ...currentWallet,
        [key]: newValue,
      },
    };
    saveUser(updatedUser);
  };

  // Deducts bet from user wallet
  const placeBet = (currency: CurrencyType, amount: string | number | bigint): boolean => {
    if (!user) return false;
    const currentWallet = normalizeWallet(user.wallet);
    const key = getWalletKey(currency);
    const currBi = toBigInt(currentWallet[key]);
    const betBi = toBigInt(amount);

    if (currBi < betBi) {
      return false; // Insufficient funds
    }

    const remaining = subCurrency(currentWallet[key], amount);
    const newPlaced = addCurrency(user.stats?.totalBetsPlaced || '0', amount);

    const updatedUser: UserProfile = {
      ...user,
      stats: {
        ...user.stats,
        totalBetsPlaced: newPlaced,
      },
      wallet: {
        ...currentWallet,
        [key]: remaining,
      },
    };
    saveUser(updatedUser);
    return true;
  };

  // Awards jackpot/pot win to user with 3X Multiplier if user has งip
  const winBetReward = (
    currency: CurrencyType,
    amount: string | number | bigint,
    gameTitle?: string
  ): { amountWon: string; multiplier: number } => {
    if (!user) return { amountWon: '0', multiplier: 1 };

    const hasNgip = Boolean(user.isNgip || isAdmin);
    const multiplier = hasNgip ? 3 : 1;
    const baseBi = toBigInt(amount);
    const finalBi = hasNgip ? baseBi * 3n : baseBi;
    const finalAmountStr = finalBi.toString();

    const currentWallet = normalizeWallet(user.wallet);
    const key = getWalletKey(currency);
    const newBal = addCurrency(currentWallet[key], finalAmountStr);
    const newBetsWon = addCurrency(user.stats?.totalBetsWon || '0', finalAmountStr);

    const updatedUser: UserProfile = {
      ...user,
      stats: {
        ...user.stats,
        totalBetsWon: newBetsWon,
      },
      wallet: {
        ...currentWallet,
        [key]: newBal,
      },
    };
    saveUser(updatedUser);

    logPlayerActivity({
      type: 'wager_won',
      title: hasNgip
        ? `⚡ งip 3X MULTIPLIER WIN! (+${formatCompactCurrency(finalAmountStr)} ${CURRENCY_CONFIG[currency].name})`
        : `Won ${formatCompactCurrency(finalAmountStr)} ${CURRENCY_CONFIG[currency].name}!`,
      description: hasNgip
        ? `${user.username} (งip VIP) won a 3X MULTIPLIER PAYOUT in ${gameTitle || 'Match'}!`
        : `${user.username} won the pot in ${gameTitle || 'Betting Match'}!`,
      currencyEarned: {
        currency,
        amount: finalAmountStr,
      },
    });

    return { amountWon: finalAmountStr, multiplier };
  };

  // Admin function: Toggle งip for any user
  const toggleUserNgip = async (targetUserId: string, ngipState: boolean) => {
    let target = allRegisteredUsers.find((u) => u.id === targetUserId);
    if (!target && user?.id === targetUserId) {
      target = user;
    }

    let updatedWallet = target ? normalizeWallet(target.wallet) : normalizeWallet();
    // When granted งip, immediately award 100k of each currency as starter gift
    if (ngipState && target) {
      updatedWallet = {
        diamonds: addCurrency(updatedWallet.diamonds, NGIP_DAILY_SALARY_AMOUNT),
        amethysts: addCurrency(updatedWallet.amethysts, NGIP_DAILY_SALARY_AMOUNT),
        jades: addCurrency(updatedWallet.jades, NGIP_DAILY_SALARY_AMOUNT),
        rubies: addCurrency(updatedWallet.rubies, NGIP_DAILY_SALARY_AMOUNT),
      };
    }

    const updates: Partial<UserProfile> = {
      isNgip: ngipState,
      wallet: updatedWallet,
      ...(ngipState ? { lastNgipSalaryClaim: new Date().toISOString() } : {}),
    };

    if (user && user.id === targetUserId) {
      const updated: UserProfile = { ...user, ...updates };
      saveUser(updated);
    }
    // Update state in allRegisteredUsers
    setAllRegisteredUsers((prev) =>
      prev.map((u) => (u.id === targetUserId ? { ...u, ...updates } : u))
    );
    await adminUpdateUserProfileInFirestore(targetUserId, updates);

    logPlayerActivity({
      type: 'badge_unlocked',
      title: ngipState ? `👑 VIP งip Granted to ${target?.username || 'Player'}` : `VIP งip Revoked from ${target?.username || 'Player'}`,
      description: ngipState ? `Granted by Owner Admin with +100K starter currency bonus!` : `VIP status revoked by Admin.`,
    });
  };

  // Admin function: Modify another user's currencies in Firestore
  const adminModifyOtherUserWallet = async (
    targetUserId: string,
    currency: CurrencyType,
    amount: string | number | bigint,
    op: 'add' | 'sub' | 'set'
  ) => {
    const key = getWalletKey(currency);
    let target = allRegisteredUsers.find((u) => u.id === targetUserId);
    if (!target && user?.id === targetUserId) {
      target = user;
    }
    if (!target) return;

    const currWallet = normalizeWallet(target.wallet);
    let newVal = currWallet[key];
    if (op === 'set') {
      newVal = amount.toString();
    } else if (op === 'add') {
      newVal = addCurrency(newVal, amount);
    } else if (op === 'sub') {
      newVal = subCurrency(newVal, amount);
    }

    const updatedWallet: UserWallet = {
      ...currWallet,
      [key]: newVal,
    };

    if (user && user.id === targetUserId) {
      saveUser({ ...user, wallet: updatedWallet });
    }

    setAllRegisteredUsers((prev) =>
      prev.map((u) => (u.id === targetUserId ? { ...u, wallet: updatedWallet } : u))
    );

    await adminUpdateUserProfileInFirestore(targetUserId, { wallet: updatedWallet });
  };

  // Admin function: Override other user's level / stats in Firestore
  const adminOverrideOtherUserStats = async (
    targetUserId: string,
    newStats: Partial<PlayerStats>,
    level?: number
  ) => {
    let target = allRegisteredUsers.find((u) => u.id === targetUserId);
    if (!target && user?.id === targetUserId) {
      target = user;
    }
    if (!target) return;

    const mergedStats = {
      ...normalizeStats(target.stats),
      ...newStats,
    };
    const targetLevel = level !== undefined ? level : target.level;
    const targetXp = (targetLevel - 1) * 600;

    if (user && user.id === targetUserId) {
      saveUser({ ...user, stats: mergedStats, level: targetLevel, xp: targetXp });
    }

    setAllRegisteredUsers((prev) =>
      prev.map((u) =>
        u.id === targetUserId
          ? { ...u, stats: mergedStats, level: targetLevel, xp: targetXp }
          : u
      )
    );

    await adminUpdateUserProfileInFirestore(targetUserId, {
      stats: mergedStats,
      level: targetLevel,
      xp: targetXp,
    });
  };

  // Admin function: Grant currencies to self or target user
  const grantCurrenciesToUser = (
    currency: CurrencyType,
    amount: string | number | bigint,
    targetUserId?: string
  ) => {
    if (targetUserId && targetUserId !== user?.id) {
      adminModifyOtherUserWallet(targetUserId, currency, amount, 'add');
    } else {
      updateWallet(currency, amount, 'add');
    }
  };

  // Admin function: Reduce currencies from user
  const reduceCurrencies = (
    currency: CurrencyType,
    amount: string | number | bigint
  ) => {
    updateWallet(currency, amount, 'sub');
  };

  // Admin function: Global airdrop
  const airdropCurrenciesGlobally = (
    currency: CurrencyType,
    amount: string | number | bigint
  ) => {
    updateWallet(currency, amount, 'add');
    allRegisteredUsers.forEach((otherUser) => {
      if (otherUser.id !== user?.id) {
        adminModifyOtherUserWallet(otherUser.id, currency, amount, 'add');
      }
    });
  };

  // Admin function: Override player statistics & level
  const overrideStats = (
    newStats: Partial<PlayerStats>,
    newLevel?: number,
    newXp?: number
  ) => {
    if (!user) return;
    const currentStats = user.stats;
    const mergedStats: PlayerStats = {
      gamesPlayed: newStats.gamesPlayed !== undefined ? newStats.gamesPlayed : currentStats.gamesPlayed,
      wins: newStats.wins !== undefined ? newStats.wins : currentStats.wins,
      totalScore: newStats.totalScore !== undefined ? newStats.totalScore : currentStats.totalScore,
      wordsGuessed: newStats.wordsGuessed !== undefined ? newStats.wordsGuessed : currentStats.wordsGuessed,
      drawingsCompleted: newStats.drawingsCompleted !== undefined ? newStats.drawingsCompleted : currentStats.drawingsCompleted,
      highestRoundScore: newStats.highestRoundScore !== undefined ? newStats.highestRoundScore : currentStats.highestRoundScore,
      totalBetsWon: newStats.totalBetsWon !== undefined ? String(newStats.totalBetsWon) : (currentStats.totalBetsWon || '0'),
      totalBetsPlaced: newStats.totalBetsPlaced !== undefined ? String(newStats.totalBetsPlaced) : (currentStats.totalBetsPlaced || '0'),
    };
    const targetFastest = newStats.fastestGuessSec !== undefined ? newStats.fastestGuessSec : currentStats.fastestGuessSec;
    if (typeof targetFastest === 'number' && !isNaN(targetFastest)) {
      mergedStats.fastestGuessSec = targetFastest;
    }

    const targetLevel = newLevel !== undefined ? newLevel : user.level;
    const targetXp = newXp !== undefined ? newXp : (targetLevel - 1) * 600;

    saveUser({
      ...user,
      stats: mergedStats,
      level: Math.max(1, targetLevel),
      xp: Math.max(0, targetXp),
    });
  };

  // Admin function: Reset stats to zero
  const resetUserStats = () => {
    if (!user) return;
    saveUser({
      ...user,
      stats: {
        gamesPlayed: 0,
        wins: 0,
        totalScore: 0,
        wordsGuessed: 0,
        drawingsCompleted: 0,
        highestRoundScore: 0,
        fastestGuessSec: 0,
        totalBetsWon: '0',
        totalBetsPlaced: '0',
      },
      level: 1,
      xp: 0,
    });
  };

  // Admin function: Unlock all badges
  const unlockAllAchievements = () => {
    if (!user) return;
    saveUser({
      ...user,
      unlockedBadges: [
        'Newbie Artist',
        'Sharp Guesser',
        'Word Prodigy',
        'Champion',
        'Master Artist',
        'Lightning Speed',
        'VIP High Roller',
        'Owner Superadmin',
        'Legendary Oracle',
        'Arcade God',
      ],
    });
  };

  const toggleAdminRole = () => {
    if (!user) return;
    saveUser({
      ...user,
      isAdmin: !user.isAdmin,
    });
  };

  const connectCustomFirebase = (config: FirebaseConfig): boolean => {
    const success = initFirebaseService(config);
    setIsFirebaseConnected(success);
    if (success && user) {
      saveProfileToFirestore(user);
    }
    return success;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isFirebaseConnected,
        isAdmin,
        isNgip,
        canClaimNgipSalary,
        ngipSalaryTimeRemaining,
        claimNgipDailySalary,
        darkMode,
        toggleDarkMode,
        activities,
        allRegisteredUsers,
        connectCustomFirebase,
        loginGuest,
        loginWithFirebaseGoogle,
        loginWithFirebaseEmail,
        registerWithFirebaseEmail,
        logout,
        updateStats,
        logPlayerActivity,
        updateAvatar,
        updateUsername,
        updateWallet,
        placeBet,
        winBetReward,
        grantCurrenciesToUser,
        reduceCurrencies,
        airdropCurrenciesGlobally,
        overrideStats,
        resetUserStats,
        unlockAllAchievements,
        toggleAdminRole,
        toggleUserNgip,
        adminModifyOtherUserWallet,
        adminOverrideOtherUserStats,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
