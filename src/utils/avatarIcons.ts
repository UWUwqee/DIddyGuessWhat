import React from 'react';

export interface PresetAvatar {
  id: string;
  name: string;
  category: 'cyber' | 'fantasy' | 'heroes' | 'retro';
  gradient: string;
  iconBg: string;
  svgDataUri: string;
}

// Helper to encode SVG string to data URI
const toSvgUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

export const PRESET_AVATARS: PresetAvatar[] = [
  {
    id: 'avatar_cosmic_astro',
    name: 'Cosmic Explorer',
    category: 'cyber',
    gradient: 'from-indigo-600 to-blue-500',
    iconBg: '#3B82F6',
    svgDataUri: toSvgUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="bg_astro" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1E1B4B" />
            <stop offset="100%" stop-color="#4338CA" />
          </linearGradient>
          <linearGradient id="visor" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38BDF8" />
            <stop offset="100%" stop-color="#0284C7" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill="url(#bg_astro)" />
        <circle cx="50" cy="46" r="26" fill="#F8FAFC" />
        <ellipse cx="50" cy="46" rx="20" ry="14" fill="url(#visor)" />
        <ellipse cx="44" cy="42" rx="6" ry="3" fill="#BAE6FD" opacity="0.8" />
        <path d="M30 76 Q50 68 70 76 L74 94 Q50 96 26 94 Z" fill="#E2E8F0" />
        <circle cx="50" cy="80" r="3" fill="#6366F1" />
      </svg>
    `),
  },
  {
    id: 'avatar_cyber_fox',
    name: 'Cyber Fox',
    category: 'cyber',
    gradient: 'from-amber-500 to-orange-600',
    iconBg: '#F97316',
    svgDataUri: toSvgUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="bg_fox" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#451A03" />
            <stop offset="100%" stop-color="#EA580C" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill="url(#bg_fox)" />
        <polygon points="24,20 38,44 20,48" fill="#F97316" />
        <polygon points="76,20 62,44 80,48" fill="#F97316" />
        <polygon points="28,26 36,42 24,45" fill="#FEE2E2" />
        <polygon points="72,26 64,42 76,45" fill="#FEE2E2" />
        <polygon points="50,78 22,46 78,46" fill="#FB923C" />
        <polygon points="50,78 32,54 68,54" fill="#FFFFFF" />
        <circle cx="38" cy="50" r="4" fill="#0EA5E9" />
        <circle cx="62" cy="50" r="4" fill="#0EA5E9" />
        <polygon points="50,66 45,60 55,60" fill="#1E293B" />
      </svg>
    `),
  },
  {
    id: 'avatar_neon_bot',
    name: 'Arcade Mech',
    category: 'cyber',
    gradient: 'from-cyan-500 to-teal-600',
    iconBg: '#06B6D4',
    svgDataUri: toSvgUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="bg_bot" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#042F2E" />
            <stop offset="100%" stop-color="#0D9488" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill="url(#bg_bot)" />
        <line x1="50" y1="18" x2="50" y2="28" stroke="#38BDF8" stroke-width="4" stroke-linecap="round" />
        <circle cx="50" cy="16" r="4" fill="#F43F5E" />
        <rect x="25" y="28" width="50" height="42" rx="10" fill="#1E293B" stroke="#06B6D4" stroke-width="3" />
        <rect x="33" y="38" width="34" height="14" rx="4" fill="#020617" />
        <circle cx="42" cy="45" r="3.5" fill="#22D3EE" />
        <circle cx="58" cy="45" r="3.5" fill="#22D3EE" />
        <line x1="38" y1="60" x2="62" y2="60" stroke="#06B6D4" stroke-width="2" stroke-linecap="round" />
      </svg>
    `),
  },
  {
    id: 'avatar_shadow_ninja',
    name: 'Shadow Ninja',
    category: 'heroes',
    gradient: 'from-slate-800 to-purple-900',
    iconBg: '#8B5CF6',
    svgDataUri: toSvgUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="bg_ninja" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0F172A" />
            <stop offset="100%" stop-color="#3B0764" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill="url(#bg_ninja)" />
        <circle cx="50" cy="48" r="26" fill="#1E293B" />
        <rect x="24" y="34" width="52" height="12" fill="#7C3AED" />
        <ellipse cx="50" cy="48" rx="18" ry="6" fill="#FEF08A" />
        <circle cx="42" cy="48" r="2.5" fill="#0F172A" />
        <circle cx="58" cy="48" r="2.5" fill="#0F172A" />
        <path d="M28 66 C35 78 65 78 72 66 L80 94 L20 94 Z" fill="#0F172A" />
      </svg>
    `),
  },
  {
    id: 'avatar_mystic_wizard',
    name: 'Mystic Mage',
    category: 'fantasy',
    gradient: 'from-purple-600 to-pink-600',
    iconBg: '#A855F7',
    svgDataUri: toSvgUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="bg_wiz" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#3B0764" />
            <stop offset="100%" stop-color="#9333EA" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill="url(#bg_wiz)" />
        <circle cx="50" cy="50" r="18" fill="#FED7AA" />
        <polygon points="50,12 28,42 72,42" fill="#7E22CE" />
        <ellipse cx="50" cy="42" rx="26" ry="6" fill="#581C87" />
        <polygon points="50,30 46,38 54,38" fill="#FDE047" />
        <path d="M36 56 Q50 78 64 56 Q50 86 36 56 Z" fill="#F8FAFC" />
        <circle cx="44" cy="48" r="2" fill="#3B0764" />
        <circle cx="56" cy="48" r="2" fill="#3B0764" />
      </svg>
    `),
  },
  {
    id: 'avatar_cyber_cat',
    name: 'Galactic Cat',
    category: 'heroes',
    gradient: 'from-pink-500 to-rose-600',
    iconBg: '#EC4899',
    svgDataUri: toSvgUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="bg_cat" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#500724" />
            <stop offset="100%" stop-color="#DB2777" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill="url(#bg_cat)" />
        <polygon points="26,26 40,46 22,48" fill="#F472B6" />
        <polygon points="74,26 60,46 78,48" fill="#F472B6" />
        <polygon points="30,32 38,44 26,45" fill="#FDF2F8" />
        <polygon points="70,32 62,44 74,45" fill="#FDF2F8" />
        <circle cx="50" cy="54" r="24" fill="#F472B6" />
        <ellipse cx="40" cy="50" rx="4" ry="5" fill="#1E1B4B" />
        <ellipse cx="60" cy="50" rx="4" ry="5" fill="#1E1B4B" />
        <circle cx="41" cy="48" r="1.5" fill="#FFFFFF" />
        <circle cx="61" cy="48" r="1.5" fill="#FFFFFF" />
        <polygon points="50,58 46,54 54,54" fill="#BE185D" />
        <path d="M46 62 Q50 66 54 62" stroke="#BE185D" stroke-width="2" fill="none" />
      </svg>
    `),
  },
  {
    id: 'avatar_pixel_samurai',
    name: 'Pixel Samurai',
    category: 'retro',
    gradient: 'from-rose-600 to-red-700',
    iconBg: '#E11D48',
    svgDataUri: toSvgUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="bg_sam" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4C0519" />
            <stop offset="100%" stop-color="#BE123C" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill="url(#bg_sam)" />
        <circle cx="50" cy="50" r="20" fill="#FED7AA" />
        <path d="M26 36 C34 20 66 20 74 36 L70 46 L30 46 Z" fill="#991B1B" />
        <polygon points="50,18 44,30 56,30" fill="#FBBF24" />
        <rect x="34" y="44" width="32" height="6" fill="#1C1917" />
        <line x1="38" y1="47" x2="44" y2="47" stroke="#F8FAFC" stroke-width="2" />
        <line x1="56" y1="47" x2="62" y2="47" stroke="#F8FAFC" stroke-width="2" />
      </svg>
    `),
  },
  {
    id: 'avatar_crown_king',
    name: 'Grand Champion',
    category: 'fantasy',
    gradient: 'from-amber-400 to-yellow-600',
    iconBg: '#EAB308',
    svgDataUri: toSvgUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="bg_crown" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#422006" />
            <stop offset="100%" stop-color="#CA8A04" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill="url(#bg_crown)" />
        <polygon points="26,44 32,24 50,34 68,24 74,44" fill="#FDE047" stroke="#CA8A04" stroke-width="2" />
        <circle cx="32" cy="24" r="3" fill="#EF4444" />
        <circle cx="50" cy="34" r="3" fill="#3B82F6" />
        <circle cx="68" cy="24" r="3" fill="#10B981" />
        <circle cx="50" cy="60" r="16" fill="#FEF08A" />
        <path d="M42 58 Q50 64 58 58" stroke="#854D0E" stroke-width="2" fill="none" />
      </svg>
    `),
  },
  {
    id: 'avatar_quantum_dragon',
    name: 'Storm Dragon',
    category: 'fantasy',
    gradient: 'from-emerald-500 to-teal-700',
    iconBg: '#10B981',
    svgDataUri: toSvgUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="bg_drag" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#064E3B" />
            <stop offset="100%" stop-color="#059669" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill="url(#bg_drag)" />
        <polygon points="20,30 36,44 18,48" fill="#34D399" />
        <polygon points="80,30 64,44 82,48" fill="#34D399" />
        <path d="M30 40 Q50 30 70 40 Q74 65 50 82 Q26 65 30 40 Z" fill="#10B981" />
        <polygon points="50,42 42,52 58,52" fill="#047857" />
        <circle cx="40" cy="46" r="3" fill="#FBBF24" />
        <circle cx="60" cy="46" r="3" fill="#FBBF24" />
        <circle cx="40" cy="46" r="1" fill="#000" />
        <circle cx="60" cy="46" r="1" fill="#000" />
      </svg>
    `),
  },
];

export function getAvatarDataUri(avatarIdOrData?: string | null): string {
  if (!avatarIdOrData) return PRESET_AVATARS[0].svgDataUri;

  // Direct image URLs or Data URIs (Base64 JPEG/PNG from uploaded images)
  if (
    avatarIdOrData.startsWith('data:image/') ||
    avatarIdOrData.startsWith('http://') ||
    avatarIdOrData.startsWith('https://') ||
    avatarIdOrData.startsWith('blob:')
  ) {
    return avatarIdOrData;
  }

  // Preset Avatar IDs
  const found = PRESET_AVATARS.find((a) => a.id === avatarIdOrData);
  if (found) return found.svgDataUri;

  // If avatar is an emoji or short symbol, render a high-quality SVG circle with the emoji
  if (avatarIdOrData.length <= 4) {
    return toSvgUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="bg_emoji" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4F46E5" />
            <stop offset="100%" stop-color="#9333EA" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#bg_emoji)" />
        <text x="50" y="56" font-size="44" text-anchor="middle" dominant-baseline="central">${avatarIdOrData}</text>
      </svg>
    `);
  }

  return PRESET_AVATARS[0].svgDataUri;
}

