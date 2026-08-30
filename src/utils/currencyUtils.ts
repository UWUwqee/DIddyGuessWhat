import { CurrencyType, UserWallet } from '../types';

export interface CurrencyMeta {
  id: CurrencyType;
  name: string;
  pluralName: string;
  symbol: string;
  icon: string; // Emoji/icon representation
  themeColor: string;
  textColor: string;
  borderColor: string;
  bgColor: string;
  gradient: string;
  defaultStarter: string;
  description: string;
}

export const CURRENCY_CONFIG: Record<CurrencyType, CurrencyMeta> = {
  diamond: {
    id: 'diamond',
    name: 'Diamond',
    pluralName: 'Diamonds',
    symbol: '💎',
    icon: '💎',
    themeColor: '#38BDF8',
    textColor: 'text-sky-500 dark:text-sky-400',
    borderColor: 'border-sky-300 dark:border-sky-700',
    bgColor: 'bg-sky-50 dark:bg-sky-950/60',
    gradient: 'from-sky-500 via-blue-500 to-indigo-600',
    defaultStarter: '10000', // 10,000 starter
    description: 'The dazzling blue gem of high society & VIP status',
  },
  amethyst: {
    id: 'amethyst',
    name: 'Amethyst',
    pluralName: 'Amethysts',
    symbol: '🔮',
    icon: '🔮',
    themeColor: '#A855F7',
    textColor: 'text-purple-500 dark:text-purple-400',
    borderColor: 'border-purple-300 dark:border-purple-700',
    bgColor: 'bg-purple-50 dark:bg-purple-950/60',
    gradient: 'from-purple-500 via-fuchsia-500 to-pink-600',
    defaultStarter: '10000', // 10,000 starter
    description: 'Mystical purple crystal of arcade mastery and arena duels',
  },
  jade: {
    id: 'jade',
    name: 'Jade',
    pluralName: 'Jades',
    symbol: '🍵',
    icon: '🍵',
    themeColor: '#10B981',
    textColor: 'text-emerald-500 dark:text-emerald-400',
    borderColor: 'border-emerald-300 dark:border-emerald-700',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/60',
    gradient: 'from-emerald-500 via-teal-500 to-green-600',
    defaultStarter: '10000', // 10,000 starter
    description: 'Ancient green treasure of fortune and continuous winning streaks',
  },
  ruby: {
    id: 'ruby',
    name: 'Ruby',
    pluralName: 'Rubies',
    symbol: '♦️',
    icon: '♦️',
    themeColor: '#EF4444',
    textColor: 'text-rose-500 dark:text-rose-400',
    borderColor: 'border-rose-300 dark:border-rose-700',
    bgColor: 'bg-rose-50 dark:bg-rose-950/60',
    gradient: 'from-rose-500 via-red-500 to-amber-600',
    defaultStarter: '10000', // 10,000 starter
    description: 'Fiery crimson high-roller jewel for ultimate stakes and massive jackpots',
  },
};

export const INITIAL_DEFAULT_WALLET: UserWallet = {
  diamonds: '10000',
  amethysts: '10000',
  jades: '10000',
  rubies: '10000',
};

/**
 * Parses any string, number, or bigint safely into a BigInt without throwing
 */
export function toBigInt(val: string | number | bigint | undefined | null): bigint {
  if (val === undefined || val === null || val === '') return 0n;
  if (typeof val === 'bigint') return val;
  if (typeof val === 'number') {
    if (isNaN(val) || !isFinite(val)) return 0n;
    return BigInt(Math.floor(Math.max(0, val)));
  }
  try {
    // Remove non-digit chars (e.g. commas or spaces)
    const clean = val.replace(/[^0-9]/g, '');
    if (!clean) return 0n;
    return BigInt(clean);
  } catch {
    return 0n;
  }
}

/**
 * Formats a BigInt or string with standard locale commas (e.g. 1,000,000,000,000,000,000,000)
 */
export function formatFullCurrency(val: string | number | bigint | undefined | null): string {
  const bi = toBigInt(val);
  const str = bi.toString();
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Compact formatting supporting huge BigInt numbers:
 * K (10^3), M (10^6), B (10^9), T (10^12), Qa (10^15), Qi (10^18),
 * Sx (10^21 - Sextillion), Sp (10^24), Oc (10^27), No (10^30), Dc (10^33), etc.
 */
const SUFFIXES: [bigint, string][] = [
  [10n ** 33n, 'Dc'], // Decillion
  [10n ** 30n, 'No'], // Nonillion
  [10n ** 27n, 'Oc'], // Octillion
  [10n ** 24n, 'Sp'], // Septillion
  [10n ** 21n, 'Sx'], // Sextillion (1,000,000,000,000,000,000,000)
  [10n ** 18n, 'Qi'], // Quintillion
  [10n ** 15n, 'Qa'], // Quadrillion
  [10n ** 12n, 'T'],  // Trillion
  [10n ** 9n, 'B'],   // Billion
  [10n ** 6n, 'M'],   // Million
  [10n ** 3n, 'K'],   // Thousand
];

export function formatCompactCurrency(val: string | number | bigint | undefined | null): string {
  const bi = toBigInt(val);
  if (bi < 1000n) {
    return bi.toString();
  }

  for (const [threshold, suffix] of SUFFIXES) {
    if (bi >= threshold) {
      // Calculate decimal part with 2 decimal places precision
      const whole = bi / threshold;
      const remainder = (bi % threshold) / (threshold / 100n);
      if (remainder === 0n || whole >= 100n) {
        return `${whole}${suffix}`;
      } else if (remainder < 10n) {
        return `${whole}.${remainder}0${suffix}`.replace('.00', '');
      } else {
        const dec = Number(remainder) / 100;
        const formatted = (Number(whole) + dec).toFixed(1).replace(/\.0$/, '');
        return `${formatted}${suffix}`;
      }
    }
  }

  return bi.toString();
}

/**
 * BigInt Addition helper
 */
export function addCurrency(a: string | number | bigint, b: string | number | bigint): string {
  const sum = toBigInt(a) + toBigInt(b);
  return sum.toString();
}

/**
 * BigInt Subtraction helper (floored at 0)
 */
export function subCurrency(a: string | number | bigint, b: string | number | bigint): string {
  const biA = toBigInt(a);
  const biB = toBigInt(b);
  if (biB >= biA) return '0';
  return (biA - biB).toString();
}

/**
 * BigInt Multiply helper
 */
export function mulCurrency(a: string | number | bigint, multiplier: number | bigint): string {
  const biA = toBigInt(a);
  const mult = typeof multiplier === 'bigint' ? multiplier : BigInt(Math.floor(multiplier));
  return (biA * mult).toString();
}

/**
 * Checks if user has enough currency in wallet
 */
export function canAfford(wallet: UserWallet | undefined | null, currency: CurrencyType, amount: string | number | bigint): boolean {
  if (!wallet) return false;
  const current = toBigInt(wallet[getWalletKey(currency)]);
  const needed = toBigInt(amount);
  return current >= needed;
}

export function getWalletKey(currency: CurrencyType): keyof UserWallet {
  switch (currency) {
    case 'diamond':
      return 'diamonds';
    case 'amethyst':
      return 'amethysts';
    case 'jade':
      return 'jades';
    case 'ruby':
      return 'rubies';
  }
}

/**
 * Preset quick bet amounts for UI selection
 */
export const PRESET_BET_AMOUNTS: { label: string; value: string; tier: string }[] = [
  { label: '100', value: '100', tier: 'Casual' },
  { label: '1,000', value: '1000', tier: 'Casual' },
  { label: '10K', value: '10000', tier: 'Beginner' },
  { label: '100K', value: '100000', tier: 'Pro' },
  { label: '1M', value: '1000000', tier: 'Master' },
  { label: '10M', value: '10000000', tier: 'VIP' },
  { label: '100M', value: '100000000', tier: 'Grandmaster' },
  { label: '1B', value: '1000000000', tier: 'Billionaire' },
  { label: '100B', value: '100000000000', tier: 'Titan' },
  { label: '1T', value: '1000000000000', tier: 'Trillionaire' },
  { label: '1Q', value: '1000000000000000000', tier: 'Quintillionaire' },
  { label: '1 Sextillion', value: '1000000000000000000000', tier: 'Cosmic God' },
];

export const BET_PRESET_PACKAGES = [
  { label: '10K', amount: '10000' },
  { label: '100K', amount: '100000' },
  { label: '1M', amount: '1000000' },
  { label: '10M', amount: '10000000' },
  { label: '100M', amount: '100000000' },
  { label: '1B', amount: '1000000000' },
  { label: '1T', amount: '1000000000000' },
  { label: '1 Sextillion 🔥', amount: '1000000000000000000000' },
];

/**
 * Quick Admin grant packages
 */
export const ADMIN_GRANT_PACKAGES: { label: string; amount: string; desc: string }[] = [
  { label: '+10 Million', amount: '10000000', desc: '+10,000,000' },
  { label: '+1 Billion', amount: '1000000000', desc: '+1,000,000,000' },
  { label: '+100 Billion', amount: '100000000000', desc: '+100,000,000,000' },
  { label: '+1 Trillion', amount: '1000000000000', desc: '+1,000,000,000,000' },
  { label: '+100 Trillion', amount: '100000000000000', desc: '+100,000,000,000,000' },
  { label: '+1 Quintillion', amount: '1000000000000000000', desc: '+1,000,000,000,000,000,000' },
  { label: '+1 Sextillion 🔥', amount: '1000000000000000000000', desc: '+1,000,000,000,000,000,000,000' },
];

/**
 * Quick Admin reduction packages
 */
export const ADMIN_REDUCE_PACKAGES: { label: string; amount: string; desc: string }[] = [
  { label: '-10 Million', amount: '10000000', desc: '-10,000,000' },
  { label: '-1 Billion', amount: '1000000000', desc: '-1,000,000,000' },
  { label: '-100 Billion', amount: '100000000000', desc: '-100,000,000,000' },
  { label: '-1 Trillion', amount: '1000000000000', desc: '-1,000,000,000,000' },
  { label: '-100 Trillion', amount: '100000000000000', desc: '-100,000,000,000,000' },
  { label: '-1 Quintillion', amount: '1000000000000000000', desc: '-1,000,000,000,000,000,000' },
  { label: '-1 Sextillion 📉', amount: '1000000000000000000000', desc: '-1,000,000,000,000,000,000,000' },
];

/**
 * Quick Admin Set Exact Presets
 */
export const ADMIN_SET_EXACT_PRESETS: { label: string; amount: string; desc: string }[] = [
  { label: 'Reset to 0', amount: '0', desc: '0 (Empty)' },
  { label: '10,000 (Starter)', amount: '10000', desc: '10,000' },
  { label: '1 Million', amount: '1000000', desc: '1,000,000' },
  { label: '1 Billion', amount: '1000000000', desc: '1,000,000,000' },
  { label: '1 Trillion', amount: '1000000000000', desc: '1,000,000,000,000' },
  { label: '1 Sextillion 🔥', amount: '1000000000000000000000', desc: '1,000,000,000,000,000,000,000' },
];
