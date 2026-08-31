import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  GameState,
  ChatMessage,
  CanvasAction,
  LeaderboardEntry,
  RoomSummary,
  RoomSettings,
  WordChoice,
  Player,
} from '../types';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';
import { soundManager } from '../utils/soundEffects';
import { subscribeToFirestoreLeaderboard } from '../services/firebase';
import confetti from 'canvas-confetti';

interface ReactionItem {
  id: string;
  senderName: string;
  emoji: string;
  x: number;
}

interface GameContextType {
  gameState: GameState | null;
  messages: ChatMessage[];
  drawingHistory: CanvasAction[];
  isHost: boolean;
  isDrawer: boolean;
  currentPlayer: Player | null;
  globalLeaderboard: LeaderboardEntry[];
  publicRooms: RoomSummary[];
  reactions: ReactionItem[];
  errorMessage: string | null;
  clearError: () => void;
  createRoom: (settings: RoomSettings, roomName?: string) => void;
  joinRoom: (roomIdentifier: string) => void;
  quickJoin: () => void;
  startGame: () => void;
  selectWord: (choice: WordChoice) => void;
  sendCanvasAction: (action: CanvasAction) => void;
  clearCanvas: () => void;
  sendMessage: (text: string) => void;
  sendReaction: (emoji: string) => void;
  reactToMessage: (messageId: string, emoji: string) => void;
  leaveRoom: () => void;
  fetchPublicRooms: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateStats } = useAuth();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [drawingHistory, setDrawingHistory] = useState<CanvasAction[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [publicRooms, setPublicRooms] = useState<RoomSummary[]>([]);
  const [reactions, setReactions] = useState<ReactionItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const prevRoundRef = useRef<number>(1);
  const prevStatusRef = useRef<string>('lobby');

  const currentPlayer = gameState && user
    ? gameState.players.find(p => p.id === user.id) || null
    : null;

  const isDrawer = Boolean(gameState && user && gameState.drawerId === user.id);

  // Clear error notice
  const clearError = () => setErrorMessage(null);

  // Socket listener bindings
  useEffect(() => {
    const socket = getSocket();

    const handleRoomState = (state: GameState) => {
      setGameState(prevState => {
        // Trigger sounds & confetti on state transitions
        if (prevState) {
          if (prevState.status !== 'drawing' && state.status === 'drawing') {
            soundManager.playTurnStart();
          }
          if (prevState.status !== 'game_over' && state.status === 'game_over') {
            soundManager.playVictory();
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 },
            });
            // Update stats
            if (user) {
              const myResult = state.players.find(p => p.id === user.id);
              if (myResult) {
                const won = state.winner?.id === user.id;
                updateStats(
                  {
                    gamesPlayed: 1,
                    totalScore: myResult.score,
                  },
                  won
                );
              }
            }
          }
        }
        return state;
      });
    };

    const handleRoomJoined = ({ room, isHost: hostStatus }: { room: GameState; isHost: boolean }) => {
      setGameState(room);
      setIsHost(hostStatus);
      setMessages([]);
      setDrawingHistory([]);
      setErrorMessage(null);
    };

    const handleDrawAction = (action: CanvasAction) => {
      if (action.type === 'clear') {
        setDrawingHistory([]);
      } else {
        setDrawingHistory(prev => [...prev, action]);
      }
    };

    const handleCanvasClear = () => {
      setDrawingHistory([]);
    };

    const handleCanvasHistory = (history: CanvasAction[]) => {
      setDrawingHistory(history);
    };

    const handleChatMessage = (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);

      if (msg.type === 'correct_guess') {
        soundManager.playCorrectGuess();
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
        });
      } else if (msg.type === 'close_guess') {
        soundManager.playCloseGuess();
      }
    };

    const handleReactionBroadcast = ({ senderName, emoji, id }: { senderName: string; emoji: string; id: string }) => {
      const rxItem: ReactionItem = {
        id,
        senderName,
        emoji,
        x: Math.random() * 70 + 15, // random percentage for animation
      };
      setReactions(prev => [...prev, rxItem]);
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== id));
      }, 2500);
    };

    const handleLeaderboardUpdate = (socketLb: LeaderboardEntry[]) => {
      setGlobalLeaderboard(prev => {
        if (!socketLb || socketLb.length === 0) return prev;
        const map = new Map<string, LeaderboardEntry>();
        prev.forEach(e => map.set(e.userId || e.username, e));
        socketLb.forEach(e => {
          const key = e.userId || e.username;
          const existing = map.get(key);
          map.set(key, {
            ...existing,
            ...e,
            avatar: e.avatar || existing?.avatar || e.avatar,
          });
        });
        const merged = Array.from(map.values()).sort((a, b) => b.score - a.score);
        return merged.map((item, idx) => ({ ...item, rank: idx + 1 }));
      });
    };

    const handleRoomsList = (rooms: RoomSummary[]) => {
      setPublicRooms(rooms);
    };

    const handleRoomTimer = ({ timeLeft }: { timeLeft: number }) => {
      setGameState(prev => (prev ? { ...prev, timeLeft } : null));
      if (timeLeft <= 10 && timeLeft > 0) {
        soundManager.playUrgentTick();
      } else if (timeLeft % 10 === 0 && timeLeft > 0) {
        soundManager.playTick();
      }
    };

    const handleHintUpdate = ({ revealedIndices, maskedHint }: { revealedIndices: number[]; maskedHint: string }) => {
      setGameState(prev =>
        prev
          ? {
              ...prev,
              revealedIndices,
              word: maskedHint,
            }
          : null
      );
    };

    const handleRoomError = ({ message }: { message: string }) => {
      setErrorMessage(message);
    };

    const handleRoomClosed = (data: { reason: string; hostName?: string }) => {
      setGameState(null);
      setDrawingHistory([]);
      setMessages([]);
      setIsHost(false);
      setErrorMessage(data?.reason || 'The room host has left. The room has been closed.');
      fetchPublicRooms();
    };

    const handleMessageReactionUpdate = ({
      messageId,
      reactions,
    }: {
      messageId: string;
      reactions: Record<string, string[]>;
    }) => {
      setMessages(prev =>
        prev.map(msg => (msg.id === messageId ? { ...msg, reactions } : msg))
      );
    };

    socket.on('room:state', handleRoomState);
    socket.on('room:joined', handleRoomJoined);
    socket.on('draw:action', handleDrawAction);
    socket.on('canvas:clear', handleCanvasClear);
    socket.on('canvas:history', handleCanvasHistory);
    socket.on('chat:message', handleChatMessage);
    socket.on('chat:message_reaction_update', handleMessageReactionUpdate);
    socket.on('reaction:broadcast', handleReactionBroadcast);
    socket.on('leaderboard:update', handleLeaderboardUpdate);
    socket.on('rooms:list', handleRoomsList);
    socket.on('room:timer', handleRoomTimer);
    socket.on('room:hint_update', handleHintUpdate);
    socket.on('room:error', handleRoomError);
    socket.on('room:closed', handleRoomClosed);

    // Initial fetch of public rooms
    fetchPublicRooms();

    // Subscribe to real-time Firestore leaderboard updates
    const unsubscribeFirestoreLb = subscribeToFirestoreLeaderboard((fbLeaderboard) => {
      if (fbLeaderboard && fbLeaderboard.length > 0) {
        setGlobalLeaderboard(fbLeaderboard);
      }
    });

    return () => {
      unsubscribeFirestoreLb();
      socket.off('room:state', handleRoomState);
      socket.off('room:joined', handleRoomJoined);
      socket.off('draw:action', handleDrawAction);
      socket.off('canvas:clear', handleCanvasClear);
      socket.off('canvas:history', handleCanvasHistory);
      socket.off('chat:message', handleChatMessage);
      socket.off('chat:message_reaction_update', handleMessageReactionUpdate);
      socket.off('reaction:broadcast', handleReactionBroadcast);
      socket.off('leaderboard:update', handleLeaderboardUpdate);
      socket.off('rooms:list', handleRoomsList);
      socket.off('room:timer', handleRoomTimer);
      socket.off('room:hint_update', handleHintUpdate);
      socket.off('room:error', handleRoomError);
      socket.off('room:closed', handleRoomClosed);
    };
  }, [user, updateStats]);

  // Sync profile changes to live socket server
  useEffect(() => {
    if (user) {
      const socket = getSocket();
      socket.emit('player:profile_update', {
        player: {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          color: user.color,
        },
      });
    }
  }, [user?.id, user?.username, user?.avatar, user?.color]);


  const fetchPublicRooms = useCallback(() => {
    const socket = getSocket();
    socket.emit('rooms:get');
    fetch('/api/rooms')
      .then(res => res.json())
      .then(data => {
        if (data.rooms) setPublicRooms(data.rooms);
      })
      .catch(err => console.warn('Failed to fetch rooms API', err));
  }, []);

  // Periodic polling for public rooms when in lobby
  useEffect(() => {
    if (!gameState) {
      fetchPublicRooms();
      const interval = setInterval(fetchPublicRooms, 3000);
      return () => clearInterval(interval);
    }
  }, [gameState, fetchPublicRooms]);

  const createRoom = (settings: RoomSettings, roomName?: string) => {
    if (!user) return;
    const socket = getSocket();
    const player: Player = {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      color: user.color,
      isHost: true,
      isDrawing: false,
      hasGuessed: false,
      score: 0,
      roundScore: 0,
      streak: 0,
      isConnected: true,
      stats: user.stats,
    };
    socket.emit('room:create', { player, settings, roomName });
  };

  const joinRoom = (roomIdentifier: string) => {
    if (!user || !roomIdentifier.trim()) return;
    const socket = getSocket();
    const player: Player = {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      color: user.color,
      isHost: false,
      isDrawing: false,
      hasGuessed: false,
      score: 0,
      roundScore: 0,
      streak: 0,
      isConnected: true,
      stats: user.stats,
    };
    socket.emit('room:join', { roomIdentifier: roomIdentifier.trim(), player });
  };

  const quickJoin = () => {
    if (!user) return;
    const socket = getSocket();
    const player: Player = {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      color: user.color,
      isHost: false,
      isDrawing: false,
      hasGuessed: false,
      score: 0,
      roundScore: 0,
      streak: 0,
      isConnected: true,
      stats: user.stats,
    };
    socket.emit('room:quick_join', { player });
  };

  const startGame = () => {
    const socket = getSocket();
    socket.emit('game:start');
  };

  const selectWord = (choice: WordChoice) => {
    const socket = getSocket();
    socket.emit('word:select', { choice });
  };

  const sendCanvasAction = (action: CanvasAction) => {
    const socket = getSocket();
    if (action.type === 'clear') {
      setDrawingHistory([]);
    } else {
      setDrawingHistory(prev => [...prev, action]);
    }
    socket.emit('draw:action', action);
  };

  const clearCanvas = () => {
    const socket = getSocket();
    setDrawingHistory([]);
    socket.emit('canvas:clear');
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const socket = getSocket();
    socket.emit('chat:send', { text: text.trim() });
  };

  const sendReaction = (emoji: string) => {
    const socket = getSocket();
    socket.emit('reaction:send', { emoji });
  };

  const reactToMessage = (messageId: string, emoji: string) => {
    const socket = getSocket();
    socket.emit('chat:react_message', { messageId, emoji });
  };

  const leaveRoom = () => {
    const socket = getSocket();
    socket.emit('room:leave');
    setGameState(null);
    setDrawingHistory([]);
    setMessages([]);
    setIsHost(false);
    fetchPublicRooms();
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        messages,
        drawingHistory,
        isHost,
        isDrawer,
        currentPlayer,
        globalLeaderboard,
        publicRooms,
        reactions,
        errorMessage,
        clearError,
        createRoom,
        joinRoom,
        quickJoin,
        startGame,
        selectWord,
        sendCanvasAction,
        clearCanvas,
        sendMessage,
        sendReaction,
        reactToMessage,
        leaveRoom,
        fetchPublicRooms,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
