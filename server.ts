import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';
import fs from 'fs';
import {
  GameState,
  Player,
  RoomSettings,
  RoomSummary,
  CanvasAction,
  ChatMessage,
  LeaderboardEntry,
  WordChoice,
  UserProfile,
  ArcadeGameMode,
} from './src/types';
import { getRandomWordChoices } from './src/data/words';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

app.use(express.json());

// Initialize Firebase Admin if credentials provided
let firestore: Firestore | null = null;
try {
  // If GOOGLE_APPLICATION_CREDENTIALS is set, the default credential provider works.
  // Otherwise, if a JSON string is provided in FIREBASE_SERVICE_ACCOUNT_JSON, initialize from that.
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    initializeApp({
      credential: applicationDefault(),
    });
    firestore = getFirestore();
    console.log('[Firebase] Initialized via GOOGLE_APPLICATION_CREDENTIALS file.');
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    initializeApp({
      credential: cert(svc),
    });
    firestore = getFirestore();
    console.log('[Firebase] Initialized via FIREBASE_SERVICE_ACCOUNT_JSON env var.');
  } else {
    console.log('[Firebase] GOOGLE_APPLICATION_CREDENTIALS not set — running in in-memory-only mode.');
  }
} catch (err) {
  console.error('[Firebase] Initialization error:', err);
  firestore = null;
}

// In-Memory Database for Global Persistence (fallback)
interface GlobalStatsStore {
  leaderboard: LeaderboardEntry[];
  users: Map<string, UserProfile>;
}

const GLOBAL_STORE: GlobalStatsStore = {
  leaderboard: [],
  users: new Map<string, UserProfile>(),
};

// Rooms Registry
interface ServerRoom {
  id: string;
  code: string;
  name: string;
  hostSocketId: string;
  settings: RoomSettings;
  state: GameState;
  drawingHistory: CanvasAction[];
  timerInterval?: NodeJS.Timeout;
  currentTurnWord: string;
  currentWordPoints: number;
  wordSelected: boolean;
  drawerIndex: number;
  playersWhoGuessed: Set<string>;
}

const ROOMS = new Map<string, ServerRoom>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Firestore helpers
async function saveRoomToFirestore(room: ServerRoom) {
  if (!firestore) return;
  try {
    const doc = {
      id: room.id,
      code: room.code,
      name: room.name,
      settings: room.settings,
      state: {
        ...room.state,
        // Avoid storing large or circular objects; sanitize players
        players: room.state.players.map(p => ({
          id: p.id,
          username: p.username,
          avatar: p.avatar,
          color: p.color,
          score: p.score,
          isHost: p.isHost,
          isConnected: p.isConnected,
        })),
      },
      updatedAt: FieldValue.serverTimestamp(),
    };
    await firestore.collection('rooms').doc(room.id).set(doc, { merge: true });
  } catch (err) {
    console.error('Failed to save room to Firestore:', err);
  }
}

async function deleteRoomFromFirestore(roomId: string) {
  if (!firestore) return;
  try {
    await firestore.collection('rooms').doc(roomId).delete();
  } catch (err) {
    console.error('Failed to delete room from Firestore:', err);
  }
}

async function saveActivityToFirestore(activity: any) {
  if (!firestore) return;
  try {
    await firestore.collection('activities').add({
      ...activity,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to save activity to Firestore:', err);
  }
}

async function saveLeaderboardEntryToFirestore(entry: LeaderboardEntry) {
  if (!firestore) return;
  try {
    await firestore.collection('leaderboard').doc(entry.userId).set({
      userId: entry.userId,
      username: entry.username,
      avatar: entry.avatar,
      score: entry.score,
      wins: entry.wins,
      gamesPlayed: entry.gamesPlayed,
      wordsGuessed: entry.wordsGuessed,
      rank: entry.rank,
      winRate: entry.winRate,
      level: entry.level,
      lastActive: entry.lastActive,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Failed to save leaderboard entry to Firestore:', err);
  }
}

function updateGlobalLeaderboard(player: Player, won: boolean) {
  let entry = GLOBAL_STORE.leaderboard.find(e => e.userId === player.id || e.username.toLowerCase() === player.username.toLowerCase());
  
  if (entry) {
    entry.score += player.score;
    entry.gamesPlayed += 1;
    if (won) entry.wins += 1;
    entry.wordsGuessed += (player.stats?.wordsGuessed || 0);
    entry.winRate = Math.round((entry.wins / entry.gamesPlayed) * 100);
    entry.lastActive = 'Just now';
    entry.level = Math.floor(entry.score / 800) + 1;
    entry.avatar = player.avatar || entry.avatar;
  } else {
    entry = {
      userId: player.id,
      username: player.username,
      avatar: player.avatar,
      score: player.score,
      wins: won ? 1 : 0,
      gamesPlayed: 1,
      wordsGuessed: player.stats?.wordsGuessed || 0,
      rank: 0,
      winRate: won ? 100 : 0,
      lastActive: 'Just now',
      level: Math.floor(player.score / 800) + 1,
    };
    GLOBAL_STORE.leaderboard.push(entry);
  }

  // Recalculate ranks
  GLOBAL_STORE.leaderboard.sort((a, b) => b.score - a.score);
  GLOBAL_STORE.leaderboard.forEach((item, index) => {
    item.rank = index + 1;
  });

  // Broadcast updated leaderboard globally
  io.emit('leaderboard:update', GLOBAL_STORE.leaderboard);

  // Persist leaderboard entry for the player
  saveLeaderboardEntryToFirestore(entry).catch(() => {});
}

function getMaskedHint(word: string, revealedIndices: number[]): string {
  return word
    .split('')
    .map((char, index) => {
      if (char === ' ') return '  ';
      if (revealedIndices.includes(index)) return char;
      return '_';
    })
    .join(' ');
}

function sanitizeWordForComparison(w: string): string {
  return w.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

function calculateLevenshtein(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: bn + 1 }, () => Array(an + 1).fill(0));
  for (let i = 0; i <= an; ++i) matrix[0][i] = i;
  for (let i = 0; i <= bn; ++i) matrix[i][0] = i;
  for (let i = 1; i <= bn; ++i) {
    for (let j = 1; j <= an; ++j) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1) // insertion / deletion
        );
      }
    }
  }
  return matrix[bn][an];
}

function getPublicRoomsList(): RoomSummary[] {
  const publicRooms: RoomSummary[] = [];
  ROOMS.forEach(room => {
    const activeCount = room.state.players.filter(p => p.isConnected).length;
    // Only return non-private rooms with active players and open slots
    if (!room.settings.isPrivate && activeCount > 0 && activeCount < room.settings.maxPlayers) {
      publicRooms.push({
        id: room.id,
        name: room.name,
        code: room.code,
        hostName: room.state.players.find(p => p.isHost && p.isConnected)?.username || room.state.players.find(p => p.isConnected)?.username || 'Host',
        playerCount: activeCount,
        maxPlayers: room.settings.maxPlayers,
        status: room.state.status,
        isPrivate: room.settings.isPrivate,
        roundDuration: room.settings.roundDuration,
        currentRound: room.state.currentRound,
        maxRounds: room.state.totalRounds,
        gameMode: room.settings.gameMode,
        betting: room.settings.betting,
      });
    }
  });
  return publicRooms;
}

// REST APIs
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', activeRooms: ROOMS.size, timestamp: Date.now() });
});

app.get('/api/leaderboard', (req: Request, res: Response) => {
  res.json({ leaderboard: GLOBAL_STORE.leaderboard });
});

app.get('/api/rooms', (req: Request, res: Response) => {
  res.json({ rooms: getPublicRoomsList() });
});

// Socket.io Real-time Event Management
io.on('connection', (socket: Socket) => {
  let currentRoomId: string | null = null;
  let currentPlayerId: string | null = null;

  // Send initial leaderboard and public rooms list immediately
  socket.emit('leaderboard:update', GLOBAL_STORE.leaderboard);
  socket.emit('rooms:list', getPublicRoomsList());

  // Allow client to request latest public rooms on demand
  socket.on('rooms:get', () => {
    socket.emit('rooms:list', getPublicRoomsList());
  });

  // 1. Create Room
  socket.on('room:create', async ({ player, settings, roomName }: { player: Player; settings: RoomSettings; roomName: string }) => {
    const roomId = 'room_' + Math.random().toString(36).substring(2, 9);
    const code = generateRoomCode();

    const hostPlayer: Player = {
      ...player,
      socketId: socket.id,
      isHost: true,
      isDrawing: false,
      hasGuessed: false,
      score: 0,
      roundScore: 0,
      streak: 0,
      isConnected: true,
    };

    const newRoom: ServerRoom = {
      id: roomId,
      code,
      name: roomName || `${player.username}'s Game`,
      hostSocketId: socket.id,
      settings: {
        roundDuration: settings.roundDuration || 60,
        maxRounds: settings.maxRounds || 3,
        maxPlayers: settings.maxPlayers || 8,
        wordCategory: settings.wordCategory || 'all',
        customWords: settings.customWords || [],
        isPrivate: settings.isPrivate ?? false,
        allowHints: settings.allowHints ?? true,
        botPlayersEnabled: settings.botPlayersEnabled ?? false,
        betting: settings.betting,
        gameMode: (settings.gameMode || 'multiplayer_draw') as ArcadeGameMode,
      },
      state: {
        roomId,
        roomCode: code,
        roomName: roomName || `${player.username}'s Game`,
        status: 'lobby',
        currentRound: 1,
        totalRounds: settings.maxRounds || 3,
        drawerId: null,
        drawerName: null,
        word: '',
        wordLength: 0,
        revealedIndices: [],
        hint: '',
        wordChoices: [],
        timeLeft: settings.roundDuration || 60,
        totalTime: settings.roundDuration || 60,
        players: [hostPlayer],
        settings,
      },
      drawingHistory: [],
      currentTurnWord: '',
      currentWordPoints: 100,
      wordSelected: false,
      drawerIndex: 0,
      playersWhoGuessed: new Set<string>(),
    };

    // Ensure no accidental bot players are present when bots are not enabled
    if (!newRoom.settings.botPlayersEnabled) {
      newRoom.state.players = newRoom.state.players.filter(p => !(typeof p.id === 'string' && p.id.startsWith('bot_')));
    }

    ROOMS.set(roomId, newRoom);
    currentRoomId = roomId;
    currentPlayerId = player.id;

    socket.join(roomId);
    socket.emit('room:joined', { room: newRoom.state, isHost: true });
    socket.emit('canvas:history', newRoom.drawingHistory);
    broadcastPublicRoomsList();

    // Persist room to Firestore (best-effort, async)
    await saveRoomToFirestore(newRoom);
    await saveActivityToFirestore({ type: 'room_create', roomId: newRoom.id, by: player.id, roomName: newRoom.name }).catch(() => {});
  });

  // 2. Join Room by Code or ID
  socket.on('room:join', async ({ roomIdentifier, player }: { roomIdentifier: string; player: Player }) => {
    const search = roomIdentifier.trim().toUpperCase();
    let room: ServerRoom | undefined;

    ROOMS.forEach(r => {
      if (r.id === roomIdentifier || r.code === search) {
        room = r;
      }
    });

    if (!room) {
      socket.emit('room:error', { message: 'Room not found. Check code or ID.' });
      return;
    }

    if (room.state.players.length >= room.settings.maxPlayers) {
      socket.emit('room:error', { message: 'Room is full.' });
      return;
    }

    // Reject bot join attempts unless room explicitly allows bots
    if ((player.id || '').startsWith('bot_') && !room.settings.botPlayersEnabled) {
      socket.emit('room:error', { message: 'Bots are disabled for this room.' });
      return;
    }

    // Check if player rejoining
    const existingIndex = room.state.players.findIndex(p => p.id === player.id);
    const newPlayer: Player = {
      ...player,
      socketId: socket.id,
      isHost: existingIndex >= 0 ? room.state.players[existingIndex].isHost : room.state.players.length === 0,
      isDrawing: existingIndex >= 0 ? room.state.players[existingIndex].isDrawing : false,
      hasGuessed: existingIndex >= 0 ? room.state.players[existingIndex].hasGuessed : false,
      score: existingIndex >= 0 ? room.state.players[existingIndex].score : 0,
      roundScore: 0,
      streak: existingIndex >= 0 ? room.state.players[existingIndex].streak : 0,
      isConnected: true,
    };

    if (existingIndex >= 0) {
      room.state.players[existingIndex] = newPlayer;
    } else {
      room.state.players.push(newPlayer);
    }

    currentRoomId = room.id;
    currentPlayerId = player.id;

    socket.join(room.id);
    socket.emit('room:joined', { room: room.state, isHost: newPlayer.isHost });
    socket.emit('canvas:history', room.drawingHistory);

    // Announce player joined
    const joinMsg: ChatMessage = {
      id: 'sys_' + Date.now(),
      senderName: 'System',
      text: `👋 ${newPlayer.username} joined the game!`,
      type: 'system',
      timestamp: Date.now(),
    };
    io.to(room.id).emit('chat:message', joinMsg);
    io.to(room.id).emit('room:state', sanitizeStateForClient(room));
    broadcastPublicRoomsList();

    // Save updated room
    await saveRoomToFirestore(room);
    await saveActivityToFirestore({ type: 'player_join', roomId: room.id, playerId: newPlayer.id }).catch(() => {});
  });

  // 3. Quick Match / Auto Join
  socket.on('room:quick_join', ({ player }: { player: Player }) => {
    let targetRoom: ServerRoom | undefined;
    ROOMS.forEach(r => {
      if (!r.settings.isPrivate && r.state.players.length < r.settings.maxPlayers && r.state.status === 'lobby') {
        targetRoom = r;
      }
    });

    if (targetRoom) {
      // Join existing
      socket.emit('room:join_ready', { roomIdentifier: targetRoom.id });
    } else {
      // Auto-create public lobby
      const defaultSettings: RoomSettings = {
        roundDuration: 60,
        maxRounds: 3,
        maxPlayers: 8,
        wordCategory: 'all',
        customWords: [],
        isPrivate: false,
        allowHints: true,
        botPlayersEnabled: false,
      };
      const roomId = 'room_' + Math.random().toString(36).substring(2, 9);
      const code = generateRoomCode();
      const hostPlayer: Player = {
        ...player,
        socketId: socket.id,
        isHost: true,
        isDrawing: false,
        hasGuessed: false,
        score: 0,
        roundScore: 0,
        streak: 0,
        isConnected: true,
      };

      const newRoom: ServerRoom = {
        id: roomId,
        code,
        name: `Public Arena #${code.substring(0, 3)}`,
        hostSocketId: socket.id,
        settings: defaultSettings,
        state: {
          roomId,
          roomCode: code,
          roomName: `Public Arena #${code.substring(0, 3)}`,
          status: 'lobby',
          currentRound: 1,
          totalRounds: 3,
          drawerId: null,
          drawerName: null,
          word: '',
          wordLength: 0,
          revealedIndices: [],
          hint: '',
          wordChoices: [],
          timeLeft: 60,
          totalTime: 60,
          players: [hostPlayer],
          settings: defaultSettings,
        },
        drawingHistory: [],
        currentTurnWord: '',
        currentWordPoints: 100,
        wordSelected: false,
        drawerIndex: 0,
        playersWhoGuessed: new Set<string>(),
      };

      ROOMS.set(roomId, newRoom);
      socket.join(roomId);
      socket.emit('room:joined', { room: newRoom.state, isHost: true });
      broadcastPublicRoomsList();

      // Save created room
      saveRoomToFirestore(newRoom).catch(() => {});
      saveActivityToFirestore({ type: 'room_quick_create', roomId: newRoom.id }).catch(() => {});
    }
  });

  // Add Bot Player to room (Host only)
  socket.on('room:add_bot', async ({ botName }: { botName?: string } = {}) => {
    if (!currentRoomId) return;
    const room = ROOMS.get(currentRoomId);
    if (!room) return;

    const caller = room.state.players.find(p => p.id === currentPlayerId);
    if (!caller?.isHost) {
      socket.emit('room:error', { message: 'Only host can add bot players.' });
      return;
    }

    if (room.state.players.length >= room.settings.maxPlayers) {
      socket.emit('room:error', { message: 'Room has reached maximum player capacity.' });
      return;
    }

    const botNames = ['Leonardo AI', 'Picasso Bot', 'Cyber Doodler', 'Pixel Master', 'Chroma Bot', 'Neon Genius', 'Retro Bot'];
    const existingBotCount = room.state.players.filter(p => typeof p.id === 'string' && p.id.startsWith('bot_')).length;
    const chosenName = botName || botNames[existingBotCount % botNames.length] || `Bot ${existingBotCount + 1}`;
    const botAvatars = ['🤖', '🎨', '👾', '✨', '⚡', '🎭', '🔮'];
    const chosenAvatar = botAvatars[existingBotCount % botAvatars.length];
    const botColors = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4'];
    const chosenColor = botColors[existingBotCount % botColors.length];

    const botPlayer: Player = {
      id: 'bot_' + Math.random().toString(36).substring(2, 9),
      username: chosenName,
      avatar: chosenAvatar,
      color: chosenColor,
      isHost: false,
      isDrawing: false,
      hasGuessed: false,
      score: 0,
      roundScore: 0,
      streak: 0,
      isConnected: true,
    };

    room.settings.botPlayersEnabled = true;
    room.state.players.push(botPlayer);

    io.to(room.id).emit('chat:message', {
      id: 'sys_' + Date.now(),
      senderName: 'System',
      text: `🤖 ${botPlayer.username} joined the lobby!`,
      type: 'system',
      timestamp: Date.now(),
    });

    io.to(room.id).emit('room:state', sanitizeStateForClient(room));
    broadcastPublicRoomsList();
    saveRoomToFirestore(room).catch(() => {});
  });

  // Remove Bot Player from room (Host only)
  socket.on('room:remove_bot', async ({ botId }: { botId?: string } = {}) => {
    if (!currentRoomId) return;
    const room = ROOMS.get(currentRoomId);
    if (!room) return;

    const caller = room.state.players.find(p => p.id === currentPlayerId);
    if (!caller?.isHost) {
      socket.emit('room:error', { message: 'Only host can remove bot players.' });
      return;
    }

    let removedBot: Player | undefined;
    if (botId) {
      const idx = room.state.players.findIndex(p => p.id === botId && typeof p.id === 'string' && p.id.startsWith('bot_'));
      if (idx >= 0) {
        removedBot = room.state.players.splice(idx, 1)[0];
      }
    } else {
      // Remove last bot
      for (let i = room.state.players.length - 1; i >= 0; i--) {
        if (typeof room.state.players[i].id === 'string' && room.state.players[i].id.startsWith('bot_')) {
          removedBot = room.state.players.splice(i, 1)[0];
          break;
        }
      }
    }

    if (removedBot) {
      const remainingBots = room.state.players.filter(p => typeof p.id === 'string' && p.id.startsWith('bot_'));
      if (remainingBots.length === 0) {
        room.settings.botPlayersEnabled = false;
      }

      io.to(room.id).emit('chat:message', {
        id: 'sys_' + Date.now(),
        senderName: 'System',
        text: `👋 ${removedBot.username} left the lobby.`,
        type: 'system',
        timestamp: Date.now(),
      });

      io.to(room.id).emit('room:state', sanitizeStateForClient(room));
      broadcastPublicRoomsList();
      saveRoomToFirestore(room).catch(() => {});
    }
  });

  // 4. Start Game (Host only) — dispatcher by gameMode
  socket.on('game:start', async () => {
    if (!currentRoomId) return;
    const room = ROOMS.get(currentRoomId);
    if (!room) return;

    const caller = room.state.players.find(p => p.id === currentPlayerId);
    if (!caller?.isHost) {
      socket.emit('room:error', { message: 'Only host can start the game.' });
      return;
    }

    // Determine requested game mode (server-first)
    const rawGameMode = (room.settings && (room.settings as any).gameMode) || (room.state.settings && (room.state.settings as any).gameMode) || 'drawing';
    const gameMode = typeof rawGameMode === 'string' ? rawGameMode.toLowerCase() : 'drawing';

    if (gameMode === 'uno' || gameMode === 'uno_party') {
      // Start UNO stub
      startUnoGame(room);
      await saveActivityToFirestore({ type: 'game_start_uno', roomId: room.id, by: caller.id }).catch(() => {});
      await saveRoomToFirestore(room);
      return;
    }

    const activePlayers = room.state.players.filter(p => p.isConnected);
    if (activePlayers.length < 2) {
      socket.emit('room:error', {
        message: 'Need at least 2 players to start! Invite a friend with the Room Code or click "+ Add AI Bot" if you wish to add AI bots.',
      });
      return;
    }

    // Reset scores & rounds
    room.state.currentRound = 1;
    room.state.players.forEach(p => {
      p.score = 0;
      p.roundScore = 0;
      p.hasGuessed = false;
      p.streak = 0;
    });
    room.drawerIndex = 0;

    await saveActivityToFirestore({ type: 'game_start_drawing', roomId: room.id, by: caller.id }).catch(() => {});
    startTurnCycle(room);
    broadcastPublicRoomsList();
    await saveRoomToFirestore(room);
  });

  // 5. Word Selection by Drawer
  socket.on('word:select', ({ choice }: { choice: WordChoice }) => {
    if (!currentRoomId) return;
    const room = ROOMS.get(currentRoomId);
    if (!room || room.state.status !== 'selecting_word') return;

    if (room.state.drawerId !== currentPlayerId) return;

    room.currentTurnWord = choice.word;
    room.currentWordPoints = choice.points;
    room.wordSelected = true;
    room.state.word = choice.word;
    room.state.wordLength = choice.word.length;
    room.state.hint = choice.hint || '';
    room.state.revealedIndices = [];

    // Clear previous timer and begin drawing phase
    if (room.timerInterval) clearInterval(room.timerInterval);
    beginDrawingPhase(room);

    // Save room state
    saveRoomToFirestore(room).catch(() => {});
  });

  // 6. Drawing Events (Broadcast to room)
  socket.on('draw:action', (action: CanvasAction) => {
    if (!currentRoomId) return;
    const room = ROOMS.get(currentRoomId);
    if (!room || room.state.status !== 'drawing') return;

    // Only current drawer can draw
    if (room.state.drawerId !== currentPlayerId) return;

    if (action.type === 'clear') {
      room.drawingHistory = [];
    } else {
      room.drawingHistory.push(action);
    }

    // Broadcast stroke to all OTHER clients in the room
    socket.to(currentRoomId).emit('draw:action', action);
  });

  // 7. Clear Canvas
  socket.on('canvas:clear', () => {
    if (!currentRoomId) return;
    const room = ROOMS.get(currentRoomId);
    if (!room || room.state.drawerId !== currentPlayerId) return;

    room.drawingHistory = [];
    io.to(currentRoomId).emit('canvas:clear');
  });

  // 8. Chat / Guess Submission
  socket.on('chat:send', ({ text }: { text: string }) => {
    if (!currentRoomId || !text || text.trim().length === 0) return;
    const room = ROOMS.get(currentRoomId);
    if (!room) return;

    const sender = room.state.players.find(p => p.id === currentPlayerId);
    if (!sender) return;

    const cleanInput = text.trim();
    const isDrawingPhase = room.state.status === 'drawing';
    const isDrawer = room.state.drawerId === sender.id;
    const alreadyGuessed = room.playersWhoGuessed.has(sender.id);

    // If drawing phase, check if input is a guess
    if (isDrawingPhase && !isDrawer && !alreadyGuessed) {
      const sanitizedGuess = sanitizeWordForComparison(cleanInput);
      const sanitizedTarget = sanitizeWordForComparison(room.currentTurnWord);

      if (sanitizedGuess === sanitizedTarget) {
        // CORRECT GUESS!
        room.playersWhoGuessed.add(sender.id);
        sender.hasGuessed = true;

        // Calculate score
        const timeRatio = Math.max(0.15, room.state.timeLeft / room.state.totalTime);
        const speedBonus = Math.round(room.currentWordPoints * timeRatio);
        const streakBonus = sender.streak * 25;
        const totalPointsGained = speedBonus + streakBonus;

        sender.roundScore = totalPointsGained;
        sender.score += totalPointsGained;
        sender.streak += 1;
        sender.guessTime = room.state.totalTime - room.state.timeLeft;

        // Notify Room that player guessed
        const correctMsg: ChatMessage = {
          id: 'guess_' + Date.now(),
          senderId: sender.id,
          senderName: sender.username,
          senderColor: sender.color,
          senderAvatar: sender.avatar,
          text: `🎉 ${sender.username} guessed the word! (+${totalPointsGained} pts)`,
          type: 'correct_guess',
          timestamp: Date.now(),
          pointsAwarded: totalPointsGained,
        };
        io.to(room.id).emit('chat:message', correctMsg);

        // Update player stats
        if (!sender.stats) {
          sender.stats = {
            gamesPlayed: 1,
            wins: 0,
            totalScore: totalPointsGained,
            wordsGuessed: 1,
            drawingsCompleted: 0,
            highestRoundScore: totalPointsGained,
          };
        } else {
          sender.stats.wordsGuessed += 1;
          sender.stats.totalScore += totalPointsGained;
          if (totalPointsGained > sender.stats.highestRoundScore) {
            sender.stats.highestRoundScore = totalPointsGained;
          }
        }

        // Broadcast room state
        io.to(room.id).emit('room:state', sanitizeStateForClient(room));

        // Check if ALL non-drawing players have guessed
        const nonDrawingPlayers = room.state.players.filter(p => p.id !== room.state.drawerId && p.isConnected);
        if (room.playersWhoGuessed.size >= nonDrawingPlayers.length) {
          // Everyone guessed! End round immediately
          if (room.timerInterval) clearInterval(room.timerInterval);
          endTurnCycle(room, 'Everyone guessed the word!');
        }
        return;
      }

      // Check if CLOSE guess (Levenshtein distance <= 2)
      const levDist = calculateLevenshtein(sanitizedGuess, sanitizedTarget);
      if (levDist > 0 && levDist <= 2 && sanitizedTarget.length >= 4) {
        socket.emit('chat:message', {
          id: 'close_' + Date.now(),
          senderName: 'Hint Master',
          text: `🔥 "${cleanInput}" is very close! Keep guessing!`,
          type: 'close_guess',
          timestamp: Date.now(),
        });
        return;
      }
    }

    // Standard Chat Message Broadcast
    const chatMsg: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      senderId: sender.id,
      senderName: sender.username,
      senderColor: sender.color,
      senderAvatar: sender.avatar,
      text: cleanInput,
      type: 'chat',
      timestamp: Date.now(),
    };
    io.to(room.id).emit('chat:message', chatMsg);
  });

  // 9. Quick Emoji Reaction
  socket.on('reaction:send', ({ emoji }: { emoji: string }) => {
    if (!currentRoomId) return;
    const room = ROOMS.get(currentRoomId);
    if (!room) return;
    const sender = room.state.players.find(p => p.id === currentPlayerId);
    if (!sender) return;

    io.to(room.id).emit('reaction:broadcast', {
      senderName: sender.username,
      emoji,
      id: 'rx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
    });
  });

  // 10. Live Profile & Avatar Update
  socket.on('player:profile_update', ({ player }: { player: { id: string; username: string; avatar: string; color?: string } }) => {
    if (!player || !player.id) return;

    // Update in current active room
    if (currentRoomId) {
      const room = ROOMS.get(currentRoomId);
      if (room) {
        const p = room.state.players.find(pl => pl.id === player.id);
        if (p) {
          p.username = player.username || p.username;
          p.avatar = player.avatar || p.avatar;
          if (player.color) p.color = player.color;
          io.to(room.id).emit('room:state', sanitizeStateForClient(room));
          saveRoomToFirestore(room).catch(() => {});
        }
      }
    }

    // Update in global leaderboard store
    const entry = GLOBAL_STORE.leaderboard.find(
      e => e.userId === player.id || e.username.toLowerCase() === (player.username || '').toLowerCase()
    );
    if (entry) {
      if (player.username) entry.username = player.username;
      if (player.avatar) entry.avatar = player.avatar;
      io.emit('leaderboard:update', GLOBAL_STORE.leaderboard);
      saveLeaderboardEntryToFirestore(entry).catch(() => {});
    }
  });

  // 11. Explicit Leave Room Handler
  socket.on('room:leave', async () => {
    if (currentRoomId && currentPlayerId) {
      const room = ROOMS.get(currentRoomId);
      if (room) {
        const pIndex = room.state.players.findIndex(p => p.id === currentPlayerId);
        if (pIndex >= 0) {
          const departingPlayer = room.state.players[pIndex];
          departingPlayer.isConnected = false;

          // If the room owner / host leaves, close the room immediately and return all players to lobby
          if (departingPlayer.isHost) {
            if (room.timerInterval) clearInterval(room.timerInterval);

            // Notify all players in room that the host left and room is dissolved
            io.to(room.id).emit('room:closed', {
              reason: `👑 Room host ${departingPlayer.username || 'Host'} left. The room has been closed.`,
              hostName: departingPlayer.username || 'Host',
            });

            // Disband sockets from room
            io.in(room.id).socketsLeave(room.id);

            // Delete room completely
            ROOMS.delete(room.id);
            await deleteRoomFromFirestore(room.id).catch(() => {});
            broadcastPublicRoomsList();
            socket.leave(currentRoomId);
            currentRoomId = null;
            return;
          }

          if (room.state.drawerId === departingPlayer.id && room.state.status === 'drawing') {
            if (room.timerInterval) clearInterval(room.timerInterval);
            endTurnCycle(room, 'Drawer left the game.');
          }

          io.to(room.id).emit('chat:message', {
            id: 'sys_' + Date.now(),
            senderName: 'System',
            text: `🚪 ${departingPlayer.username} left the room.`,
            type: 'system',
            timestamp: Date.now(),
          });

          // Remove room if no active players
          const activeCount = room.state.players.filter(p => p.isConnected).length;
          if (activeCount === 0) {
            if (room.timerInterval) clearInterval(room.timerInterval);
            ROOMS.delete(room.id);
            await deleteRoomFromFirestore(room.id).catch(() => {});
          } else {
            io.to(room.id).emit('room:state', sanitizeStateForClient(room));
            await saveRoomToFirestore(room).catch(() => {});
          }
          broadcastPublicRoomsList();
        }
        socket.leave(currentRoomId);
        currentRoomId = null;
      }
    }
  });

  // 12. Disconnect Handler
  socket.on('disconnect', async () => {
    if (currentRoomId && currentPlayerId) {
      const room = ROOMS.get(currentRoomId);
      if (room) {
        const pIndex = room.state.players.findIndex(p => p.id === currentPlayerId);
        if (pIndex >= 0) {
          const departingPlayer = room.state.players[pIndex];
          departingPlayer.isConnected = false;

          // If the room owner / host disconnected, close the room immediately and kick players to lobby
          if (departingPlayer.isHost) {
            if (room.timerInterval) clearInterval(room.timerInterval);

            // Notify all players in room that the host disconnected and room is dissolved
            io.to(room.id).emit('room:closed', {
              reason: `👑 Room host ${departingPlayer.username || 'Host'} disconnected. The room has been closed.`,
              hostName: departingPlayer.username || 'Host',
            });

            // Disband sockets from room
            io.in(room.id).socketsLeave(room.id);

            // Delete room completely
            ROOMS.delete(room.id);
            await deleteRoomFromFirestore(room.id).catch(() => {});
            broadcastPublicRoomsList();
            return;
          }

          // If was drawer in active turn, skip turn
          if (room.state.drawerId === departingPlayer.id && room.state.status === 'drawing') {
            if (room.timerInterval) clearInterval(room.timerInterval);
            endTurnCycle(room, 'Drawer left the game.');
          }

          io.to(room.id).emit('chat:message', {
            id: 'sys_' + Date.now(),
            senderName: 'System',
            text: `🚪 ${departingPlayer.username} left the room.`,
            type: 'system',
            timestamp: Date.now(),
          });

          // Clean empty rooms
          const activeCount = room.state.players.filter(p => p.isConnected).length;
          if (activeCount === 0) {
            if (room.timerInterval) clearInterval(room.timerInterval);
            ROOMS.delete(room.id);
            await deleteRoomFromFirestore(room.id).catch(() => {});
          } else {
            io.to(room.id).emit('room:state', sanitizeStateForClient(room));
            await saveRoomToFirestore(room).catch(() => {});
          }
          broadcastPublicRoomsList();
        }
      }
    }
  });
});

// Broadcast Helper
function broadcastPublicRoomsList() {
  io.emit('rooms:list', getPublicRoomsList());
}

// Game Turn & Round Engine (drawing mode)
function startTurnCycle(room: ServerRoom) {
  if (room.timerInterval) clearInterval(room.timerInterval);

  const activePlayers = room.state.players.filter(p => p.isConnected);
  if (activePlayers.length < 2) {
    room.state.status = 'lobby';
    io.to(room.id).emit('room:state', sanitizeStateForClient(room));
    io.to(room.id).emit('chat:message', {
      id: 'sys_' + Date.now(),
      senderName: 'System',
      text: '⚠️ Not enough players to continue. Returning to lobby.',
      type: 'system',
      timestamp: Date.now(),
    });
    saveRoomToFirestore(room).catch(() => {});
    return;
  }

  // Pick Drawer
  if (room.drawerIndex >= activePlayers.length) {
    room.drawerIndex = 0;
    room.state.currentRound += 1;
  }

  // Check Game Over
  if (room.state.currentRound > room.state.totalRounds) {
    handleGameOver(room);
    return;
  }

  const drawer = activePlayers[room.drawerIndex];
  room.state.drawerId = drawer.id;
  room.state.drawerName = drawer.username;

  // Reset player turn statuses
  room.state.players.forEach(p => {
    p.isDrawing = p.id === drawer.id;
    p.hasGuessed = false;
    p.roundScore = 0;
  });

  room.playersWhoGuessed.clear();
  room.drawingHistory = [];
  room.wordSelected = false;

  // Generate 3 word choices
  const choices = getRandomWordChoices(room.settings.wordCategory);
  room.state.wordChoices = choices;
  room.state.status = 'selecting_word';
  room.state.timeLeft = 12; // 12 seconds to choose a word
  room.state.totalTime = 12;
  room.state.word = '';
  room.state.hint = '';
  room.state.revealedIndices = [];

  io.to(room.id).emit('canvas:clear');
  io.to(room.id).emit('room:state', sanitizeStateForClient(room));

  // Drawer notification
  const drawerSocket = io.sockets.sockets.get(drawer.socketId || '');
  if (drawerSocket) {
    drawerSocket.emit('drawer:turn_start', { choices });
  }

  io.to(room.id).emit('chat:message', {
    id: 'turn_' + Date.now(),
    senderName: 'Game Master',
    text: `🎨 Round ${room.state.currentRound}/${room.state.totalRounds}: ${drawer.username} is choosing a word!`,
    type: 'drawer_turn',
    timestamp: Date.now(),
  });

  // Timer for word selection
  room.timerInterval = setInterval(() => {
    room.state.timeLeft -= 1;
    if (room.state.timeLeft <= 0) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      if (!room.wordSelected) {
        // Auto-select medium choice
        const autoChoice = choices[1] || choices[0];
        room.currentTurnWord = autoChoice.word;
        room.currentWordPoints = autoChoice.points;
        room.wordSelected = true;
        room.state.word = autoChoice.word;
        room.state.wordLength = autoChoice.word.length;
        room.state.hint = autoChoice.hint || '';
        beginDrawingPhase(room);
      }
    } else {
      io.to(room.id).emit('room:timer', { timeLeft: room.state.timeLeft });
    }
  }, 1000);
}

function beginDrawingPhase(room: ServerRoom) {
  if (room.timerInterval) clearInterval(room.timerInterval);

  room.state.status = 'drawing';
  room.state.timeLeft = room.settings.roundDuration;
  room.state.totalTime = room.settings.roundDuration;
  room.state.revealedIndices = [];

  const drawer = room.state.players.find(p => p.id === room.state.drawerId);

  io.to(room.id).emit('room:state', sanitizeStateForClient(room));

  // Bot simulation only when explicitly enabled
  triggerBotSimulationIfNeeded(room);

  // Interval for drawing turn
  room.timerInterval = setInterval(() => {
    room.state.timeLeft -= 1;

    // Hint letter reveal calculation
    if (room.settings.allowHints && room.state.wordLength > 3) {
      const timeRemainingPercent = room.state.timeLeft / room.state.totalTime;
      if (timeRemainingPercent <= 0.5 && room.state.revealedIndices.length === 0) {
        const availableIndices = room.currentTurnWord
          .split('')
          .map((c, i) => (c !== ' ' ? i : -1))
          .filter(i => i >= 0);
        if (availableIndices.length > 0) {
          const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
          room.state.revealedIndices.push(randomIndex);
          io.to(room.id).emit('room:hint_update', {
            revealedIndices: room.state.revealedIndices,
            maskedHint: getMaskedHint(room.currentTurnWord, room.state.revealedIndices),
          });
        }
      } else if (timeRemainingPercent <= 0.25 && room.state.revealedIndices.length === 1 && room.state.wordLength >= 6) {
        const availableIndices = room.currentTurnWord
          .split('')
          .map((c, i) => (c !== ' ' && !room.state.revealedIndices.includes(i) ? i : -1))
          .filter(i => i >= 0);
        if (availableIndices.length > 0) {
          const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
          room.state.revealedIndices.push(randomIndex);
          io.to(room.id).emit('room:hint_update', {
            revealedIndices: room.state.revealedIndices,
            maskedHint: getMaskedHint(room.currentTurnWord, room.state.revealedIndices),
          });
        }
      }
    }

    if (room.state.timeLeft <= 0) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      endTurnCycle(room, `Time is up! The word was "${room.currentTurnWord}"`);
    } else {
      io.to(room.id).emit('room:timer', { timeLeft: room.state.timeLeft });
    }
  }, 1000);
}

function triggerBotSimulationIfNeeded(room: ServerRoom) {
  // Don't simulate bots unless the room explicitly enabled them
  if (!room.settings.botPlayersEnabled) return;

  const bots = room.state.players.filter(p => typeof p.id === 'string' && p.id.startsWith('bot_'));
  if (bots.length === 0) return;

  bots.forEach(bot => {
    if (bot.id === room.state.drawerId) {
      // Bot is drawing: emit some sample doodles
      setTimeout(() => {
        if (room.state.status === 'drawing' && room.state.drawerId === bot.id) {
          const samplePoints = [
            { x: 300, y: 300 },
            { x: 400, y: 320 },
            { x: 500, y: 300 },
            { x: 450, y: 500 },
            { x: 350, y: 500 },
            { x: 300, y: 300 },
          ];
          const strokeAction: CanvasAction = {
            id: 'bot_stroke_' + Date.now(),
            type: 'stroke',
            color: '#3B82F6',
            size: 4,
            points: samplePoints,
          };
          room.drawingHistory.push(strokeAction);
          io.to(room.id).emit('draw:action', strokeAction);
        }
      }, 2000);
    } else {
      // Bot is guessing: simulate guess after realistic delay
      const guessDelay = (Math.floor(Math.random() * 15) + 8) * 1000;
      setTimeout(() => {
        if (room.state.status === 'drawing' && !room.playersWhoGuessed.has(bot.id)) {
          room.playersWhoGuessed.add(bot.id);
          bot.hasGuessed = true;
          const score = Math.round(room.currentWordPoints * 0.7);
          bot.score += score;
          bot.roundScore = score;
          io.to(room.id).emit('chat:message', {
            id: 'bot_guess_' + Date.now(),
            senderName: bot.username,
            senderAvatar: bot.avatar,
            text: `🎉 ${bot.username} guessed the word! (+${score} pts)`,
            type: 'correct_guess',
            timestamp: Date.now(),
            pointsAwarded: score,
          });
          io.to(room.id).emit('room:state', sanitizeStateForClient(room));
        }
      }, guessDelay);
    }
  });
}

function endTurnCycle(room: ServerRoom, reason: string) {
  if (room.timerInterval) clearInterval(room.timerInterval);

  room.state.status = 'round_end';
  const drawer = room.state.players.find(p => p.id === room.state.drawerId);

  // Calculate drawer bonus (points for each player who guessed)
  const guesserCount = room.playersWhoGuessed.size;
  const nonDrawingCount = Math.max(1, room.state.players.filter(p => p.id !== room.state.drawerId && p.isConnected).length);
  let drawerBonus = 0;

  if (drawer && guesserCount > 0) {
    const guessRatio = guesserCount / nonDrawingCount;
    drawerBonus = Math.round(room.currentWordPoints * 0.6 * guessRatio);
    drawer.score += drawerBonus;
    drawer.roundScore = drawerBonus;
    if (drawer.stats) drawer.stats.drawingsCompleted += 1;
  }

  // Build round summary
  const correctGuessers = room.state.players
    .filter(p => room.playersWhoGuessed.has(p.id))
    .map(p => ({
      playerId: p.id,
      name: p.username,
      scoreGained: p.roundScore,
      time: p.guessTime || 0,
    }));

  room.state.roundSummary = {
    word: room.currentTurnWord,
    drawerBonus,
    correctGuessers,
  };

  io.to(room.id).emit('chat:message', {
    id: 'reveal_' + Date.now(),
    senderName: 'Game Master',
    text: `✨ Word revealed: "${room.currentTurnWord}"! ${reason}`,
    type: 'word_reveal',
    timestamp: Date.now(),
  });

  io.to(room.id).emit('room:state', sanitizeStateForClient(room));

  // Save room snapshot and activity
  saveRoomToFirestore(room).catch(() => {});
  saveActivityToFirestore({ type: 'round_end', roomId: room.id, reason }).catch(() => {});

  // Advance drawer index
  room.drawerIndex += 1;

  // 6 seconds delay before next turn
  setTimeout(() => {
    if (ROOMS.has(room.id)) {
      startTurnCycle(room);
    }
  }, 6000);
}

function handleGameOver(room: ServerRoom) {
  if (room.timerInterval) clearInterval(room.timerInterval);

  room.state.status = 'game_over';

  // Sort players by score
  const sortedPlayers = [...room.state.players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0] || null;
  room.state.winner = winner;

  // Update global leaderboard and player lifetime stats
  sortedPlayers.forEach((player, idx) => {
    const isWinner = idx === 0 && player.score > 0;
    updateGlobalLeaderboard(player, isWinner);
  });

  io.to(room.id).emit('chat:message', {
    id: 'gameover_' + Date.now(),
    senderName: 'Game Master',
    text: `🏆 GAME OVER! 🥇 Winner: ${winner?.username} with ${winner?.score} points!`,
    type: 'system',
    timestamp: Date.now(),
  });

  io.to(room.id).emit('room:state', sanitizeStateForClient(room));

  // Save final room (and optionally archive)
  saveRoomToFirestore(room).catch(() => {});
  saveActivityToFirestore({ type: 'game_over', roomId: room.id, winner: winner?.id }).catch(() => {});
}

// Sanitize State: Mask secret word for guessers during drawing phase
function sanitizeStateForClient(room: ServerRoom): GameState {
  const isDrawing = room.state.status === 'drawing';
  const maskedWord = isDrawing
    ? getMaskedHint(room.currentTurnWord, room.state.revealedIndices)
    : room.currentTurnWord;

  return {
    ...room.state,
    word: maskedWord,
  };
}

/**
 * UNO stub: put room in UNO state (not a full engine yet).
 * Replace with a full implementation when ready.
 */
function startUnoGame(room: ServerRoom) {
  if (room.timerInterval) clearInterval(room.timerInterval);

  room.state.status = 'drawing';
  // UNO doesn't use drawing state/word; clear to avoid confusion
  room.drawingHistory = [];
  room.currentTurnWord = '';
  room.currentWordPoints = 0;
  room.wordSelected = false;
  // Broadcast UNO state
  io.to(room.id).emit('room:state', sanitizeStateForClient(room));
  io.to(room.id).emit('chat:message', {
    id: 'uno_' + Date.now(),
    senderName: 'Game Master',
    text: `🃏 UNO lobby ready. (This is a server stub — full UNO engine not implemented yet.)`,
    type: 'system',
    timestamp: Date.now(),
  });

  // Save room snapshot and activity (best-effort)
  saveRoomToFirestore(room).catch(() => {});
  saveActivityToFirestore({ type: 'uno_lobby', roomId: room.id }).catch(() => {});
}

// Start Server and Vite Middleware
async function startServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Guess What? Game Server running on port ${PORT}`);
  });
}

startServer();