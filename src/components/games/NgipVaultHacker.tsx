import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ShieldCheck,
  Zap,
  Terminal,
  Lock,
  Unlock,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Flame,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CurrencyType } from '../../types';
import { CURRENCY_CONFIG, formatCompactCurrency, toBigInt, INITIAL_DEFAULT_WALLET } from '../../utils/currencyUtils';
import { soundManager } from '../../utils/soundEffects';
import { NgipBadge } from '../NgipBadge';

interface NgipVaultHackerProps {
  onBackToHub: () => void;
}

interface VaultLevel {
  level: number;
  name: string;
  codeLength: number;
  timeLimit: number;
  multiplier: number;
  themeColor: string;
}

const VAULT_LEVELS: VaultLevel[] = [
  { level: 1, name: 'Alpha Firewall Matrix', codeLength: 4, timeLimit: 25, multiplier: 5, themeColor: '#3B82F6' },
  { level: 2, name: 'Quantum Core Cipher', codeLength: 5, timeLimit: 20, multiplier: 15, themeColor: '#8B5CF6' },
  { level: 3, name: 'Cyber Sub-Zero Node', codeLength: 6, timeLimit: 18, multiplier: 40, themeColor: '#EC4899' },
  { level: 4, name: 'Supreme งip Diamond Vault', codeLength: 7, timeLimit: 15, multiplier: 120, themeColor: '#EAB308' },
];

export const NgipVaultHacker: React.FC<NgipVaultHackerProps> = ({ onBackToHub }) => {
  const { user, isNgip, updateWallet, logPlayerActivity, updateStats } = useAuth();
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>('diamond');
  const [betAmount, setBetAmount] = useState<string>('50000');
  const [gameStage, setGameStage] = useState<'betting' | 'hacking' | 'success' | 'failed'>('betting');
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [targetCode, setTargetCode] = useState<string>('');
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [guessHistory, setGuessHistory] = useState<{ guess: string; exact: number; exists: number }[]>([]);
  const [timeLeft, setTimeLeft] = useState(25);
  const [totalWonAccumulated, setTotalWonAccumulated] = useState<string>('0');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const currentLevel = VAULT_LEVELS[currentLevelIdx];
  const currentWallet = user?.wallet || INITIAL_DEFAULT_WALLET;
  const currKey = `${selectedCurrency}s` as keyof typeof currentWallet;
  const userBalance = currentWallet[currKey] || '0';

  // Generate random digits 0-9
  const generateRandomCode = (len: number) => {
    let result = '';
    for (let i = 0; i < len; i++) {
      result += Math.floor(Math.random() * 10).toString();
    }
    return result;
  };

  // Timer Interval
  useEffect(() => {
    if (gameStage !== 'hacking') return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleHackFail('Time expired! System breached your signal.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStage, currentLevelIdx]);

  const handleStartInfiltration = () => {
    const betBi = toBigInt(betAmount || '0');
    const balBi = toBigInt(userBalance);

    if (betBi <= 0n || betBi > balBi) {
      soundManager.playTick();
      return;
    }

    // Deduct Stake
    updateWallet(selectedCurrency, betBi.toString(), 'sub');
    setCurrentLevelIdx(0);
    setTotalWonAccumulated('0');
    setGuessHistory([]);
    setCurrentGuess('');

    startLevel(0);
  };

  const startLevel = (levelIdx: number) => {
    const lvl = VAULT_LEVELS[levelIdx];
    const newCode = generateRandomCode(lvl.codeLength);
    setTargetCode(newCode);
    setCurrentGuess('');
    setGuessHistory([]);
    setTimeLeft(lvl.timeLimit);
    setGameStage('hacking');

    if (soundEnabled) soundManager.playCardPlay();
  };

  const handleKeypadPress = (digit: string) => {
    if (gameStage !== 'hacking' || currentGuess.length >= currentLevel.codeLength) return;
    if (soundEnabled) soundManager.playTick();
    setCurrentGuess((prev) => prev + digit);
  };

  const handleBackspace = () => {
    if (gameStage !== 'hacking') return;
    if (soundEnabled) soundManager.playTick();
    setCurrentGuess((prev) => prev.slice(0, -1));
  };

  const handleSubmitGuess = () => {
    if (gameStage !== 'hacking' || currentGuess.length !== currentLevel.codeLength) return;

    if (currentGuess === targetCode) {
      // Level Decrypted!
      handleLevelSuccess();
    } else {
      // Analyze guess: exact matches & exists matches
      let exact = 0;
      let exists = 0;
      const targetArr = targetCode.split('');
      const guessArr = currentGuess.split('');

      const targetUnmatched: string[] = [];
      const guessUnmatched: string[] = [];

      for (let i = 0; i < currentLevel.codeLength; i++) {
        if (guessArr[i] === targetArr[i]) {
          exact++;
        } else {
          targetUnmatched.push(targetArr[i]);
          guessUnmatched.push(guessArr[i]);
        }
      }

      guessUnmatched.forEach((g) => {
        const matchIdx = targetUnmatched.indexOf(g);
        if (matchIdx !== -1) {
          exists++;
          targetUnmatched.splice(matchIdx, 1);
        }
      });

      setGuessHistory((prev) => [{ guess: currentGuess, exact, exists }, ...prev]);
      setCurrentGuess('');
      if (soundEnabled) soundManager.playReverse();
    }
  };

  const handleLevelSuccess = () => {
    if (soundEnabled) soundManager.playVictory();

    const betBi = toBigInt(betAmount || '0');
    // Multiplier calculation: levelMultiplier * 3 for งip
    const baseMult = BigInt(currentLevel.multiplier);
    const ngipMult = isNgip ? 3n : 1n;
    const finalMult = baseMult * ngipMult;
    const roundWinnings = betBi * finalMult;

    setTotalWonAccumulated(roundWinnings.toString());

    if (currentLevelIdx < VAULT_LEVELS.length - 1) {
      // Ask or advance to next tier
      setCurrentLevelIdx((prev) => prev + 1);
      startLevel(currentLevelIdx + 1);
    } else {
      // Completed all 4 tiers!
      setGameStage('success');
      updateWallet(selectedCurrency, roundWinnings.toString(), 'add');
      updateStats({ gamesPlayed: 1, wins: 1, totalScore: 500 });

      logPlayerActivity({
        type: 'wager_won',
        title: `🔥 งip Vault Decrypted: Won ${formatCompactCurrency(roundWinnings.toString())} ${CURRENCY_CONFIG[selectedCurrency].name}!`,
        description: `${user?.username || 'VIP Hacker'} breached all 4 Security Vaults with 3X งip boost!`,
        gameMode: 'งip Cyber Vault Hacker',
        currencyEarned: {
          currency: selectedCurrency,
          amount: roundWinnings.toString(),
        },
      });
    }
  };

  const handleCashOut = () => {
    if (toBigInt(totalWonAccumulated) > 0n) {
      updateWallet(selectedCurrency, totalWonAccumulated, 'add');
      updateStats({ gamesPlayed: 1, wins: 1, totalScore: 200 });

      logPlayerActivity({
        type: 'wager_won',
        title: `⚡ งip Vault Early Extract: Won ${formatCompactCurrency(totalWonAccumulated)} ${CURRENCY_CONFIG[selectedCurrency].name}!`,
        description: `${user?.username || 'VIP Hacker'} extracted early with 3X งip Multiplier!`,
        gameMode: 'งip Cyber Vault Hacker',
        currencyEarned: {
          currency: selectedCurrency,
          amount: totalWonAccumulated,
        },
      });
    }
    setGameStage('success');
  };

  const handleHackFail = (reason: string) => {
    if (soundEnabled) soundManager.playTick();
    setGameStage('failed');
    updateStats({ gamesPlayed: 1 });
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 text-white p-4 sm:p-6 relative overflow-hidden flex flex-col justify-between">
      {/* Glow Backdrops */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between gap-3 mb-4 relative z-10">
        <button
          onClick={onBackToHub}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-slate-200 hover:bg-slate-800 transition-all shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Lounge
        </button>

        <div className="flex items-center gap-2">
          <NgipBadge size="md" />
          <span className="hidden sm:inline-block text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 px-2.5 py-1 rounded-lg">
            Cyber Decryption Matrix
          </span>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-all shadow-md"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5 text-cyan-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
        </button>
      </div>

      {/* Main Workspace */}
      <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 relative z-10">
        {/* Left Column: Decryption Terminal */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Level Progress Bar */}
          <div className="grid grid-cols-4 gap-2">
            {VAULT_LEVELS.map((lvl, idx) => {
              const isPast = idx < currentLevelIdx;
              const isCurrent = idx === currentLevelIdx && gameStage === 'hacking';
              return (
                <div
                  key={lvl.level}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                    isCurrent
                      ? 'bg-cyan-500/20 border-cyan-400 ring-2 ring-cyan-400/50 shadow-lg'
                      : isPast
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-500'
                  }`}
                >
                  <span className="text-[10px] font-mono uppercase tracking-wider">Tier {lvl.level}</span>
                  <span className="text-xs font-black text-amber-300">
                    {lvl.multiplier * (isNgip ? 3 : 1)}X
                  </span>
                </div>
              );
            })}
          </div>

          {/* Terminal Box */}
          <div className="bg-slate-900/90 border-2 border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
            {/* Terminal Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-2 text-cyan-400">
                <Terminal className="w-4 h-4" />
                <span>SEC-NODE://{currentLevel.name.replace(/\s+/g, '_').toUpperCase()}</span>
              </div>
              {gameStage === 'hacking' && (
                <div className={`px-2 py-0.5 rounded font-black ${timeLeft <= 5 ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-cyan-500/20 text-cyan-300'}`}>
                  ⏳ {timeLeft}s REMAINING
                </div>
              )}
            </div>

            {gameStage === 'betting' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/30">
                  <Lock className="w-8 h-8 text-cyan-300" />
                </div>
                <h3 className="text-xl font-black text-white">4-Tier Decryption Node</h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  Crack the secret security codes across 4 tiers. Enjoy guaranteed <span className="text-amber-400 font-bold">3X Multiplier Payouts</span> for all งip members!
                </p>
                <button
                  onClick={handleStartInfiltration}
                  className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 via-purple-600 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-white font-black rounded-xl text-base shadow-xl shadow-cyan-500/30 active:scale-95 transition-all"
                >
                  START INFILTRATION
                </button>
              </div>
            )}

            {gameStage === 'hacking' && (
              <div className="space-y-4">
                {/* Code display boxes */}
                <div className="flex justify-center gap-2 my-4">
                  {Array.from({ length: currentLevel.codeLength }).map((_, i) => {
                    const digit = currentGuess[i];
                    return (
                      <div
                        key={i}
                        className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-mono font-black ${
                          digit
                            ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/30'
                            : 'bg-slate-950 border-slate-700 text-slate-600'
                        }`}
                      >
                        {digit || '•'}
                      </div>
                    );
                  })}
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      onClick={() => handleKeypadPress(digit)}
                      className="py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-lg font-mono font-black text-slate-200 active:scale-95 transition-all"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    onClick={handleBackspace}
                    className="py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-mono font-bold text-rose-400 active:scale-95 transition-all"
                  >
                    DEL
                  </button>
                  <button
                    onClick={() => handleKeypadPress('0')}
                    className="py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-lg font-mono font-black text-slate-200 active:scale-95 transition-all"
                  >
                    0
                  </button>
                  <button
                    onClick={handleSubmitGuess}
                    disabled={currentGuess.length !== currentLevel.codeLength}
                    className="py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed border border-cyan-400 rounded-xl text-xs font-mono font-bold text-white active:scale-95 transition-all shadow-md shadow-cyan-500/30"
                  >
                    DECRYPT
                  </button>
                </div>

                {/* Early Cash Out Button */}
                {toBigInt(totalWonAccumulated) > 0n && (
                  <button
                    onClick={handleCashOut}
                    className="w-full py-2.5 mt-2 bg-emerald-600/90 hover:bg-emerald-500 border border-emerald-400 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-lg"
                  >
                    💰 EXTRACT SECURED WINNINGS (+{formatCompactCurrency(totalWonAccumulated)} {CURRENCY_CONFIG[selectedCurrency].symbol})
                  </button>
                )}
              </div>
            )}

            {(gameStage === 'success' || gameStage === 'failed') && (
              <div className="text-center py-6 space-y-3">
                {gameStage === 'success' ? (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                      <Unlock className="w-8 h-8 text-emerald-300" />
                    </div>
                    <h3 className="text-2xl font-black text-emerald-300">
                      VAULT DECIPHER COMPLETE!
                    </h3>
                    <p className="text-sm font-bold text-amber-300">
                      +{formatCompactCurrency(totalWonAccumulated)} {CURRENCY_CONFIG[selectedCurrency].name} Won (with 3X งip boost)!
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/30">
                      <AlertTriangle className="w-8 h-8 text-rose-300" />
                    </div>
                    <h3 className="text-xl font-black text-rose-400">INFILTRATION COMPROMISED</h3>
                    <p className="text-xs text-slate-400">The vault defense locked you out. The code was {targetCode}.</p>
                  </>
                )}

                <button
                  onClick={() => setGameStage('betting')}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 mt-2"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Stake Config & Hints Log */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Bet Controls */}
          <div className="bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-5 shadow-xl backdrop-blur-md">
            <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase text-slate-300 tracking-wider">Stake & Currencies</span>
              <span className="text-xs font-mono font-black text-cyan-300">
                {formatCompactCurrency(userBalance)} {CURRENCY_CONFIG[selectedCurrency].symbol}
              </span>
            </div>

            {/* Currency selector */}
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {(['diamond', 'amethyst', 'jade', 'ruby'] as CurrencyType[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  disabled={gameStage === 'hacking'}
                  onClick={() => setSelectedCurrency(c)}
                  className={`p-2 rounded-xl border text-center text-xs font-bold transition-all ${
                    selectedCurrency === c
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <span className="block text-base">{CURRENCY_CONFIG[c].symbol}</span>
                  <span className="text-[10px] capitalize">{CURRENCY_CONFIG[c].name}</span>
                </button>
              ))}
            </div>

            {/* Stake Input */}
            <div className="relative mb-2">
              <input
                type="text"
                value={betAmount}
                disabled={gameStage === 'hacking'}
                onChange={(e) => setBetAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3 py-2 text-sm font-mono font-black text-cyan-200 focus:outline-none"
                placeholder="50000"
              />
            </div>
          </div>

          {/* Feedback & History Log */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Decryption Log & Analyzer
            </h4>

            {guessHistory.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-4">
                Submit a guess to analyze correct digits & positions.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 font-mono text-xs">
                {guessHistory.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-slate-800"
                  >
                    <span className="font-bold text-cyan-300 tracking-widest">{h.guess}</span>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-emerald-400 font-bold">🟢 {h.exact} Exact</span>
                      <span className="text-amber-400 font-bold">🟡 {h.exists} Misplaced</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
