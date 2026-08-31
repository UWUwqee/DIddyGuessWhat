import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  UserPlus,
  LogIn,
  Shield,
  ArrowRight,
  Check,
  Flame,
  Palette,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { useAuth, COLOR_OPTIONS } from '../context/AuthContext';
import { PRESET_AVATARS } from '../utils/avatarIcons';
import { soundManager } from '../utils/soundEffects';
import { themeMusic } from '../utils/themeMusic';
import { AvatarSelector } from './AvatarSelector';
import { AvatarRenderer } from './AvatarRenderer';
import { GWLogo } from './GWLogo';
import { DarkModeToggle } from './DarkModeToggle';
import { GothicDripBackground } from './GothicDripBackground';

interface WelcomeAuthGateProps {
  onEnter: () => void;
}

export const WelcomeAuthGate: React.FC<WelcomeAuthGateProps> = ({ onEnter }) => {
  const {
    user,
    loginWithFirebaseGoogle,
    loginWithFirebaseEmail,
    registerWithFirebaseEmail,
    isFirebaseConnected,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'register' | 'login' | 'continue'>(
    user ? 'continue' : 'register'
  );

  // Form states
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0].id);
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startThemeAndEnter = () => {
    // Trigger the Battle Hymn of the Republic Rockhestra Theme Song!
    themeMusic.start();
    onEnter();
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      if (activeTab === 'login') {
        await loginWithFirebaseEmail(email, password);
      } else {
        await registerWithFirebaseEmail(
          email,
          password,
          username || email.split('@')[0],
          selectedAvatar,
          selectedColor
        );
      }
      soundManager.playVictory();
      startThemeAndEnter();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Authentication failed. Please verify your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await loginWithFirebaseGoogle();
      soundManager.playVictory();
      startThemeAndEnter();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Google authentication was cancelled or failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithSaved = () => {
    soundManager.playCorrectGuess();
    startThemeAndEnter();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-6 bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden font-sans select-none transition-colors duration-300">
      {/* Y2K Gothic Drip Background Graffiti Overlay */}
      <GothicDripBackground />

      {/* Top Bar for Dark Mode Toggle & Quick Settings */}
      <div className="absolute top-4 right-4 z-20">
        <DarkModeToggle />
      </div>

      {/* Background Neon Aura Splatters */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-600/20 dark:bg-purple-600/30 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div
        className="absolute bottom-1/4 -right-20 w-96 h-96 bg-pink-600/20 dark:bg-pink-600/25 rounded-full blur-3xl pointer-events-none animate-pulse"
        style={{ animationDelay: '1.2s' }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[110px] pointer-events-none" />

      {/* Main Y2K Gothic Drip Chrome Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-lg bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border-2 border-slate-300 dark:border-purple-800/80 rounded-3xl p-6 sm:p-9 shadow-2xl shadow-purple-950/20 relative z-10 space-y-6"
      >
        {/* Brand Header with Y2K Gothic Drip Logo & Tagline */}
        <div className="text-center space-y-3 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/10 dark:bg-purple-500/20 border-2 border-purple-500/30 text-purple-700 dark:text-pink-300 text-xs font-black tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-pink-500" />
            <span>Guess What? ✦ Y2K Gothic Drip Arcade</span>
          </div>

          <div className="pt-1">
            <GWLogo size="xl" showText={true} />
          </div>

          <div className="space-y-1">
            <p className="text-sm sm:text-base font-black tracking-wide">
              <span className="text-slate-700 dark:text-slate-300">By </span>
              <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_1px_2px_rgba(245,158,11,0.5)] font-black">
                D14Dąmon
              </span>
            </p>
          </div>
        </div>

        {/* Prominent Google Auth One-Click */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-2xl font-black text-sm text-slate-900 bg-white hover:bg-slate-50 disabled:opacity-50 transition-all shadow-lg shadow-purple-900/10 flex items-center justify-center gap-3 border-2 border-slate-300 dark:border-slate-600 cursor-pointer"
        >
          {/* Google 4-Color Logo */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Connect with Google Account</span>
        </motion.button>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-slate-300 dark:border-slate-800" />
          <span className="absolute px-3 bg-white dark:bg-slate-900 text-[11px] font-black text-slate-500 uppercase tracking-wider">
            Or Use Email Account
          </span>
        </div>

        {/* Tab Selector: Create Account vs Login vs Saved */}
        <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-300 dark:border-slate-700/60 text-xs font-black">
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              soundManager.playTick();
            }}
            className={`py-2.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'register'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              soundManager.playTick();
            }}
            className={`py-2.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'login'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Login</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-bold flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {/* Saved Session banner (if previously logged in) */}
        {user && activeTab !== 'continue' && (
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xl flex-shrink-0">
                <AvatarRenderer avatar={user.avatar} className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="font-black text-slate-900 dark:text-white">{user.username}</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Currently logged in</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleContinueWithSaved}
              className="px-3 py-1.5 rounded-xl text-xs font-black text-purple-700 dark:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-colors cursor-pointer"
            >
              Resume Session →
            </button>
          </div>
        )}

        {/* TAB 1: CREATE ACCOUNT (Sign Up) */}
        {activeTab === 'register' && (
          <motion.form
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleEmailAuth}
            className="space-y-4 text-xs"
          >
            <div className="space-y-1.5">
              <label className="font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-500" />
                <span>Player Username</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username..."
                maxLength={20}
                required
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 font-black placeholder-slate-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-purple-500" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium placeholder-slate-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-pink-500" />
                <span>Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium placeholder-slate-400 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Avatar Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Select Your Avatar</span>
              </label>
              <AvatarSelector
                value={selectedAvatar}
                onChange={setSelectedAvatar}
                compact={true}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:brightness-110 disabled:opacity-50 transition-all shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? 'Creating Account...' : 'Create Account & Enter'}</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.form>
        )}

        {/* TAB 2: LOGIN (Sign In) */}
        {activeTab === 'login' && (
          <motion.form
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleEmailAuth}
            className="space-y-4 text-xs"
          >
            <div className="space-y-1.5">
              <label className="font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-purple-500" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium placeholder-slate-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-pink-500" />
                <span>Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium placeholder-slate-400 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 disabled:opacity-50 transition-all shadow-xl shadow-purple-600/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? 'Signing In...' : 'Sign In & Enter Arcade'}</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.form>
        )}


      </motion.div>
    </div>
  );
};

