import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Trophy,
  Zap,
  HelpCircle,
  Clock,
  Flame,
  Bot,
  User,
  ShieldAlert,
  Repeat,
  Ban,
  Layers,
  ChevronRight,
  Award,
  PlusCircle,
  Volume2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../utils/soundEffects';
import { AvatarRenderer } from '../AvatarRenderer';
import { AiGameConfig } from '../VsAiArena';
import { VsBotWagerBanner, VsBotPayoutModal } from '../VsBotWagerManager';

interface UnoPartyProps {
  onBackToHub: () => void;
  aiConfig?: AiGameConfig | null;
}

export type UnoColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
export type UnoType = 'number' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';

export interface UnoCard {
  id: string;
  color: UnoColor;
  type: UnoType;
  value: number | null; // 0-9
  score: number;
}

export interface UnoPlayer {
  id: string;
  name: string;
  avatar: string;
  isBot: boolean;
  cards: UnoCard[];
  color: string;
  calledUno: boolean;
}

const COLOR_MAP: Record<UnoColor, { bg: string; text: string; ring: string; border: string; label: string }> = {
  red: {
    bg: 'bg-rose-600',
    text: 'text-rose-600',
    ring: 'ring-rose-500',
    border: 'border-rose-500',
    label: 'Red',
  },
  blue: {
    bg: 'bg-blue-600',
    text: 'text-blue-600',
    ring: 'ring-blue-500',
    border: 'border-blue-500',
    label: 'Blue',
  },
  green: {
    bg: 'bg-emerald-600',
    text: 'text-emerald-600',
    ring: 'ring-emerald-500',
    border: 'border-emerald-500',
    label: 'Green',
  },
  yellow: {
    bg: 'bg-amber-500',
    text: 'text-amber-500',
    ring: 'ring-amber-400',
    border: 'border-amber-400',
    label: 'Yellow',
  },
  wild: {
    bg: 'bg-gradient-to-tr from-rose-500 via-amber-400 via-emerald-400 to-blue-500',
    text: 'text-purple-600',
    ring: 'ring-purple-500',
    border: 'border-purple-400',
    label: 'Wild',
  },
};

// Generate fresh standard 108-card UNO Deck
const createDeck = (): UnoCard[] => {
  const deck: UnoCard[] = [];
  const colors: UnoColor[] = ['red', 'blue', 'green', 'yellow'];

  colors.forEach((color) => {
    // 1 Zero card
    deck.push({
      id: `${color}_0_${Math.random()}`,
      color,
      type: 'number',
      value: 0,
      score: 0,
    });

    // 2 of each 1-9
    for (let v = 1; v <= 9; v++) {
      deck.push({
        id: `${color}_${v}_a_${Math.random()}`,
        color,
        type: 'number',
        value: v,
        score: v,
      });
      deck.push({
        id: `${color}_${v}_b_${Math.random()}`,
        color,
        type: 'number',
        value: v,
        score: v,
      });
    }

    // 2 Skips, 2 Reverses, 2 Draw Twos
    for (let i = 0; i < 2; i++) {
      deck.push({
        id: `${color}_skip_${i}_${Math.random()}`,
        color,
        type: 'skip',
        value: null,
        score: 20,
      });
      deck.push({
        id: `${color}_reverse_${i}_${Math.random()}`,
        color,
        type: 'reverse',
        value: null,
        score: 20,
      });
      deck.push({
        id: `${color}_draw2_${i}_${Math.random()}`,
        color,
        type: 'draw2',
        value: null,
        score: 20,
      });
    }
  });

  // 4 Wilds & 4 Wild Draw Fours
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `wild_${i}_${Math.random()}`,
      color: 'wild',
      type: 'wild',
      value: null,
      score: 50,
    });
    deck.push({
      id: `wild4_${i}_${Math.random()}`,
      color: 'wild',
      type: 'wild4',
      value: null,
      score: 50,
    });
  }

  // Shuffle deck using Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
};

export const UnoParty: React.FC<UnoPartyProps> = ({ onBackToHub, aiConfig = null }) => {
  const { user, updateStats } = useAuth();

  // Match state
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'game_over'>('intro');
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(4);
  const [players, setPlayers] = useState<UnoPlayer[]>([]);
  const [deck, setDeck] = useState<UnoCard[]>([]);
  const [discardPile, setDiscardPile] = useState<UnoCard[]>([]);
  const [activeColor, setActiveColor] = useState<UnoColor>('red');
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [direction, setDirection] = useState<1 | -1>(1); // 1 = clockwise, -1 = counter-clockwise
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [pendingWildCard, setPendingWildCard] = useState<UnoCard | null>(null);
  const [actionBanner, setActionBanner] = useState<string | null>(null);
  const [historyLog, setHistoryLog] = useState<{ text: string; color: string }[]>([]);
  const [cardsPlayedThisGame, setCardsPlayedThisGame] = useState<number>(0);
  const [drawnThisTurn, setDrawnThisTurn] = useState<boolean>(false);
  const [lastDrawnCard, setLastDrawnCard] = useState<UnoCard | null>(null);
  const [winner, setWinner] = useState<UnoPlayer | null>(null);
  const [finalScore, setFinalScore] = useState<number>(0);

  // Wager modal
  const [showWagerModal, setShowWagerModal] = useState(false);
  const [wagerWon, setWagerWon] = useState(false);

  const botTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Game
  const handleStartGame = (numPlayers: 2 | 3 | 4 = playerCount) => {
    setPlayerCount(numPlayers);
    const newDeck = createDeck();

    const botTemplates = [
      { name: 'SparkyBot', avatar: 'avatar_neon_bot', color: '#6366F1' },
      { name: 'LunaFox', avatar: 'avatar_cyber_fox', color: '#EC4899' },
      { name: 'ShadowNinja', avatar: 'avatar_shadow_ninja', color: '#F59E0B' },
    ];

    const initialPlayers: UnoPlayer[] = [
      {
        id: 'human',
        name: user?.username || 'You',
        avatar: user?.avatar || 'avatar_cosmic_astro',
        isBot: false,
        cards: [],
        color: user?.color || '#6366F1',
        calledUno: false,
      },
    ];

    for (let i = 0; i < numPlayers - 1; i++) {
      initialPlayers.push({
        id: `bot_${i}`,
        name: botTemplates[i].name,
        avatar: botTemplates[i].avatar,
        isBot: true,
        cards: [],
        color: botTemplates[i].color,
        calledUno: false,
      });
    }

    // Deal 7 cards to each player
    initialPlayers.forEach((p) => {
      p.cards = newDeck.splice(0, 7);
    });

    // Start with a non-wild4 top discard
    let topCard = newDeck.pop()!;
    while (topCard.type === 'wild4') {
      newDeck.unshift(topCard);
      topCard = newDeck.pop()!;
    }

    const startColor: UnoColor = topCard.color === 'wild' ? 'red' : topCard.color;

    setPlayers(initialPlayers);
    setDeck(newDeck);
    setDiscardPile([topCard]);
    setActiveColor(startColor);
    setCurrentTurn(0);
    setDirection(1);
    setDrawnThisTurn(false);
    setLastDrawnCard(null);
    setShowColorPicker(false);
    setPendingWildCard(null);
    setWinner(null);
    setFinalScore(0);
    setCardsPlayedThisGame(0);
    setHistoryLog([{ text: `Game started with ${topCard.color.toUpperCase()} ${topCard.type === 'number' ? topCard.value : topCard.type.toUpperCase()}`, color: topCard.color }]);
    setGameState('playing');

    soundManager.playRoundStart();
  };

  const topDiscard = discardPile[discardPile.length - 1];
  const isHumanTurn = players[currentTurn]?.id === 'human' && gameState === 'playing';

  // Check if a card is valid to play according to official UNO rules
  const isCardPlayable = (card: UnoCard): boolean => {
    if (!topDiscard) return false;
    if (card.color === 'wild') return true;
    if (card.color === activeColor) return true;
    if (topDiscard.type === 'number' && card.type === 'number' && card.value === topDiscard.value) return true;
    if (card.type !== 'number' && card.type === topDiscard.type) return true;
    return false;
  };

  const humanCards = players[0]?.cards || [];
  const humanPlayableCards = humanCards.filter(isCardPlayable);
  const humanHasPlayableCard = humanPlayableCards.length > 0;

  // Bot Turn Automated Logic
  useEffect(() => {
    if (gameState !== 'playing') return;

    const currentPlayer = players[currentTurn];
    if (!currentPlayer || !currentPlayer.isBot) return;

    botTimeoutRef.current = setTimeout(() => {
      handleBotMove(currentPlayer);
    }, 1200 + Math.random() * 600);

    return () => {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    };
  }, [currentTurn, gameState, activeColor, discardPile]);

  // Execute bot turn with real UNO draw rules
  const handleBotMove = (bot: UnoPlayer) => {
    const playableCards = bot.cards.filter(isCardPlayable);

    if (playableCards.length > 0) {
      const chosenCard = playableCards.find((c) => c.type !== 'number') || playableCards[0];

      if (bot.cards.length === 2) {
        bot.calledUno = true;
        soundManager.playUnoCall();
        triggerBanner(`${bot.name} called UNO!`);
      }

      if (chosenCard.color === 'wild') {
        const colorCounts: Record<UnoColor, number> = { red: 0, blue: 0, green: 0, yellow: 0, wild: 0 };
        bot.cards.forEach((c) => {
          if (c.color !== 'wild') colorCounts[c.color]++;
        });
        const bestColor = (['red', 'blue', 'green', 'yellow'] as UnoColor[]).reduce((a, b) =>
          colorCounts[a] >= colorCounts[b] ? a : b
        );
        executePlayCard(currentTurn, chosenCard, bestColor);
      } else {
        executePlayCard(currentTurn, chosenCard);
      }
    } else {
      // Bot has NO playable card -> Must draw 1 card from deck
      triggerBanner(`${bot.name} has no matching card & draws 1 card`);
      drawCardsForPlayer(currentTurn, 1, (newCard) => {
        if (newCard && isCardPlayable(newCard)) {
          // Newly drawn card is playable! Bot plays it immediately
          setTimeout(() => {
            if (newCard.color === 'wild') {
              executePlayCard(currentTurn, newCard, 'blue');
            } else {
              executePlayCard(currentTurn, newCard);
            }
          }, 800);
        } else {
          // Not playable -> Bot passes turn
          setTimeout(() => {
            passTurn();
          }, 700);
        }
      });
    }
  };

  // Human plays card
  const handleHumanPlayCard = (card: UnoCard) => {
    if (!isHumanTurn || showColorPicker) return;
    if (!isCardPlayable(card)) {
      soundManager.playTick();
      return;
    }

    if (card.color === 'wild') {
      setPendingWildCard(card);
      setShowColorPicker(true);
      return;
    }

    executePlayCard(currentTurn, card);
  };

  // Color picker confirmed for Wild
  const handleSelectWildColor = (selectedCol: UnoColor) => {
    if (!pendingWildCard) return;
    setShowColorPicker(false);
    executePlayCard(currentTurn, pendingWildCard, selectedCol);
    setPendingWildCard(null);
  };

  // Core Play Card Execution
  const executePlayCard = (playerIdx: number, card: UnoCard, chosenWildColor?: UnoColor) => {
    soundManager.playCardPlay();
    setCardsPlayedThisGame((prev) => prev + 1);

    const player = players[playerIdx];
    const newCards = player.cards.filter((c) => c.id !== card.id);

    setDiscardPile((prev) => [...prev, card]);
    setPlayers((prev) =>
      prev.map((p, idx) => (idx === playerIdx ? { ...p, cards: newCards } : p))
    );

    const nextColor: UnoColor = chosenWildColor || (card.color === 'wild' ? 'red' : card.color);
    setActiveColor(nextColor);

    const cardLabel = `${card.color === 'wild' ? 'Wild' : card.color.toUpperCase()} ${
      card.type === 'number' ? card.value : card.type.toUpperCase()
    }`;
    setHistoryLog((prev) => [
      { text: `${player.name} played ${cardLabel}${chosenWildColor ? ` (picked ${chosenWildColor.toUpperCase()})` : ''}`, color: nextColor },
      ...prev.slice(0, 8),
    ]);

    // Win condition
    if (newCards.length === 0) {
      handleGameOver(player);
      return;
    }

    // Process Action Cards
    let advanceStep = 1;
    let nextDirection = direction;

    if (card.type === 'skip') {
      soundManager.playTick();
      const skippedPlayer = getNextPlayerIndex(1, nextDirection);
      triggerBanner(`${players[skippedPlayer].name} was SKIPPED!`);
      advanceStep = 2;
    } else if (card.type === 'reverse') {
      soundManager.playReverse();
      if (playerCount === 2) {
        triggerBanner(`Reverse! Plays again!`);
        advanceStep = 2;
      } else {
        nextDirection = (direction * -1) as 1 | -1;
        setDirection(nextDirection);
        triggerBanner(`Direction REVERSED!`);
        advanceStep = 1;
      }
    } else if (card.type === 'draw2') {
      soundManager.playWildPlay();
      const victimIdx = getNextPlayerIndex(1, nextDirection);
      triggerBanner(`${players[victimIdx].name} draws +2 and is skipped!`);
      drawCardsForPlayer(victimIdx, 2);
      advanceStep = 2;
    } else if (card.type === 'wild') {
      soundManager.playWildPlay();
      triggerBanner(`Color changed to ${nextColor.toUpperCase()}!`);
    } else if (card.type === 'wild4') {
      soundManager.playWildPlay();
      const victimIdx = getNextPlayerIndex(1, nextDirection);
      triggerBanner(`WILD +4! ${players[victimIdx].name} draws 4 and is skipped!`);
      drawCardsForPlayer(victimIdx, 4);
      advanceStep = 2;
    }

    const nextPlayerIndex = getNextPlayerIndex(advanceStep, nextDirection);
    setDrawnThisTurn(false);
    setLastDrawnCard(null);
    setCurrentTurn(nextPlayerIndex);
  };

  const getNextPlayerIndex = (step: number = 1, dir: 1 | -1 = direction): number => {
    const total = players.length;
    let next = (currentTurn + step * dir) % total;
    if (next < 0) next += total;
    return next;
  };

  // Draw cards from deck
  const drawCardsForPlayer = (
    playerIdx: number,
    count: number = 1,
    onComplete?: (drawnCard?: UnoCard) => void
  ) => {
    soundManager.playCardDraw();
    let currentDeck = [...deck];
    const drawn: UnoCard[] = [];

    for (let i = 0; i < count; i++) {
      if (currentDeck.length === 0) {
        if (discardPile.length > 1) {
          const top = discardPile[discardPile.length - 1];
          const rest = discardPile.slice(0, discardPile.length - 1);
          currentDeck = [...rest].sort(() => Math.random() - 0.5);
          setDiscardPile([top]);
        } else {
          break;
        }
      }
      const card = currentDeck.pop();
      if (card) drawn.push(card);
    }

    setDeck(currentDeck);

    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === playerIdx ? { ...p, cards: [...p.cards, ...drawn], calledUno: false } : p
      )
    );

    if (onComplete) {
      onComplete(drawn[0]);
    }
  };

  // Real UNO Human Draw Logic: Draw 1 card when you have no valid card or choose to draw
  const handleHumanDraw = () => {
    if (!isHumanTurn || drawnThisTurn) return;
    setDrawnThisTurn(true);

    drawCardsForPlayer(0, 1, (drawnCard) => {
      if (drawnCard) {
        setLastDrawnCard(drawnCard);
        if (isCardPlayable(drawnCard)) {
          triggerBanner(`Drew playable ${drawnCard.color.toUpperCase()} card! You can play it or pass.`);
        } else {
          triggerBanner(`Drew ${drawnCard.color.toUpperCase()} ${drawnCard.value ?? drawnCard.type} (Cannot Play). Turn passes.`);
          setTimeout(() => {
            passTurn();
          }, 1400);
        }
      }
    });
  };

  // Pass Turn
  const passTurn = () => {
    soundManager.playTick();
    setDrawnThisTurn(false);
    setLastDrawnCard(null);
    const nextIdx = getNextPlayerIndex(1);
    setCurrentTurn(nextIdx);
  };

  // Human calls UNO
  const handleCallUno = () => {
    const human = players[0];
    if (human.cards.length <= 2) {
      soundManager.playUnoCall();
      setPlayers((prev) =>
        prev.map((p, idx) => (idx === 0 ? { ...p, calledUno: true } : p))
      );
      triggerBanner(`YOU CALLED UNO!`);
    } else {
      soundManager.playTick();
      triggerBanner(`You can only call UNO when you have 1 or 2 cards!`);
    }
  };

  // Catch bot failing to call UNO
  const handleCatchUno = (botIdx: number) => {
    const bot = players[botIdx];
    if (bot.cards.length === 1 && !bot.calledUno) {
      soundManager.playVictory();
      triggerBanner(`CAUGHT! ${bot.name} forgot to call UNO! (+2 Penalty)`);
      drawCardsForPlayer(botIdx, 2);
    }
  };

  const triggerBanner = (msg: string) => {
    setActionBanner(msg);
    setTimeout(() => {
      setActionBanner(null);
    }, 2500);
  };

  // Game Over handling
  const handleGameOver = (winningPlayer: UnoPlayer) => {
    soundManager.playVictory();
    setWinner(winningPlayer);

    let calculatedPoints = 0;
    players.forEach((p) => {
      p.cards.forEach((c) => {
        calculatedPoints += c.score;
      });
    });

    setFinalScore(calculatedPoints);
    setGameState('game_over');

    if (winningPlayer.id === 'human') {
      updateStats(
        {
          gamesPlayed: 1,
          wins: 1,
          totalScore: calculatedPoints,
          unoWins: 1,
          unoCardsPlayed: cardsPlayedThisGame,
        },
        true
      );

      if (aiConfig?.withBet) {
        setWagerWon(true);
        setShowWagerModal(true);
      }
    } else {
      updateStats(
        {
          gamesPlayed: 1,
          totalScore: Math.floor(calculatedPoints / 3),
          unoCardsPlayed: cardsPlayedThisGame,
        },
        false
      );

      if (aiConfig?.withBet) {
        setWagerWon(false);
        setShowWagerModal(true);
      }
    }
  };

  // Render Card Component
  const renderCard = (
    card: UnoCard,
    isPlayable: boolean = false,
    onClick?: () => void,
    isCompact: boolean = false,
    isJustDrawn: boolean = false
  ) => {
    const colorStyle = COLOR_MAP[card.color];
    return (
      <motion.div
        key={card.id}
        whileHover={isPlayable ? { y: -16, scale: 1.08, zIndex: 30 } : {}}
        whileTap={isPlayable ? { scale: 0.95 } : {}}
        onClick={isPlayable ? onClick : undefined}
        className={`relative select-none transition-shadow rounded-2xl border-2 flex flex-col items-center justify-between p-2 shadow-lg cursor-pointer overflow-hidden ${
          isCompact ? 'w-14 h-20 text-xs' : 'w-20 sm:w-24 h-32 sm:h-36 text-sm'
        } ${colorStyle.bg} ${
          isJustDrawn && isPlayable
            ? 'ring-4 ring-amber-400 scale-105 border-white shadow-2xl shadow-amber-500/50'
            : isPlayable
            ? 'ring-4 ring-white/90 shadow-2xl shadow-indigo-500/50 cursor-pointer border-white'
            : 'border-white/30 opacity-90'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/20 pointer-events-none" />

        {isJustDrawn && (
          <span className="absolute top-1 right-1 px-1 py-0.5 bg-amber-400 text-slate-950 font-black text-[8px] rounded uppercase z-20 shadow">
            Drawn
          </span>
        )}

        {/* Top-Left Corner */}
        <div className="self-start font-black text-white text-xs drop-shadow-md leading-none">
          {card.type === 'number' && card.value}
          {card.type === 'skip' && '⊘'}
          {card.type === 'reverse' && '⇄'}
          {card.type === 'draw2' && '+2'}
          {card.type === 'wild' && '★'}
          {card.type === 'wild4' && '+4'}
        </div>

        {/* Center Symbol */}
        <div className="w-12 sm:w-16 h-16 sm:h-20 bg-white rounded-[50%] flex items-center justify-center shadow-inner -rotate-12 border-2 border-black/10">
          <span
            className={`font-black tracking-tighter ${
              card.color === 'wild' ? 'text-slate-900' : colorStyle.text
            } ${isCompact ? 'text-base' : 'text-2xl sm:text-3xl'}`}
          >
            {card.type === 'number' && card.value}
            {card.type === 'skip' && '⊘'}
            {card.type === 'reverse' && '⇄'}
            {card.type === 'draw2' && '+2'}
            {card.type === 'wild' && '★'}
            {card.type === 'wild4' && '+4'}
          </span>
        </div>

        {/* Bottom-Right Corner */}
        <div className="self-end font-black text-white text-xs drop-shadow-md leading-none rotate-180">
          {card.type === 'number' && card.value}
          {card.type === 'skip' && '⊘'}
          {card.type === 'reverse' && '⇄'}
          {card.type === 'draw2' && '+2'}
          {card.type === 'wild' && '★'}
          {card.type === 'wild4' && '+4'}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 animate-fade-in font-sans select-none">
      {/* VS BOT Active Wager Bar */}
      <VsBotWagerBanner aiConfig={aiConfig} gameTitle="UNO Party Showdown" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          onClick={onBackToHub}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Arcade Hub</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-amber-500 to-blue-500 flex items-center justify-center shadow-md text-white">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white leading-none">
              UNO Party Showdown
            </h2>
            <span className="text-[11px] font-bold text-rose-500">Official Draw-1 Rules & Strategy</span>
          </div>
        </div>

        {gameState === 'playing' && (
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black text-white shadow-sm ${
                COLOR_MAP[activeColor].bg
              }`}
            >
              <span>Active: {activeColor.toUpperCase()}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-slate-400">
              <Layers className="w-3.5 h-3.5" />
              <span>Deck: {deck.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* INTRO SCREEN */}
      {gameState === 'intro' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-xl"
        >
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-rose-500 via-amber-400 to-blue-500 flex items-center justify-center shadow-2xl text-white animate-pulse">
            <Layers className="w-12 h-12" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">
              UNO Party Arena!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Match color or number. If you don’t have a matching card, draw 1 from the deck! If it matches, play it right away or pass. Don’t forget to call UNO with 1 card left!
            </p>
          </div>

          <div className="max-w-xs mx-auto space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Choose Player Count:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPlayerCount(num as 2 | 3 | 4)}
                  className={`py-2.5 rounded-2xl text-xs font-black transition-all border ${
                    playerCount === num
                      ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {num} Players
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col items-center">
              <PlusCircle className="w-6 h-6 text-rose-500 mb-1" />
              <p className="font-bold text-slate-800 dark:text-slate-200">Draw 1 Rule</p>
              <p className="text-[10px] text-slate-500">Draw 1 when no match</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col items-center">
              <RotateCcw className="w-6 h-6 text-amber-500 mb-1" />
              <p className="font-bold text-slate-800 dark:text-slate-200">Reverses & Skips</p>
              <p className="text-[10px] text-slate-500">Disrupt turn orders</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col items-center">
              <Sparkles className="w-6 h-6 text-indigo-500 mb-1" />
              <p className="font-bold text-slate-800 dark:text-slate-200">Call UNO!</p>
              <p className="text-[10px] text-slate-500">Penalty if caught!</p>
            </div>
          </div>

          <button
            onClick={() => handleStartGame(playerCount)}
            className="px-8 py-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-rose-600 via-amber-500 to-blue-600 hover:from-rose-500 hover:to-blue-500 transition-all shadow-xl shadow-rose-600/30 hover:scale-105 active:scale-95"
          >
            <span>Deal the Cards & Play!</span>
          </button>
        </motion.div>
      )}

      {/* ACTIVE GAME TABLE */}
      {gameState === 'playing' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 border-4 border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative min-h-[480px] flex flex-col justify-between overflow-hidden">
            {/* Direction Spiral Flow in the table center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
              <motion.div
                animate={{ rotate: direction === 1 ? 360 : -360 }}
                transition={{ repeat: Infinity, duration: 18, ease: 'linear' }}
                className="w-96 h-96 rounded-full border-8 border-dashed border-white"
              />
            </div>

            {/* Action Flash Banner */}
            <AnimatePresence>
              {actionBanner && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-6 py-2 rounded-full bg-amber-500 text-slate-950 text-xs sm:text-sm font-black shadow-2xl shadow-amber-500/50 flex items-center gap-2 border-2 border-white"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{actionBanner}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* TOP AREA: Opponent Bots */}
            <div className="flex items-center justify-around gap-2 z-10">
              {players.slice(1).map((bot, bIdx) => {
                const isBotTurn = currentTurn === bIdx + 1;
                return (
                  <div
                    key={bot.id}
                    className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-1.5 backdrop-blur-md ${
                      isBotTurn
                        ? 'bg-indigo-600/30 border-amber-400 ring-2 ring-amber-400/50 scale-105 shadow-lg shadow-amber-400/20'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <AvatarRenderer avatar={bot.avatar} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-black text-white block leading-none">
                          {bot.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {bot.cards.length} cards {bot.calledUno && '• UNO!'}
                        </span>
                      </div>
                    </div>

                    {/* Bot Card Backs */}
                    <div className="flex -space-x-3 overflow-hidden py-1">
                      {bot.cards.slice(0, 6).map((_, i) => (
                        <div
                          key={i}
                          className="w-5 h-8 rounded-md bg-rose-600 border border-white shadow-sm flex items-center justify-center text-[8px] font-black text-white"
                        >
                          U
                        </div>
                      ))}
                      {bot.cards.length > 6 && (
                        <div className="w-5 h-8 rounded-md bg-slate-800 border border-slate-600 flex items-center justify-center text-[8px] font-bold text-slate-300">
                          +{bot.cards.length - 6}
                        </div>
                      )}
                    </div>

                    {bot.cards.length === 1 && !bot.calledUno && (
                      <button
                        onClick={() => handleCatchUno(bIdx + 1)}
                        className="px-2 py-0.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black shadow animate-pulse"
                      >
                        Catch UNO!
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* CENTER TABLE: Draw Pile, Discard Pile & Active Color */}
            <div className="flex items-center justify-center gap-6 sm:gap-10 my-4 z-10">
              {/* Draw Pile Deck */}
              <div className="flex flex-col items-center gap-1.5">
                <motion.button
                  whileHover={isHumanTurn && !drawnThisTurn ? { scale: 1.05 } : {}}
                  whileTap={isHumanTurn && !drawnThisTurn ? { scale: 0.95 } : {}}
                  onClick={handleHumanDraw}
                  disabled={!isHumanTurn || drawnThisTurn}
                  className={`relative w-20 sm:w-24 h-32 sm:h-36 rounded-2xl bg-gradient-to-tr from-slate-900 to-rose-700 border-2 border-white/40 shadow-2xl flex flex-col items-center justify-center text-white font-black transition-all ${
                    isHumanTurn && !drawnThisTurn && !humanHasPlayableCard
                      ? 'ring-4 ring-amber-400 cursor-pointer shadow-amber-400/50 animate-pulse'
                      : isHumanTurn && !drawnThisTurn
                      ? 'ring-2 ring-indigo-400 cursor-pointer'
                      : 'opacity-75'
                  }`}
                >
                  <div className="w-12 h-16 rounded-full bg-white text-rose-600 flex items-center justify-center text-lg -rotate-12 shadow-inner font-black">
                    UNO
                  </div>
                  <span className="text-[10px] text-white/90 font-mono mt-1">
                    {deck.length} cards
                  </span>
                </motion.button>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {isHumanTurn && !drawnThisTurn && !humanHasPlayableCard ? 'Click to Draw 1' : 'Draw Deck'}
                </span>
              </div>

              {/* Active Color & Direction */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-16 h-16 rounded-full border-4 flex items-center justify-center shadow-lg transition-colors ${
                    COLOR_MAP[activeColor].border
                  } ${COLOR_MAP[activeColor].bg}/20`}
                >
                  <motion.div
                    animate={{ rotate: direction === 1 ? 360 : -360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                    className="text-white"
                  >
                    <RotateCcw className="w-6 h-6" />
                  </motion.div>
                </div>
                <span
                  className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full text-white ${
                    COLOR_MAP[activeColor].bg
                  }`}
                >
                  {activeColor}
                </span>
              </div>

              {/* Discard Pile */}
              <div className="flex flex-col items-center gap-1.5">
                {topDiscard && renderCard(topDiscard, false, undefined, false)}
                <span className="text-[10px] font-bold text-slate-400 uppercase">Discard</span>
              </div>
            </div>

            {/* BOTTOM AREA: Human Hand Controls */}
            <div className="space-y-3 z-10">
              {/* Status Alert: When no card matches, tell the user to draw 1 card */}
              {isHumanTurn && !humanHasPlayableCard && !drawnThisTurn && (
                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center justify-between gap-3 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>No card matches the current color ({activeColor.toUpperCase()}) or value! Draw 1 card from deck.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleHumanDraw}
                    className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow transition-all shrink-0"
                  >
                    Draw 1 Card
                  </button>
                </div>
              )}

              {/* Hand Status Bar & Actions */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>
                    {isHumanTurn
                      ? drawnThisTurn
                        ? 'Card drawn! Play it or Pass Turn'
                        : humanHasPlayableCard
                        ? 'Your turn! Select a matching card'
                        : 'Your turn! Draw 1 card from deck'
                      : `${players[currentTurn]?.name}'s Turn...`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* UNO Shout Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCallUno}
                    className={`px-4 py-1.5 rounded-xl font-black text-xs text-white shadow-lg transition-all ${
                      players[0]?.cards.length <= 2 && !players[0]?.calledUno
                        ? 'bg-rose-500 ring-4 ring-amber-400 animate-bounce shadow-rose-500/50'
                        : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                  >
                    Shout UNO!
                  </motion.button>

                  {/* Draw 1 Card Button */}
                  {isHumanTurn && !drawnThisTurn && (
                    <button
                      onClick={handleHumanDraw}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow flex items-center gap-1.5 transition-all"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Draw 1 Card</span>
                    </button>
                  )}

                  {/* Pass Turn Button if already drawn */}
                  {isHumanTurn && drawnThisTurn && (
                    <button
                      onClick={passTurn}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow flex items-center gap-1 transition-all"
                    >
                      <span>Pass Turn</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Fanned Player Cards Container */}
              <div className="flex items-center justify-center -space-x-4 sm:-space-x-6 overflow-x-auto py-4 px-2">
                {players[0]?.cards.map((card) => {
                  const playable = isHumanTurn && isCardPlayable(card) && !showColorPicker;
                  const isDrawn = lastDrawnCard?.id === card.id;
                  return (
                    <div key={card.id} className="transition-transform">
                      {renderCard(card, playable, () => handleHumanPlayCard(card), false, isDrawn)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* WILD COLOR PICKER MODAL */}
          <AnimatePresence>
            {showColorPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
              >
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center space-y-4 max-w-sm w-full shadow-2xl">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Pick Next Active Color:
                  </h3>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {(['red', 'blue', 'green', 'yellow'] as UnoColor[]).map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => handleSelectWildColor(col)}
                        className={`p-4 rounded-2xl text-white font-black text-base shadow-lg transition-transform hover:scale-105 active:scale-95 ${COLOR_MAP[col].bg}`}
                      >
                        {COLOR_MAP[col].label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recent Plays Log */}
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-2 overflow-x-auto text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider shrink-0">
              Live Feed:
            </span>
            <div className="flex items-center gap-2">
              {historyLog.map((log, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold whitespace-nowrap text-slate-700 dark:text-slate-300"
                >
                  {log.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER MODAL */}
      {gameState === 'game_over' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-xl"
        >
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
            <Trophy className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {winner?.id === 'human' ? 'You Won the UNO Showdown!' : `${winner?.name} Won the Match!`}
            </h2>
            <p className="text-xs text-slate-400">
              {winner?.id === 'human'
                ? `You earned ${finalScore} points from remaining opponents' cards!`
                : 'Good effort! Rematch to reclaim the victory!'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <p className="text-xl font-black text-indigo-500">{finalScore}</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Round Score</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <p className="text-xl font-black text-rose-500">{cardsPlayedThisGame}</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Cards Played</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => handleStartGame(playerCount)}
              className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md transition-all"
            >
              Play Another Match
            </button>
            <button
              onClick={onBackToHub}
              className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all"
            >
              Arcade Hub
            </button>
          </div>
        </motion.div>
      )}

      {/* VS BOT Wager Payout / Rematch Modal */}
      <VsBotPayoutModal
        isOpen={showWagerModal}
        won={wagerWon}
        aiConfig={aiConfig}
        gameTitle="UNO Party Showdown"
        onRematch={() => {
          setShowWagerModal(false);
          handleStartGame(playerCount);
        }}
        onBackToHub={onBackToHub}
      />
    </div>
  );
};
