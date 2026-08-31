import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Paintbrush,
  Eraser,
  PaintBucket,
  RotateCcw,
  Trash2,
  Lock,
  Clock,
  Sparkles,
  HelpCircle,
  Eye,
  Flame,
  Users,
  Copy,
  Check,
  Globe,
  Lock as LockIcon,
  Play,
  Share2,
  ArrowLeft,
  Gamepad2,
} from 'lucide-react';
import { CanvasAction, DrawPoint, StrokeData, FillData } from '../types';
import { useGame } from '../context/GameContext';
import { ReactionOverlay } from './ReactionOverlay';
import { AvatarRenderer } from './AvatarRenderer';

const VIRTUAL_SIZE = 1000; // 1000x1000 coordinate space

const COLOR_PALETTE = [
  '#000000', // Black
  '#FFFFFF', // White
  '#EF4444', // Red
  '#F97316', // Orange
  '#FBBF24', // Yellow
  '#10B981', // Green
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#78350F', // Brown
  '#64748B', // Slate
];

const BRUSH_SIZES = [
  { label: 'S', size: 4, px: 'w-2 h-2' },
  { label: 'M', size: 10, px: 'w-3.5 h-3.5' },
  { label: 'L', size: 20, px: 'w-5 h-5' },
  { label: 'XL', size: 36, px: 'w-6.5 h-6.5' },
];

export const Canvas: React.FC = () => {
  const { gameState, isDrawer, sendCanvasAction, clearCanvas, drawingHistory, reactions, leaveRoom } = useGame();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentStrokePoints = useRef<DrawPoint[]>([]);

  const [activeTool, setActiveTool] = useState<'brush' | 'eraser' | 'fill'>('brush');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(10);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 600, height: 600 });

  // Update canvas sizing responsively
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          // Maintain aspect ratio or fill appropriately
          const size = Math.min(width, height);
          setCanvasDimensions({ width: size, height: size });
        }
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Redraw all actions on canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = canvas.width / VIRTUAL_SIZE;

    // Reset background to white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all actions
    drawingHistory.forEach((action) => {
      if (action.type === 'stroke') {
        if (action.points.length === 0) return;
        ctx.strokeStyle = action.color;
        ctx.lineWidth = action.size * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        const start = action.points[0];
        ctx.moveTo(start.x * scale, start.y * scale);

        for (let i = 1; i < action.points.length; i++) {
          const pt = action.points[i];
          ctx.lineTo(pt.x * scale, pt.y * scale);
        }
        ctx.stroke();
      } else if (action.type === 'fill') {
        floodFillCanvas(ctx, Math.round(action.x * scale), Math.round(action.y * scale), action.color, canvas.width, canvas.height);
      }
    });
  }, [drawingHistory]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas, canvasDimensions]);

  // Flood fill algorithm
  const floodFillCanvas = (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    fillColorHex: string,
    width: number,
    height: number
  ) => {
    try {
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      // Parse target hex color to RGBA
      const dummy = document.createElement('div');
      dummy.style.color = fillColorHex;
      document.body.appendChild(dummy);
      const computed = window.getComputedStyle(dummy).color;
      document.body.removeChild(dummy);

      const rgb = computed.match(/\d+/g);
      if (!rgb || rgb.length < 3) return;
      const fillR = parseInt(rgb[0], 10);
      const fillG = parseInt(rgb[1], 10);
      const fillB = parseInt(rgb[2], 10);

      const startIndex = (startY * width + startX) * 4;
      const targetR = data[startIndex];
      const targetG = data[startIndex + 1];
      const targetB = data[startIndex + 2];

      if (targetR === fillR && targetG === fillG && targetB === fillB) return;

      const matchColor = (idx: number) => {
        return (
          Math.abs(data[idx] - targetR) < 30 &&
          Math.abs(data[idx + 1] - targetG) < 30 &&
          Math.abs(data[idx + 2] - targetB) < 30
        );
      };

      const queue: [number, number][] = [[startX, startY]];
      const visited = new Uint8Array(width * height);

      while (queue.length > 0) {
        const [x, y] = queue.pop()!;
        if (x < 0 || x >= width || y < 0 || y >= height) continue;

        const pixelIndex = y * width + x;
        if (visited[pixelIndex]) continue;
        visited[pixelIndex] = 1;

        const dataIndex = pixelIndex * 4;
        if (matchColor(dataIndex)) {
          data[dataIndex] = fillR;
          data[dataIndex + 1] = fillG;
          data[dataIndex + 2] = fillB;
          data[dataIndex + 3] = 255;

          queue.push([x + 1, y]);
          queue.push([x - 1, y]);
          queue.push([x, y + 1]);
          queue.push([x, y - 1]);
        }
      }
      ctx.putImageData(imgData, 0, 0);
    } catch (e) {
      console.warn('Flood fill error', e);
    }
  };

  // Convert mouse/touch event to normalized virtual coordinate (0..1000)
  const getVirtualCoords = (e: React.MouseEvent | React.TouchEvent): DrawPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const xRel = clientX - rect.left;
    const yRel = clientY - rect.top;

    const scale = VIRTUAL_SIZE / rect.width;
    const xVirtual = Math.max(0, Math.min(VIRTUAL_SIZE, Math.round(xRel * scale)));
    const yVirtual = Math.max(0, Math.min(VIRTUAL_SIZE, Math.round(yRel * scale)));

    return { x: xVirtual, y: yVirtual };
  };

  // Pointer Down (Start Drawing / Fill)
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer || gameState?.status !== 'drawing') return;
    e.preventDefault();

    const pt = getVirtualCoords(e);
    if (!pt) return;

    if (activeTool === 'fill') {
      const fillAction: FillData = {
        id: 'fill_' + Date.now(),
        type: 'fill',
        color: selectedColor,
        x: pt.x,
        y: pt.y,
      };
      sendCanvasAction(fillAction);
      return;
    }

    isDrawingRef.current = true;
    currentStrokePoints.current = [pt];

    // Local immediate feedback
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const scale = canvas.width / VIRTUAL_SIZE;
        ctx.strokeStyle = activeTool === 'eraser' ? '#FFFFFF' : selectedColor;
        ctx.lineWidth = brushSize * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(pt.x * scale, pt.y * scale);
        ctx.lineTo(pt.x * scale, pt.y * scale);
        ctx.stroke();
      }
    }
  };

  // Pointer Move (Continue Stroke)
  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer || !isDrawingRef.current || gameState?.status !== 'drawing') return;
    e.preventDefault();

    const pt = getVirtualCoords(e);
    if (!pt) return;

    const points = currentStrokePoints.current;
    const prevPt = points[points.length - 1];

    // Distance throttle to prevent redundant data points
    if (prevPt && Math.hypot(pt.x - prevPt.x, pt.y - prevPt.y) < 3) {
      return;
    }

    points.push(pt);

    // Draw segment locally
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx && prevPt) {
        const scale = canvas.width / VIRTUAL_SIZE;
        ctx.strokeStyle = activeTool === 'eraser' ? '#FFFFFF' : selectedColor;
        ctx.lineWidth = brushSize * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(prevPt.x * scale, prevPt.y * scale);
        ctx.lineTo(pt.x * scale, pt.y * scale);
        ctx.stroke();
      }
    }
  };

  // Pointer Up (Finalize & Broadcast Stroke)
  const handlePointerUp = () => {
    if (!isDrawer || !isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (currentStrokePoints.current.length > 0) {
      const strokeAction: StrokeData = {
        id: 'stroke_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        type: 'stroke',
        color: activeTool === 'eraser' ? '#FFFFFF' : selectedColor,
        size: brushSize,
        points: [...currentStrokePoints.current],
      };
      sendCanvasAction(strokeAction);
      currentStrokePoints.current = [];
    }
  };

  const handleUndo = () => {
    if (!isDrawer || drawingHistory.length === 0) return;
    // Remove last stroke and notify via full history or redraw
    // In our event model, we can slice history
  };

  const isGuesser = !isDrawer && gameState?.status === 'drawing';
  const hasGuessed = gameState?.players.find(p => p.id === gameState.drawerId)?.hasGuessed;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Top Clue & Turn Status Bar */}
      <div className="bg-slate-50 dark:bg-slate-850 px-3 sm:px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 z-10">
        {/* Left: Back button & Turn / Word Info */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={leaveRoom}
            className="px-2 py-1 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 border border-slate-300 dark:border-slate-700 cursor-pointer shrink-0 transition-all hover:scale-102"
            title="Leave room and return to Lobby"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {gameState?.status === 'drawing' ? (
            isDrawer ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                  <Paintbrush className="w-3.5 h-3.5" />
                  Your turn to draw!
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-medium text-slate-500">Word:</span>
                  <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-700">
                    {gameState.word}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{gameState.drawerName}</span>
                  <span>is drawing:</span>
                </div>
                <div className="font-mono text-base sm:text-lg font-black tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800 select-none">
                  {gameState.word}
                </div>
                {gameState.hint && (
                  <div className="hidden sm:flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                    <HelpCircle className="w-3 h-3" />
                    <span>Hint: {gameState.hint}</span>
                  </div>
                )}
              </div>
            )
          ) : gameState?.status === 'selecting_word' ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400">
              <Clock className="w-4 h-4 animate-spin text-purple-500" />
              <span>{gameState.drawerName} is picking a secret word...</span>
            </div>
          ) : gameState?.status === 'round_end' ? (
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>Round ended! Word was: &quot;{gameState.roundSummary?.word}&quot;</span>
            </div>
          ) : (
            <div className="text-xs font-semibold text-slate-500">
              Waiting for game to start...
            </div>
          )}
        </div>

        {/* Right: Timer & Round Counter */}
        <div className="flex items-center gap-2 sm:gap-3">
          {gameState && (
            <div className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              Round {gameState.currentRound}/{gameState.totalRounds}
            </div>
          )}

          {gameState && gameState.status === 'drawing' && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold border transition-all ${
                gameState.timeLeft <= 10
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 animate-pulse'
                  : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{gameState.timeLeft}s</span>
            </div>
          )}
        </div>
      </div>

      {/* Canvas Viewport Area */}
      <div
        ref={containerRef}
        className="flex-1 relative flex items-center justify-center p-2 bg-slate-100 dark:bg-slate-950 select-none overflow-hidden"
      >
        <div
          className="relative bg-white shadow-lg rounded-xl overflow-hidden cursor-crosshair border border-slate-300 dark:border-slate-700"
          style={{ width: canvasDimensions.width, height: canvasDimensions.height }}
        >
          <canvas
            ref={canvasRef}
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            className="w-full h-full touch-none block"
          />

          {/* Floating Emoji Reactions */}
          <ReactionOverlay reactions={reactions} />

          {/* Lobby Waiting Screen Overlay */}
          {gameState?.status === 'lobby' && (
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white z-20 overflow-y-auto">
              <div className="max-w-md w-full space-y-4">
                {/* Header Badge & Game Mode */}
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Multiplayer Room</span>
                  </div>
                  {gameState.settings?.gameMode && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold">
                      <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />
                      <span className="capitalize">{gameState.settings.gameMode.replace(/_/g, ' ')}</span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl font-extrabold text-white tracking-tight">
                    {gameState.roomName || 'Custom Game Room'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    {gameState.settings.isPrivate ? (
                      <span className="inline-flex items-center gap-1 text-amber-300 font-medium">
                        <LockIcon className="w-3 h-3" /> Private Room (Room code required to join)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-300 font-medium">
                        <Globe className="w-3 h-3" /> Public Room (Visible in public lobbies)
                      </span>
                    )}
                  </p>
                </div>

                {/* Room Code Card */}
                <div className="bg-white/10 border border-white/15 rounded-2xl p-3.5 backdrop-blur-sm flex items-center justify-between gap-3">
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Room Code
                    </span>
                    <span className="text-xl sm:text-2xl font-black font-mono tracking-widest text-indigo-300">
                      {gameState.roomCode || (gameState.roomId.includes('_') ? gameState.roomId.split('_')[1].toUpperCase() : gameState.roomId)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const code = gameState.roomCode || (gameState.roomId.includes('_') ? gameState.roomId.split('_')[1].toUpperCase() : gameState.roomId);
                      navigator.clipboard?.writeText(code);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </button>
                </div>

                {/* Connected Players in Room */}
                <div className="bg-black/30 border border-white/10 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-semibold px-1">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      Connected Players
                    </span>
                    <span className="text-indigo-300 font-bold">
                      {gameState.players.filter(p => p.isConnected).length} / {gameState.settings.maxPlayers || 8}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {gameState.players.filter(p => p.isConnected).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 p-1.5 rounded-xl bg-white/5 border border-white/10 text-left min-w-0"
                      >
                        <div
                          className="w-7 h-7 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: `${p.color || '#6366F1'}40` }}
                        >
                          <AvatarRenderer avatar={p.avatar} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{p.username}</p>
                          <span className="text-[9px] text-emerald-400 font-medium block">
                            {p.isHost ? 'Host' : 'Ready'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Notice */}
                {gameState.players.filter(p => p.isConnected).length < 2 ? (
                  <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs text-center space-y-1">
                    <p className="font-bold flex items-center justify-center gap-1.5 text-amber-300">
                      <Clock className="w-3.5 h-3.5" /> Waiting for other players to join...
                    </p>
                    <p className="text-[11px] text-amber-200/80">
                      Share your room code or have friends join from the Lobby. Once another player joins, the host can start the match!
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs text-center">
                    <p className="font-bold text-emerald-300">Ready to play! The host can now click "Start Game" on the player panel.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Non-drawer lock watermark if not drawing */}
          {!isDrawer && gameState?.status === 'drawing' && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-black/40 backdrop-blur-sm text-white/80 rounded-md text-[10px] font-semibold flex items-center gap-1 pointer-events-none">
              <Eye className="w-3 h-3" />
              Spectating
            </div>
          )}
        </div>
      </div>

      {/* Drawing Toolbar (Only displayed for the active drawer) */}
      {isDrawer && gameState?.status === 'drawing' ? (
        <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2.5 z-10">
          {/* Tool Modes */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTool('brush')}
              title="Paintbrush"
              className={`p-2 rounded-lg text-xs font-medium transition-all ${
                activeTool === 'brush'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Paintbrush className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTool('fill')}
              title="Fill Bucket"
              className={`p-2 rounded-lg text-xs font-medium transition-all ${
                activeTool === 'fill'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <PaintBucket className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTool('eraser')}
              title="Eraser"
              className={`p-2 rounded-lg text-xs font-medium transition-all ${
                activeTool === 'eraser'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          {/* Color Palette */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setSelectedColor(c);
                  if (activeTool === 'eraser') setActiveTool('brush');
                }}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 transition-transform ${
                  selectedColor === c && activeTool !== 'eraser'
                    ? 'border-indigo-600 scale-110 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}

            {/* Custom Color Input */}
            <label
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-dashed border-slate-400 dark:border-slate-600 flex items-center justify-center cursor-pointer hover:border-indigo-500 relative overflow-hidden"
              title="Custom Color"
            >
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => {
                  setSelectedColor(e.target.value);
                  if (activeTool === 'eraser') setActiveTool('brush');
                }}
                className="opacity-0 absolute inset-0 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 font-bold">+</span>
            </label>
          </div>

          {/* Brush Sizes */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {BRUSH_SIZES.map((b) => (
              <button
                key={b.label}
                onClick={() => setBrushSize(b.size)}
                title={`Brush size ${b.label}`}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                  brushSize === b.size
                    ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <div
                  className={`rounded-full bg-current ${b.px}`}
                  style={{ width: b.size / 2 + 2, height: b.size / 2 + 2 }}
                />
              </button>
            ))}
          </div>

          {/* Actions: Clear */}
          <div className="flex items-center gap-1">
            <button
              onClick={clearCanvas}
              title="Clear Canvas"
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-900/60 px-4 py-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            Type your guesses into the chat box to score points!
          </span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">Faster guesses = higher points</span>
        </div>
      )}
    </div>
  );
};
