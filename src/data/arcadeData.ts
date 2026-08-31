import { MemoryScene } from '../types';

export interface AiChallengePrompt {
  id: string;
  word: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  tips: string;
  expectedFeatures: string[]; // Key visual cues AI checks for
}

export const AI_SKETCH_PROMPTS: AiChallengePrompt[] = [
  {
    id: 'ai-1',
    word: 'Cat',
    category: 'Animals',
    difficulty: 'easy',
    points: 100,
    tips: 'Draw pointy ears, whiskers, and a long curved tail!',
    expectedFeatures: ['triangular ears', 'whiskers', 'oval body', 'tail'],
  },
  {
    id: 'ai-2',
    word: 'Pizza',
    category: 'Food',
    difficulty: 'easy',
    points: 100,
    tips: 'Draw a triangle slice with circles for pepperoni!',
    expectedFeatures: ['triangle slice', 'crust line', 'pepperoni circles'],
  },
  {
    id: 'ai-3',
    word: 'Rocket',
    category: 'Space',
    difficulty: 'easy',
    points: 110,
    tips: 'Draw a pointy cylinder with side fins and exhaust fire!',
    expectedFeatures: ['pointy top', 'body tube', 'fins', 'fire flames'],
  },
  {
    id: 'ai-4',
    word: 'Guitar',
    category: 'Music',
    difficulty: 'easy',
    points: 110,
    tips: 'Draw a figure-8 body with a long neck and strings!',
    expectedFeatures: ['hourglass body', 'long neck', 'sound hole', 'headstock'],
  },
  {
    id: 'ai-5',
    word: 'Bicycle',
    category: 'Vehicles',
    difficulty: 'medium',
    points: 180,
    tips: 'Draw two round wheels connected by triangle frame and handlebars!',
    expectedFeatures: ['two wheels', 'triangle frame', 'handlebars', 'seat'],
  },
  {
    id: 'ai-6',
    word: 'Sun',
    category: 'Nature',
    difficulty: 'easy',
    points: 90,
    tips: 'Draw a center circle with radiating ray lines all around!',
    expectedFeatures: ['center circle', 'sun rays', 'yellow color'],
  },
  {
    id: 'ai-7',
    word: 'House',
    category: 'Buildings',
    difficulty: 'easy',
    points: 100,
    tips: 'Draw a square base, triangular roof, door, and windows!',
    expectedFeatures: ['square base', 'triangle roof', 'door', 'chimney'],
  },
  {
    id: 'ai-8',
    word: 'Tree',
    category: 'Nature',
    difficulty: 'easy',
    points: 90,
    tips: 'Draw a vertical trunk with a fluffy cloud-like green top!',
    expectedFeatures: ['vertical trunk', 'fluffy canopy', 'leaves'],
  },
  {
    id: 'ai-9',
    word: 'Octopus',
    category: 'Animals',
    difficulty: 'medium',
    points: 190,
    tips: 'Draw a bulbous head with 8 wavy tentacles hanging down!',
    expectedFeatures: ['large bulb head', 'curved tentacles', 'eyes'],
  },
  {
    id: 'ai-10',
    word: 'Cupcake',
    category: 'Food',
    difficulty: 'easy',
    points: 100,
    tips: 'Draw a cup base, swirled frosting, and a cherry on top!',
    expectedFeatures: ['trapezoid wrapper', 'swirled frosting', 'cherry'],
  },
  {
    id: 'ai-11',
    word: 'Elephant',
    category: 'Animals',
    difficulty: 'medium',
    points: 200,
    tips: 'Draw a big round body, large floppy ears, and a long trunk!',
    expectedFeatures: ['curved trunk', 'huge ears', 'four thick legs'],
  },
  {
    id: 'ai-12',
    word: 'Ice Cream',
    category: 'Food',
    difficulty: 'easy',
    points: 100,
    tips: 'Draw a triangle cone with scoops of ice cream on top!',
    expectedFeatures: ['cone with grid', 'round scoops', 'drips'],
  },
  {
    id: 'ai-13',
    word: 'Castle',
    category: 'Buildings',
    difficulty: 'hard',
    points: 250,
    tips: 'Draw tall towers, battlements, flags, and a big arched gate!',
    expectedFeatures: ['multiple towers', 'notched battlements', 'flags', 'arch door'],
  },
  {
    id: 'ai-14',
    word: 'Dragon',
    category: 'Fantasy',
    difficulty: 'hard',
    points: 300,
    tips: 'Draw big wings, horns, a long tail, and fire breath!',
    expectedFeatures: ['bat wings', 'horns', 'fire breath', 'reptile tail'],
  },
  {
    id: 'ai-15',
    word: 'Spaceship',
    category: 'Space',
    difficulty: 'medium',
    points: 210,
    tips: 'Draw a flying saucer dome with glowing lights and beam!',
    expectedFeatures: ['saucer disc', 'glass cockpit dome', 'thruster beam'],
  },
];

export const MEMORY_SCENES: MemoryScene[] = [
  {
    id: 'scene-1',
    title: 'Sunny Countryside Meadow',
    theme: 'Nature',
    backgroundColor: '#E0F2FE',
    targetCount: 4,
    items: [
      { name: 'Sun', color: '#F59E0B', shape: 'sun', x: 200, y: 150, size: 80 },
      { name: 'Red Cottage', color: '#EF4444', shape: 'house', x: 500, y: 550, size: 140 },
      { name: 'Pine Tree', color: '#10B981', shape: 'tree', x: 800, y: 520, size: 130 },
      { name: 'Fluffy Cloud', color: '#94A3B8', shape: 'cloud', x: 650, y: 180, size: 90 },
    ],
  },
  {
    id: 'scene-2',
    title: 'Midnight Stargazer Orbit',
    theme: 'Space',
    backgroundColor: '#0F172A',
    targetCount: 4,
    items: [
      { name: 'Golden Star', color: '#FBBF24', shape: 'star', x: 250, y: 200, size: 70 },
      { name: 'Silver Star', color: '#E2E8F0', shape: 'star', x: 750, y: 220, size: 60 },
      { name: 'Cosmic Moon', color: '#F8FAFC', shape: 'circle', x: 500, y: 180, size: 90 },
      { name: 'Red Rocket', color: '#EF4444', shape: 'triangle', x: 500, y: 600, size: 120 },
    ],
  },
  {
    id: 'scene-3',
    title: 'Enchanted Forest Grove',
    theme: 'Fantasy',
    backgroundColor: '#ECFDF5',
    targetCount: 5,
    items: [
      { name: 'Emerald Tree', color: '#059669', shape: 'tree', x: 300, y: 500, size: 150 },
      { name: 'Autumn Tree', color: '#D97706', shape: 'tree', x: 700, y: 520, size: 140 },
      { name: 'Magic Star', color: '#8B5CF6', shape: 'star', x: 500, y: 250, size: 80 },
      { name: 'Sunbeam', color: '#FDE047', shape: 'sun', x: 800, y: 160, size: 80 },
      { name: 'Forest Cabin', color: '#78350F', shape: 'house', x: 500, y: 650, size: 120 },
    ],
  },
];

export const DUEL_PROMPTS = [
  'Futuristic Cyber Car 🏎️',
  'Fierce Fire-Breathing Dragon 🐉',
  'Cute Galaxy Cat in Space 🐱🚀',
  'Gigantic Cheesy Burger Tower 🍔',
  'Haunted Ghost Ship at Sea ⛵👻',
  'Robotic Samurai Warrior 🤖⚔️',
  'Enchanted Flying Castle 🏰✨',
  'Giant Octopus Sinking a Submarine 🐙⚓',
  'Cyberpunk Neon City Skyline 🏙️⚡',
  'Superhero Saving a Puppy 🦸‍♂️🐶',
];
