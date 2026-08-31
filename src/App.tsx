import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, LogOut, Share2, Users } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GameProvider, useGame } from './context/GameContext';
import { Header } from './components/Header';
import { Lobby } from './components/Lobby';
import { Canvas } from './components/Canvas';
import { ChatBox } from './components/ChatBox';
import { Scoreboard } from './components/Scoreboard';
import { WordSelector } from './components/WordSelector';
import { RoundOverlay } from './components/RoundOverlay';
import { GameOverModal } from './components/GameOverModal';
import { GlobalLeaderboard } from './components/GlobalLeaderboard';
import { ProfileModal } from './components/ProfileModal';
import { AuthModal } from './components/AuthModal';
import { DailyMissionsModal } from './components/DailyMissionsModal';
import { WelcomeAuthGate } from './components/WelcomeAuthGate';
import { AdminPanel } from './components/AdminPanel';
import { ArcadeHub } from './components/ArcadeHub';
import { AiSketchGuesser } from './components/games/AiSketchGuesser';
import { EmojiCharades } from './components/games/EmojiCharades';
import { SpeedDuel } from './components/games/SpeedDuel';
import { MemoryRush } from './components/games/MemoryRush';
import { WordBomb } from './components/games/WordBomb';
import { PixelReveal } from './components/games/PixelReveal';
import { BlindfoldMaestro } from './components/games/BlindfoldMaestro';
import { UnoParty } from './components/games/UnoParty';
import { TriviaDash } from './components/games/TriviaDash';
import { AnagramRush } from './components/games/AnagramRush';
import { SoundMystery } from './components/games/SoundMystery';
import { ReflexNeon } from './components/games/ReflexNeon';
import { ColorClash } from './components/games/ColorClash';
import { CyberTyping } from './components/games/CyberTyping';
import { SimonSequence } from './components/games/SimonSequence';
import { MathSprint } from './components/games/MathSprint';
import { EmojiMatch } from './components/games/EmojiMatch';
import { WhackDoodle } from './components/games/WhackDoodle';
import { TowerStack } from './components/games/TowerStack';
import { NgipMegaWheel } from './components/games/NgipMegaWheel';
import { NgipVaultHacker } from './components/games/NgipVaultHacker';
import { ArcadeGameMode } from './types';
import { AiGameConfig } from './components/VsAiArena';
import { GothicDripBackground } from './components/GothicDripBackground';

const MainGameContainer: React.FC<{
  currentMode: ArcadeGameMode;
  setCurrentMode: (mode: ArcadeGameMode) => void;
  onOpenLeaderboard: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onOpenAuthGate: () => void;
  onOpenAdmin: () => void;
  onOpenDailyMissions: () => void;
}> = ({
  currentMode,
  setCurrentMode,
  onOpenLeaderboard,
  onOpenProfile,
  onOpenAuth,
  onOpenAuthGate,
  onOpenAdmin,
  onOpenDailyMissions,
}) => {
  const { gameState, leaveRoom } = useGame();
  const [mobileTab, setMobileTab] = useState<'game' | 'chat' | 'scores'>('game');
  const [activeAiConfig, setActiveAiConfig] = useState<AiGameConfig | null>(null);

  const handleLaunchAi = (config: AiGameConfig) => {
    setActiveAiConfig(config);
    setCurrentMode(config.mode);
  };

  const handleBackToLobby = () => {
    setActiveAiConfig(null);
    setCurrentMode('multiplayer_draw');
  };

  const activeRoomGameMode: ArcadeGameMode = gameState?.settings?.gameMode || 'multiplayer_draw';
  const isRoomInLobby = gameState?.status === 'lobby';

  const renderMultiplayerGameComponent = (mode: ArcadeGameMode) => {
    switch (mode) {
      case 'uno_party':
        return <UnoParty onBackToHub={leaveRoom} />;
      case 'trivia_dash':
        return <TriviaDash onBackToHub={leaveRoom} />;
      case 'anagram_rush':
        return <AnagramRush onBackToHub={leaveRoom} />;
      case 'bomb_chain':
        return <WordBomb onBackToHub={leaveRoom} />;
      case 'pixel_reveal':
        return <PixelReveal onBackToHub={leaveRoom} />;
      case 'blindfold_maestro':
        return <BlindfoldMaestro onBackToHub={leaveRoom} />;
      case 'ai_sketch_guess':
        return <AiSketchGuesser onBackToHub={leaveRoom} />;
      case 'emoji_charades':
        return <EmojiCharades onBackToHub={leaveRoom} />;
      case 'speed_duel':
        return <SpeedDuel onBackToHub={leaveRoom} />;
      case 'memory_rush':
        return <MemoryRush onBackToHub={leaveRoom} />;
      case 'sound_mystery':
        return <SoundMystery onBackToLobby={leaveRoom} />;
      case 'reflex_neon':
        return <ReflexNeon onBackToLobby={leaveRoom} />;
      case 'color_clash':
        return <ColorClash onBackToHub={leaveRoom} />;
      case 'cyber_typing':
        return <CyberTyping onBackToHub={leaveRoom} />;
      case 'simon_sequence':
        return <SimonSequence onBackToHub={leaveRoom} />;
      case 'math_sprint':
        return <MathSprint onBackToHub={leaveRoom} />;
      case 'emoji_match':
        return <EmojiMatch onBackToHub={leaveRoom} />;
      case 'whack_doodle':
        return <WhackDoodle onBackToHub={leaveRoom} />;
      case 'tower_stack':
        return <TowerStack onBackToHub={leaveRoom} />;
      case 'ngip_mega_wheel':
        return <NgipMegaWheel onBackToHub={leaveRoom} />;
      case 'ngip_vault_hacker':
        return <NgipVaultHacker onBackToHub={leaveRoom} />;
      case 'multiplayer_draw':
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors selection:bg-purple-500 selection:text-white relative overflow-x-hidden">
      {/* Y2K Gothic Drip Background Graffiti Overlay */}
      <GothicDripBackground />

      {/* Top Navigation Bar */}
      <Header
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        onOpenLeaderboard={onOpenLeaderboard}
        onOpenProfile={onOpenProfile}
        onOpenAuth={onOpenAuth}
        onOpenAuthGate={onOpenAuthGate}
        onOpenAdmin={onOpenAdmin}
        onOpenDailyMissions={onOpenDailyMissions}
      />

      {/* Main Game Screen depending on selected mode */}
      <main className="flex-1 flex flex-col p-2 sm:p-4 max-w-7xl w-full mx-auto relative z-10">
        <AnimatePresence mode="wait">
          {/* 1. ACTIVE MULTIPLAYER GAME ROOM */}
          {Boolean(gameState) ? (
            <motion.div
              key="multiplayer_room_arena"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              {isRoomInLobby || activeRoomGameMode === 'multiplayer_draw' ? (
                /* Room Waiting Lobby OR Drawing Arena Match */
                <div className="flex-1 flex flex-col space-y-3">
                  {/* Mobile Quick Room Bar with Back button */}
                  <div className="flex sm:hidden items-center justify-between px-3 py-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                    <button
                      type="button"
                      onClick={leaveRoom}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer active:scale-95"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Lobby</span>
                    </button>
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      <span>#{gameState.roomCode || (gameState.roomId.includes('_') ? gameState.roomId.split('_')[1].toUpperCase() : gameState.roomId)}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                  </div>

                  {/* Mobile Tab Switcher */}
                  <div className="flex lg:hidden items-center bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                    <button
                      onClick={() => setMobileTab('scores')}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        mobileTab === 'scores'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      👥 Players ({gameState.players.length})
                    </button>
                    <button
                      onClick={() => setMobileTab('game')}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        mobileTab === 'game'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      🎨 Arena
                    </button>
                    <button
                      onClick={() => setMobileTab('chat')}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        mobileTab === 'chat'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      💬 Chat & Guesses
                    </button>
                  </div>

                  {/* Desktop 3-Column Arena */}
                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[580px]">
                    {/* Left Column: Scoreboard */}
                    <div
                      className={`lg:col-span-3 h-[520px] lg:h-auto ${
                        mobileTab === 'scores' ? 'block' : 'hidden lg:block'
                      }`}
                    >
                      <Scoreboard />
                    </div>

                    {/* Middle Column: Canvas / Arena */}
                    <div
                      className={`lg:col-span-6 h-[580px] lg:h-auto ${
                        mobileTab === 'game' ? 'block' : 'hidden lg:block'
                      }`}
                    >
                      <Canvas />
                    </div>

                    {/* Right Column: Chat & Guesses */}
                    <div
                      className={`lg:col-span-3 h-[520px] lg:h-auto ${
                        mobileTab === 'chat' ? 'block' : 'hidden lg:block'
                      }`}
                    >
                      <ChatBox />
                    </div>
                  </div>
                </div>
              ) : (
                /* Non-Drawing Arcade Game Match (UNO Party, Trivia Dash, Anagram Rush, etc.) */
                <div className="flex-1 flex flex-col space-y-3">
                  {/* Top Room Banner */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={leaveRoom}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer active:scale-95 transition-all"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Leave Room</span>
                      </button>
                      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-bold border border-indigo-200 dark:border-indigo-800">
                        <span>Room Code: #{gameState.roomCode || (gameState.roomId.includes('_') ? gameState.roomId.split('_')[1].toUpperCase() : gameState.roomId)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800">
                        <Users className="w-3.5 h-3.5" />
                        <span>{gameState.players.filter(p => p.isConnected).length} Players</span>
                      </div>
                      <div className="hidden md:block max-w-[min(42vw,22rem)] truncate text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {gameState.players
                          .filter(p => p.isConnected)
                          .map(p => p.username)
                          .join(' • ')}
                      </div>
                    </div>
                  </div>

                  {/* Active Game Mode Component */}
                  <div className="flex-1">
                    {renderMultiplayerGameComponent(activeRoomGameMode)}
                  </div>
                </div>
              )}
            </motion.div>
          ) : currentMode === 'multiplayer_draw' ? (
            /* 2. MULTIPLAYER LOBBY / ROOM BROWSER / CUSTOM ROOM CREATOR */
            <motion.div
              key="multiplayer_draw_lobby"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <Lobby
                onOpenAuth={onOpenAuth}
                currentMode={currentMode}
                onSelectMode={setCurrentMode}
                onLaunchAiGame={handleLaunchAi}
              />
            </motion.div>
          ) : null}

          {/* SOLO / PRACTICE ARCADE MODES (When not in a multiplayer room) */}
          {!gameState && currentMode === 'uno_party' && (
            <motion.div
              key="uno_party"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <UnoParty onBackToHub={handleBackToLobby} aiConfig={activeAiConfig} />
            </motion.div>
          )}

          {!gameState && currentMode === 'trivia_dash' && (
            <motion.div
              key="trivia_dash"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <TriviaDash onBackToHub={handleBackToLobby} aiConfig={activeAiConfig} />
            </motion.div>
          )}

          {/* MODE: WORD ANAGRAM SCRAMBLE */}
          {!gameState && currentMode === 'anagram_rush' && (
            <motion.div
              key="anagram_rush"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <AnagramRush onBackToHub={handleBackToLobby} aiConfig={activeAiConfig} />
            </motion.div>
          )}

          {/* MODE 2: WORD BOMB CHAIN */}
          {!gameState && currentMode === 'bomb_chain' && (
            <motion.div
              key="bomb_chain"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <WordBomb onBackToHub={handleBackToLobby} aiConfig={activeAiConfig} />
            </motion.div>
          )}

          {/* MODE 3: PIXEL REVEAL MYSTERY */}
          {!gameState && currentMode === 'pixel_reveal' && (
            <motion.div
              key="pixel_reveal"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <PixelReveal onBackToHub={handleBackToLobby} aiConfig={activeAiConfig} />
            </motion.div>
          )}

          {/* MODE 4: BLINDFOLD MAESTRO */}
          {!gameState && currentMode === 'blindfold_maestro' && (
            <motion.div
              key="blindfold_maestro"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <BlindfoldMaestro onBackToHub={handleBackToLobby} />
            </motion.div>
          )}

          {/* MODE 5: AI SKETCH GUESSER */}
          {!gameState && currentMode === 'ai_sketch_guess' && (
            <motion.div
              key="ai_sketch_guess"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <AiSketchGuesser onBackToHub={handleBackToLobby} aiConfig={activeAiConfig} />
            </motion.div>
          )}

          {/* MODE 6: EMOJI CHARADES */}
          {!gameState && currentMode === 'emoji_charades' && (
            <motion.div
              key="emoji_charades"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <EmojiCharades onBackToHub={handleBackToLobby} aiConfig={activeAiConfig} />
            </motion.div>
          )}

          {/* MODE 7: 1v1 SPEED DUEL */}
          {!gameState && currentMode === 'speed_duel' && (
            <motion.div
              key="speed_duel"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <SpeedDuel onBackToHub={handleBackToLobby} aiConfig={activeAiConfig} />
            </motion.div>
          )}

          {/* MODE 8: MEMORY DOODLE RUSH */}
          {!gameState && currentMode === 'memory_rush' && (
            <motion.div
              key="memory_rush"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <MemoryRush onBackToHub={handleBackToLobby} />
            </motion.div>
          )}

          {/* MODE 9: AUDIO MYSTERY GUESS */}
          {!gameState && currentMode === 'sound_mystery' && (
            <motion.div
              key="sound_mystery"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <SoundMystery onBackToLobby={handleBackToLobby} />
            </motion.div>
          )}

          {/* MODE 10: NEON REFLEX RHYTHM */}
          {!gameState && currentMode === 'reflex_neon' && (
            <motion.div
              key="reflex_neon"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ReflexNeon onBackToLobby={handleBackToLobby} />
            </motion.div>
          )}

          {/* MODE 11: COLOR CLASH MATRIX */}
          {!gameState && currentMode === 'color_clash' && (
            <motion.div
              key="color_clash"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ColorClash onBackToHub={handleBackToLobby} />
            </motion.div>
          )}

          {/* MODE 12: CYBER VELOCITY TYPING */}
          {!gameState && currentMode === 'cyber_typing' && (
            <motion.div
              key="cyber_typing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <CyberTyping onBackToHub={handleBackToLobby} />
            </motion.div>
          )}

          {/* MODE 13: SIMON SOUND MATRIX */}
          {!gameState && currentMode === 'simon_sequence' && (
            <motion.div
              key="simon_sequence"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <SimonSequence onBackToHub={handleBackToLobby} />
            </motion.div>
          )}

          {/* MODE 14: MATH SPRINT LIGHTNING */}
          {!gameState && currentMode === 'math_sprint' && (
            <motion.div
              key="math_sprint"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <MathSprint onBackToHub={handleBackToLobby} />
            </motion.div>
          )}

          {/* MODE 15: EMOJI TILE MATCH */}
          {!gameState && currentMode === 'emoji_match' && (
            <motion.div
              key="emoji_match"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <EmojiMatch onBackToHub={handleBackToLobby} />
            </motion.div>
          )}

          {/* MODE 16: WHACK-A-DOODLE */}
          {!gameState && currentMode === 'whack_doodle' && (
            <motion.div
              key="whack_doodle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <WhackDoodle onBackToHub={handleBackToLobby} />
            </motion.div>
          )}

          {/* MODE 17: CYBER TOWER STACKER */}
          {!gameState && currentMode === 'tower_stack' && (
            <motion.div
              key="tower_stack"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <TowerStack onBackToHub={handleBackToLobby} />
            </motion.div>
          )}

          {/* MODE 18: งip SUPREME HIGH ROLLER WHEEL */}
          {!gameState && currentMode === 'ngip_mega_wheel' && (
            <motion.div
              key="ngip_mega_wheel"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <NgipMegaWheel onBackToHub={handleBackToLobby} />
            </motion.div>
          )}

          {/* MODE 19: งip CYBER DECRYPTION MATRIX */}
          {!gameState && currentMode === 'ngip_vault_hacker' && (
            <motion.div
              key="ngip_vault_hacker"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <NgipVaultHacker onBackToHub={handleBackToLobby} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Multiplayer State Overlays (Drawing Game only) */}
      {gameState && (gameState.settings?.gameMode === 'multiplayer_draw' || !gameState.settings?.gameMode) && (
        <>
          <WordSelector />
          <RoundOverlay />
          <GameOverModal />
        </>
      )}
    </div>
  );
};

export default function App() {
  const [hasEnteredApp, setHasEnteredApp] = useState(false);
  const [currentMode, setCurrentMode] = useState<ArcadeGameMode>('multiplayer_draw');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showDailyMissions, setShowDailyMissions] = useState(false);

  return (
    <AuthProvider>
      <GameProvider>
        <AnimatePresence mode="wait">
          {!hasEnteredApp ? (
            /* Mandatory Sign Up / Login / Guest Gate on first entry */
            <motion.div
              key="welcome_gate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              <WelcomeAuthGate onEnter={() => setHasEnteredApp(true)} />
            </motion.div>
          ) : (
            /* Main Arcade Experience */
            <motion.div
              key="main_app"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <MainGameContainer
                currentMode={currentMode}
                setCurrentMode={setCurrentMode}
                onOpenLeaderboard={() => setShowLeaderboard(true)}
                onOpenProfile={() => setShowProfile(true)}
                onOpenAuth={() => setShowAuth(true)}
                onOpenAuthGate={() => setHasEnteredApp(false)}
                onOpenAdmin={() => setShowAdmin(true)}
                onOpenDailyMissions={() => setShowDailyMissions(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Modals */}
        <DailyMissionsModal
          isOpen={showDailyMissions}
          onClose={() => setShowDailyMissions(false)}
        />
        <GlobalLeaderboard
          isOpen={showLeaderboard}
          onClose={() => setShowLeaderboard(false)}
        />
        <ProfileModal
          isOpen={showProfile}
          onClose={() => setShowProfile(false)}
        />
        <AuthModal
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
        />
        {showAdmin && (
          <AdminPanel onClose={() => setShowAdmin(false)} />
        )}
      </GameProvider>
    </AuthProvider>
  );
}
