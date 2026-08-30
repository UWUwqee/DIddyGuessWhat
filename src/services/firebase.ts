import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import { FirebaseConfig, LeaderboardEntry, UserProfile, PlayerActivity } from '../types';
import appletConfig from '../../firebase-applet-config.json';

const STORAGE_KEY_FIREBASE = 'guess_what_firebase_config';

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: ReturnType<typeof getAuth> | null = null;
let firestoreDb: Firestore | null = null;

// Read config from auto-provisioned firebase-applet-config.json, localStorage, or env
export function getSavedFirebaseConfig(): FirebaseConfig | null {
  // 1. Check auto-provisioned firebase-applet-config.json first
  if (appletConfig && appletConfig.apiKey && appletConfig.projectId) {
    return {
      apiKey: appletConfig.apiKey,
      authDomain: appletConfig.authDomain || `${appletConfig.projectId}.firebaseapp.com`,
      projectId: appletConfig.projectId,
      storageBucket: appletConfig.storageBucket || `${appletConfig.projectId}.firebasestorage.app`,
      messagingSenderId: appletConfig.messagingSenderId || '',
      appId: appletConfig.appId || '',
      databaseURL: '',
    };
  }

  // 2. Local storage override
  try {
    const saved = localStorage.getItem(STORAGE_KEY_FIREBASE);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to parse saved firebase config from localStorage', e);
  }

  // 3. Fallback to env if provided
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};
  const envApiKey = metaEnv.VITE_FIREBASE_API_KEY;
  if (envApiKey) {
    return {
      apiKey: envApiKey,
      authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: metaEnv.VITE_FIREBASE_APP_ID || '',
      databaseURL: metaEnv.VITE_FIREBASE_DATABASE_URL || '',
    };
  }

  return null;
}

export function isFirebaseConfigured(): boolean {
  const config = getSavedFirebaseConfig();
  return Boolean(config && config.apiKey && config.projectId);
}

export function initFirebaseService(customConfig?: FirebaseConfig): boolean {
  try {
    const config = customConfig || getSavedFirebaseConfig();
    if (!config || !config.apiKey || !config.projectId) {
      return false;
    }

    if (customConfig) {
      localStorage.setItem(STORAGE_KEY_FIREBASE, JSON.stringify(customConfig));
    }

    const apps = getApps();
    if (apps.length > 0) {
      firebaseApp = apps[0];
    } else {
      firebaseApp = initializeApp(config);
    }

    firebaseAuth = getAuth(firebaseApp);
    const dbId = (appletConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
    firestoreDb = dbId ? getFirestore(firebaseApp, dbId) : getFirestore(firebaseApp);
    console.log('🔥 Firebase initialized with Project:', config.projectId, 'DB:', dbId || 'default');
    return true;
  } catch (err) {
    console.warn('⚠️ Firebase init skipped or failed:', err);
    return false;
  }
}

// Initial initialization
initFirebaseService();

export function getFirebaseAuth() {
  if (!firebaseAuth) initFirebaseService();
  return firebaseAuth;
}

export function getFirestoreDb() {
  if (!firestoreDb) initFirebaseService();
  return firestoreDb;
}

export async function ensureAnonymousAuth(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  if (auth.currentUser) return auth.currentUser;
  try {
    const res = await signInAnonymously(auth);
    return res.user;
  } catch (err) {
    console.warn('Anonymous auth failed or disabled, continuing without auth:', err);
    return null;
  }
}

export function formatFirebaseAuthError(error: unknown): string {
  if (!error) return 'An unknown error occurred.';
  const code = (error as { code?: string })?.code || '';
  switch (code) {
    case 'auth/unauthorized-domain':
      return 'Unauthorized Domain: This domain is not in your Firebase Authorized Domains list. Please add your Railway/deployed domain in Firebase Console > Authentication > Settings > Authorized domains, or use Email / Guest sign-in.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in or use another email.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please check your credentials.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please wait a moment and try again.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled on this Firebase project yet.';
    default:
      return (error as Error)?.message || 'Authentication failed. Please try again.';
  }
}

export async function loginWithGoogle(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase is not configured.');
  }

  try {
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    return res.user;
  } catch (err) {
    throw new Error(formatFirebaseAuthError(err));
  }
}

export async function loginWithEmail(email: string, pass: string): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase is not configured.');
  }

  try {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    return res.user;
  } catch (err) {
    throw new Error(formatFirebaseAuthError(err));
  }
}

export async function registerWithEmail(email: string, pass: string): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase is not configured.');
  }

  try {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    return res.user;
  } catch (err) {
    throw new Error(formatFirebaseAuthError(err));
  }
}

export async function logoutFirebase(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth) {
    await signOut(auth);
  }
}

/**
 * Recursively removes all undefined values from an object or array so that
 * Firestore setDoc/updateDoc/addDoc does not reject the operation.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

export async function saveProfileToFirestore(profile: UserProfile): Promise<void> {
  const db = getFirestoreDb();
  if (!db || !profile || !profile.id) return;
  try {
    const cleanedProfile = sanitizeForFirestore(profile);
    const userRef = doc(db, 'users', profile.id);
    await setDoc(userRef, cleanedProfile, { merge: true });

    // Also update global leaderboard entry with full avatar, colors & stats
    const leaderRef = doc(db, 'leaderboard', profile.id);
    const gamesPlayed = profile.stats?.gamesPlayed || 0;
    const wins = profile.stats?.wins || 0;
    const winRate = gamesPlayed > 0
      ? Math.round((wins / gamesPlayed) * 100)
      : (wins > 0 ? 100 : 0);

    const leaderData: Partial<LeaderboardEntry> & { updatedAt: string; isNgip?: boolean; isAdmin?: boolean; color?: string; drawingsCompleted?: number } = {
      userId: profile.id,
      username: profile.username || 'Player',
      avatar: profile.avatar || 'cat',
      color: profile.color || '#3B82F6',
      score: profile.stats?.totalScore || 0,
      wins,
      gamesPlayed,
      wordsGuessed: profile.stats?.wordsGuessed || 0,
      drawingsCompleted: profile.stats?.drawingsCompleted || 0,
      winRate,
      level: profile.level || 1,
      isNgip: Boolean(profile.isNgip),
      isAdmin: Boolean(profile.isAdmin),
      lastActive: 'Active now',
      updatedAt: new Date().toISOString(),
    };

    await setDoc(leaderRef, sanitizeForFirestore(leaderData), { merge: true });
    console.log('✅ Firestore profile & Hall of Fame entry successfully saved for:', profile.username);
  } catch (err) {
    console.error('Failed to sync profile to Firestore:', err);
  }
}

export async function fetchProfileFromFirestore(userId: string): Promise<UserProfile | null> {
  const db = getFirestoreDb();
  if (!db || !userId) return null;
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (err) {
    console.warn('Failed to fetch user profile from Firestore:', err);
  }
  return null;
}

export function subscribeToUserProfile(userId: string, callback: (profile: UserProfile | null) => void): () => void {
  const db = getFirestoreDb();
  if (!db || !userId) return () => {};
  try {
    const userRef = doc(db, 'users', userId);
    return onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as UserProfile);
        }
      },
      (err) => {
        console.warn('User profile realtime sync warning:', err);
      }
    );
  } catch (err) {
    console.warn('User profile subscribe error:', err);
    return () => {};
  }
}

export async function fetchFirestoreLeaderboard(): Promise<LeaderboardEntry[] | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  try {
    const q = query(collection(db, 'leaderboard'), orderBy('score', 'desc'), limit(100));
    const querySnapshot = await getDocs(q);
    const results: LeaderboardEntry[] = [];
    let rank = 1;
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as LeaderboardEntry;
      results.push({ ...data, rank: rank++ });
    });
    return results;
  } catch (err) {
    console.warn('Firestore leaderboard query fallback:', err);
    return null;
  }
}

export function subscribeToFirestoreLeaderboard(callback: (entries: LeaderboardEntry[]) => void): () => void {
  const db = getFirestoreDb();
  if (!db) return () => {};
  try {
    const q = query(collection(db, 'leaderboard'), orderBy('score', 'desc'), limit(100));
    return onSnapshot(
      q,
      (snapshot) => {
        const results: LeaderboardEntry[] = [];
        let rank = 1;
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as LeaderboardEntry;
          results.push({ ...data, rank: rank++ });
        });
        callback(results);
      },
      (err) => {
        console.warn('Leaderboard subscription error:', err);
      }
    );
  } catch (err) {
    console.warn('Leaderboard subscription error:', err);
    return () => {};
  }
}

export async function logActivityToFirestore(activity: PlayerActivity): Promise<void> {
  const db = getFirestoreDb();
  if (!db || !activity || !activity.id) return;
  try {
    const actRef = doc(db, 'activities', activity.id);
    await setDoc(actRef, sanitizeForFirestore(activity));
    console.log('✅ Activity logged to Firestore:', activity.title);
  } catch (err) {
    console.warn('Failed to log activity to Firestore:', err);
  }
}

export async function fetchFirestoreActivities(limitCount: number = 30): Promise<PlayerActivity[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  try {
    const q = query(collection(db, 'activities'), orderBy('timestamp', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    const results: PlayerActivity[] = [];
    snap.forEach((docSnap) => {
      results.push(docSnap.data() as PlayerActivity);
    });
    return results;
  } catch (err) {
    console.warn('Failed to fetch activities from Firestore:', err);
    return [];
  }
}

export function subscribeToFirestoreActivities(callback: (activities: PlayerActivity[]) => void): () => void {
  const db = getFirestoreDb();
  if (!db) return () => {};
  try {
    const q = query(collection(db, 'activities'), orderBy('timestamp', 'desc'), limit(40));
    return onSnapshot(
      q,
      (snapshot) => {
        const results: PlayerActivity[] = [];
        snapshot.forEach((docSnap) => {
          results.push(docSnap.data() as PlayerActivity);
        });
        callback(results);
      },
      (err) => {
        console.warn('Activities subscription note:', err);
      }
    );
  } catch (err) {
    console.warn('Activities subscription error:', err);
    return () => {};
  }
}

// Fetch all registered/active user accounts for Admin Panel
export async function fetchAllUsersFromFirestore(): Promise<UserProfile[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, 'users'));
    const results: UserProfile[] = [];
    snap.forEach((docSnap) => {
      results.push(docSnap.data() as UserProfile);
    });
    return results;
  } catch (err) {
    console.warn('Failed to fetch all users from Firestore:', err);
    return [];
  }
}

// Real-time subscription to all user accounts for Admin Panel
export function subscribeToAllUsersFromFirestore(callback: (users: UserProfile[]) => void): () => void {
  const db = getFirestoreDb();
  if (!db) return () => {};
  try {
    const q = collection(db, 'users');
    return onSnapshot(
      q,
      (snapshot) => {
        const results: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          results.push(docSnap.data() as UserProfile);
        });
        callback(results);
      },
      (err) => {
        console.warn('Users collection subscription error:', err);
      }
    );
  } catch (err) {
    console.warn('Users subscription error:', err);
    return () => {};
  }
}

// Admin update user document in Firestore (e.g. grant/revoke งip, modify currencies, change level)
export async function adminUpdateUserProfileInFirestore(userId: string, updates: Partial<UserProfile>): Promise<void> {
  const db = getFirestoreDb();
  if (!db || !userId) return;
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, sanitizeForFirestore(updates), { merge: true });

    // If username, avatar, score, level or isNgip changed, also mirror to leaderboard
    const leaderRef = doc(db, 'leaderboard', userId);
    const leaderUpdates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (updates.username !== undefined) leaderUpdates.username = updates.username;
    if (updates.avatar !== undefined) leaderUpdates.avatar = updates.avatar;
    if (updates.level !== undefined) leaderUpdates.level = updates.level;
    if (updates.isNgip !== undefined) leaderUpdates.isNgip = updates.isNgip;
    if (updates.wallet !== undefined) leaderUpdates.wallet = updates.wallet;
    if (updates.stats?.totalScore !== undefined) leaderUpdates.score = updates.stats.totalScore;
    if (updates.stats?.wins !== undefined) leaderUpdates.wins = updates.stats.wins;

    await setDoc(leaderRef, sanitizeForFirestore(leaderUpdates), { merge: true });
    console.log(`✅ Admin updated Firestore user [${userId}] successfully.`);
  } catch (err) {
    console.error('Failed to admin update profile in Firestore:', err);
  }
}


