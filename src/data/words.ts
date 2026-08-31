import { WordCategory, WordChoice, WordDifficulty } from '../types';

export interface RawWord {
  word: string;
  category: WordCategory;
  difficulty: WordDifficulty;
  points: number;
  hint: string;
}

export const WORD_DATABASE: RawWord[] = [
  // ANIMALS (Easy, Med, Hard)
  { word: 'Cat', category: 'animals', difficulty: 'easy', points: 100, hint: 'A common furry pet that meows' },
  { word: 'Dog', category: 'animals', difficulty: 'easy', points: 100, hint: 'Mans best friend' },
  { word: 'Duck', category: 'animals', difficulty: 'easy', points: 100, hint: 'Quacks and floats on water' },
  { word: 'Elephant', category: 'animals', difficulty: 'easy', points: 120, hint: 'Has a long trunk and big ears' },
  { word: 'Giraffe', category: 'animals', difficulty: 'easy', points: 120, hint: 'Tallest animal in the world' },
  { word: 'Penguin', category: 'animals', difficulty: 'easy', points: 120, hint: 'Flightless bird in a tuxedo' },
  { word: 'Lion', category: 'animals', difficulty: 'easy', points: 110, hint: 'King of the jungle' },
  { word: 'Rabbit', category: 'animals', difficulty: 'easy', points: 100, hint: 'Loves carrots and hops' },
  { word: 'Shark', category: 'animals', difficulty: 'easy', points: 110, hint: 'Ocean predator with a dorsal fin' },
  { word: 'Snake', category: 'animals', difficulty: 'easy', points: 100, hint: 'Slithering reptile' },
  { word: 'Butterfly', category: 'animals', difficulty: 'easy', points: 120, hint: 'Colorful winged insect' },
  { word: 'Kangaroo', category: 'animals', difficulty: 'medium', points: 200, hint: 'Has a pouch and hops' },
  { word: 'Chameleon', category: 'animals', difficulty: 'medium', points: 220, hint: 'Changes color to blend in' },
  { word: 'Flamingo', category: 'animals', difficulty: 'medium', points: 200, hint: 'Pink bird that stands on one leg' },
  { word: 'Octopus', category: 'animals', difficulty: 'medium', points: 200, hint: 'Eight tentacled sea creature' },
  { word: 'Hedgehog', category: 'animals', difficulty: 'medium', points: 220, hint: 'Small spiky animal' },
  { word: 'Platypus', category: 'animals', difficulty: 'hard', points: 300, hint: 'Egg-laying mammal with a duck bill' },
  { word: 'Axolotl', category: 'animals', difficulty: 'hard', points: 320, hint: 'Mexican walking fish salamander' },
  { word: 'Hummingbird', category: 'animals', difficulty: 'hard', points: 300, hint: 'Tiny bird that hovers fast' },
  { word: 'Narwhal', category: 'animals', difficulty: 'hard', points: 320, hint: 'Unicorn of the ocean' },

  // FOOD
  { word: 'Pizza', category: 'food', difficulty: 'easy', points: 100, hint: 'Cheesy slice with toppings' },
  { word: 'Burger', category: 'food', difficulty: 'easy', points: 100, hint: 'Patty between sesame buns' },
  { word: 'Ice Cream', category: 'food', difficulty: 'easy', points: 110, hint: 'Sweet frozen dessert in a cone' },
  { word: 'Banana', category: 'food', difficulty: 'easy', points: 100, hint: 'Yellow curved peelable fruit' },
  { word: 'Apple', category: 'food', difficulty: 'easy', points: 100, hint: 'Red or green fruit on a tree' },
  { word: 'Donut', category: 'food', difficulty: 'easy', points: 100, hint: 'Ring-shaped fried dough with glaze' },
  { word: 'Taco', category: 'food', difficulty: 'easy', points: 110, hint: 'Folded tortilla with fillings' },
  { word: 'Sushi', category: 'food', difficulty: 'medium', points: 200, hint: 'Japanese raw fish and rice roll' },
  { word: 'Spaghetti', category: 'food', difficulty: 'medium', points: 210, hint: 'Long noodles with tomato sauce' },
  { word: 'Croissant', category: 'food', difficulty: 'medium', points: 220, hint: 'Flaky crescent-shaped French pastry' },
  { word: 'Avocado', category: 'food', difficulty: 'medium', points: 200, hint: 'Green pear-shaped fruit with big seed' },
  { word: 'Dumpling', category: 'food', difficulty: 'medium', points: 220, hint: 'Steamed dough pocket with meat' },
  { word: 'Fondue', category: 'food', difficulty: 'hard', points: 300, hint: 'Melted cheese or chocolate pot for dipping' },
  { word: 'Creme Brulee', category: 'food', difficulty: 'hard', points: 330, hint: 'Custard dessert with torched caramel' },
  { word: 'Guacamole', category: 'food', difficulty: 'hard', points: 300, hint: 'Mashed avocado dip with lime' },

  // OBJECTS
  { word: 'Guitar', category: 'objects', difficulty: 'easy', points: 100, hint: 'String instrument with frets' },
  { word: 'Rocket', category: 'objects', difficulty: 'easy', points: 110, hint: 'Spacecraft shooting into orbit' },
  { word: 'Umbrella', category: 'objects', difficulty: 'easy', points: 100, hint: 'Keeps you dry when it rains' },
  { word: 'Bicycle', category: 'objects', difficulty: 'easy', points: 110, hint: 'Two-wheeled pedal transport' },
  { word: 'Clock', category: 'objects', difficulty: 'easy', points: 100, hint: 'Has two hands and numbers 1-12' },
  { word: 'Scissors', category: 'objects', difficulty: 'easy', points: 100, hint: 'Tool used for cutting paper' },
  { word: 'Camera', category: 'objects', difficulty: 'easy', points: 110, hint: 'Takes photos and videos' },
  { word: 'Telescope', category: 'objects', difficulty: 'medium', points: 200, hint: 'Optical tool to look at stars' },
  { word: 'Microscope', category: 'objects', difficulty: 'medium', points: 220, hint: 'Scientific tool to view cells' },
  { word: 'Hourglass', category: 'objects', difficulty: 'medium', points: 200, hint: 'Measures time using falling sand' },
  { word: 'Skateboard', category: 'objects', difficulty: 'medium', points: 200, hint: 'Deck on four wheels for tricks' },
  { word: 'Submarine', category: 'objects', difficulty: 'medium', points: 220, hint: 'Underwater vessel' },
  { word: 'Stethoscope', category: 'objects', difficulty: 'hard', points: 310, hint: 'Doctor listens to heartbeats' },
  { word: 'Gramophone', category: 'objects', difficulty: 'hard', points: 330, hint: 'Vintage horn vinyl record player' },
  { word: 'Kaleidoscope', category: 'objects', difficulty: 'hard', points: 340, hint: 'Tube of mirrors creating symmetric patterns' },
  { word: 'Hoverboard', category: 'objects', difficulty: 'hard', points: 300, hint: 'Levitating futuristic board' },

  // PLACES
  { word: 'Castle', category: 'places', difficulty: 'easy', points: 100, hint: 'Fortress with towers and drawbridge' },
  { word: 'Pyramid', category: 'places', difficulty: 'easy', points: 100, hint: 'Ancient triangular Egyptian tomb' },
  { word: 'Volcano', category: 'places', difficulty: 'easy', points: 110, hint: 'Mountain that erupts lava' },
  { word: 'Hospital', category: 'places', difficulty: 'easy', points: 110, hint: 'Building for medical care with a red cross' },
  { word: 'Lighthouse', category: 'places', difficulty: 'medium', points: 200, hint: 'Tower guiding ships at sea with a rotating light' },
  { word: 'Windmill', category: 'places', difficulty: 'medium', points: 210, hint: 'Structure with rotating blades powered by wind' },
  { word: 'Colosseum', category: 'places', difficulty: 'medium', points: 230, hint: 'Roman amphitheater in ruins' },
  { word: 'Space Station', category: 'places', difficulty: 'hard', points: 320, hint: 'Laboratory orbiting Earth' },
  { word: 'Atlantis', category: 'places', difficulty: 'hard', points: 330, hint: 'Sunken mythical underwater city' },
  { word: 'Amusement Park', category: 'places', difficulty: 'hard', points: 330, hint: 'Ferris wheels, rollercoasters, and cotton candy' },

  // ACTIONS
  { word: 'Swimming', category: 'actions', difficulty: 'easy', points: 100, hint: 'Moving through water' },
  { word: 'Sleeping', category: 'actions', difficulty: 'easy', points: 100, hint: 'Resting in bed with Zzz' },
  { word: 'Dancing', category: 'actions', difficulty: 'easy', points: 100, hint: 'Moving to music rhythm' },
  { word: 'Cooking', category: 'actions', difficulty: 'easy', points: 110, hint: 'Preparing food over a pan or stove' },
  { word: 'Skydiving', category: 'actions', difficulty: 'medium', points: 220, hint: 'Jumping from an airplane with a parachute' },
  { word: 'Juggling', category: 'actions', difficulty: 'medium', points: 210, hint: 'Tossing multiple balls in the air' },
  { word: 'Fishing', category: 'actions', difficulty: 'medium', points: 200, hint: 'Catching fish with a rod and bait' },
  { word: 'Teleporting', category: 'actions', difficulty: 'hard', points: 330, hint: 'Instant travel through a sci-fi portal' },
  { word: 'Moonwalk', category: 'actions', difficulty: 'hard', points: 320, hint: 'Famous Michael Jackson glide backwards' },

  // POP CULTURE / THEMES
  { word: 'Superhero', category: 'pop_culture', difficulty: 'easy', points: 100, hint: 'Wears a cape and saves the day' },
  { word: 'Zombie', category: 'pop_culture', difficulty: 'easy', points: 100, hint: 'Undead monster craving brains' },
  { word: 'Alien', category: 'pop_culture', difficulty: 'easy', points: 100, hint: 'Green extraterrestrial from UFO' },
  { word: 'Wizard', category: 'pop_culture', difficulty: 'easy', points: 110, hint: 'Casts spells with a staff and pointed hat' },
  { word: 'Unicorn', category: 'pop_culture', difficulty: 'easy', points: 110, hint: 'Magical horse with a spiral horn' },
  { word: 'Vampire', category: 'pop_culture', difficulty: 'medium', points: 200, hint: 'Drinks blood and fears garlic and sun' },
  { word: 'Mermaid', category: 'pop_culture', difficulty: 'medium', points: 200, hint: 'Half human half fish with seashells' },
  { word: 'Centaur', category: 'pop_culture', difficulty: 'hard', points: 320, hint: 'Mythical creature: human torso, horse body' },
  { word: 'Time Machine', category: 'pop_culture', difficulty: 'hard', points: 340, hint: 'Device to travel to past and future' },
];

export function getRandomWordChoices(category: WordCategory = 'all'): WordChoice[] {
  let pool = WORD_DATABASE;
  if (category !== 'all') {
    pool = pool.filter(w => w.category === category);
    if (pool.length < 3) pool = WORD_DATABASE;
  }

  const easyWords = pool.filter(w => w.difficulty === 'easy');
  const medWords = pool.filter(w => w.difficulty === 'medium');
  const hardWords = pool.filter(w => w.difficulty === 'hard');

  const pickRandom = (arr: RawWord[]) => arr[Math.floor(Math.random() * arr.length)];

  const easyPick = easyWords.length > 0 ? pickRandom(easyWords) : pickRandom(pool);
  let medPick = medWords.length > 0 ? pickRandom(medWords) : pickRandom(pool);
  let hardPick = hardWords.length > 0 ? pickRandom(hardWords) : pickRandom(pool);

  // Ensure unique picks
  if (medPick.word === easyPick.word && pool.length > 1) {
    medPick = pool.find(w => w.word !== easyPick.word) || medPick;
  }
  if ((hardPick.word === easyPick.word || hardPick.word === medPick.word) && pool.length > 2) {
    hardPick = pool.find(w => w.word !== easyPick.word && w.word !== medPick.word) || hardPick;
  }

  return [
    { word: easyPick.word, difficulty: 'easy', points: easyPick.points, category: easyPick.category, hint: easyPick.hint },
    { word: medPick.word, difficulty: 'medium', points: medPick.points, category: medPick.category, hint: medPick.hint },
    { word: hardPick.word, difficulty: 'hard', points: hardPick.points, category: hardPick.category, hint: hardPick.hint },
  ];
}
