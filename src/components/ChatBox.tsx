import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowUp,
  MessageSquare,
  Sparkles,
  Trophy,
  CheckCheck,
  Flame,
  Info,
  Users,
  Heart,
  ThumbsUp,
  Smile,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { AvatarRenderer } from './AvatarRenderer';
import { NgipName, NgipBadge } from './NgipBadge';
import { soundManager } from '../utils/soundEffects';

const QUICK_REACTIONS = ['❤️', '👍', '😂', '🔥', '👏', '🤯', '🎨', '🏆'];
const TAPBACK_EMOJIS = ['❤️', '👍', '👎', '😂', '‼️', '❓'];

export const ChatBox: React.FC = () => {
  const { messages, sendMessage, sendReaction, reactToMessage, gameState, isDrawer, leaveRoom } = useGame();
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [activeTapbackMsgId, setActiveTapbackMsgId] = useState<string | null>(null);
  const lastTapRef = useRef<{ [msgId: string]: number }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const myPlayer = gameState?.players.find((p) => p.id === user?.id);
  const hasGuessed = myPlayer?.hasGuessed ?? false;
  const isDrawingTurn = gameState?.status === 'drawing';

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when turn starts
  useEffect(() => {
    if (isDrawingTurn && !isDrawer && !hasGuessed) {
      inputRef.current?.focus();
    }
  }, [isDrawingTurn, isDrawer, hasGuessed]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  // Double-tap or long-press / double click handler
  const handleMessageTap = (msgId: string) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[msgId] || 0;
    if (now - lastTap < 350) {
      // Double tap detected! Toggle tapback popup or auto-heart
      soundManager.playPop();
      setActiveTapbackMsgId(prev => (prev === msgId ? null : msgId));
      lastTapRef.current[msgId] = 0;
    } else {
      lastTapRef.current[msgId] = now;
    }
  };

  const handleSelectTapback = (msgId: string, emoji: string) => {
    soundManager.playPop();
    reactToMessage(msgId, emoji);
    setActiveTapbackMsgId(null);
  };

  const getPlaceholder = () => {
    if (!gameState) return 'iMessage • Type a message...';
    if (gameState.status !== 'drawing') return 'Chat with room players...';
    if (isDrawer) return 'You are drawing! Chatting paused...';
    if (hasGuessed) return 'You guessed the word! Chat here...';
    return 'Type your guess or message...';
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F5F7] dark:bg-[#1C1C1E] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-lg overflow-hidden transition-colors">
      {/* iMessage Navigation Header */}
      <div className="px-3.5 py-2.5 bg-white/95 dark:bg-[#2C2C2E]/95 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-750 flex items-center justify-between gap-2 z-10 shrink-0">
        {/* Left: Back Button & Group Avatar */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={leaveRoom}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all hover:scale-105 shrink-0"
            title="Back to Lobby"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Lobby</span>
          </button>

          {/* Group Icon / Stack */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-500 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {gameState?.roomName || 'Guess & Draw Room'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {gameState ? `${gameState.players.length} players • #${gameState.roomCode}` : 'Live Room'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Message Counter Badge */}
        <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700/80 rounded-full text-[10px] font-semibold text-slate-600 dark:text-slate-300 shrink-0">
          {messages.length} {messages.length === 1 ? 'msg' : 'msgs'}
        </div>
      </div>

      {/* iMessage Chat Bubble Area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-500 mb-2">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-0.5">
              iMessage • Room Conversation
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs">
              Guesses and chats from players will appear here in real-time!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id || (user && msg.senderName === user.username);
            const timeString = new Date(msg.timestamp || Date.now()).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            // 1. Correct Guess Victory Banner
            if (msg.type === 'correct_guess') {
              return (
                <div key={msg.id} className="flex justify-center my-1.5 animate-scale-in">
                  <div className="w-full max-w-sm bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-emerald-500/15 dark:from-emerald-950/70 dark:via-teal-950/60 dark:to-emerald-950/70 border border-emerald-300 dark:border-emerald-700 rounded-2xl p-2.5 shadow-xs flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-white dark:bg-slate-800 border-2 border-emerald-400 shrink-0 shadow-xs flex items-center justify-center">
                      <AvatarRenderer avatar={msg.senderAvatar || '1'} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-emerald-800 dark:text-emerald-200">
                          {msg.senderName}
                        </span>
                        <span className="px-1.5 py-0.2 bg-emerald-500 text-white text-[9px] font-black rounded-md">
                          CORRECT!
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 truncate">
                        {msg.text.replace(/^[^\s]+\s+/, '')}
                      </p>
                    </div>
                    {msg.pointsAwarded && (
                      <div className="px-2 py-1 bg-emerald-500 text-white rounded-xl text-xs font-black shrink-0 shadow-xs">
                        +{msg.pointsAwarded}
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // 2. Close Guess Alert
            if (msg.type === 'close_guess') {
              return (
                <div key={msg.id} className="flex justify-center my-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700/80 rounded-full text-amber-800 dark:text-amber-200 text-xs font-bold shadow-xs">
                    <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    <span>{msg.text}</span>
                  </div>
                </div>
              );
            }

            // 3. System / Drawer Turn / Word Reveal Pill
            if (msg.type === 'drawer_turn' || msg.type === 'system' || msg.type === 'word_reveal') {
              return (
                <div key={msg.id} className="flex justify-center my-1">
                  <div className="px-3 py-1 bg-slate-200/80 dark:bg-slate-800/80 backdrop-blur-xs text-slate-600 dark:text-slate-300 text-[11px] font-medium rounded-full max-w-[90%] text-center shadow-2xs">
                    {msg.text}
                  </div>
                </div>
              );
            }

            // 4. Standard Player Chat / Guess (iMessage Style)
            const showTapback = activeTapbackMsgId === msg.id;
            const reactionsMap = (msg.reactions || {}) as Record<string, string[]>;
            const reactionEntries = Object.entries(reactionsMap).filter(
              ([_, uids]) => Array.isArray(uids) && uids.length > 0
            );

            return (
              <div
                key={msg.id}
                className={`relative flex items-end gap-2 group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Profile Picture Avatar */}
                <div
                  className="w-8 h-8 rounded-full overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs mb-1"
                  title={msg.senderName}
                >
                  <AvatarRenderer avatar={msg.senderAvatar || '1'} className="w-full h-full object-cover" />
                </div>

                {/* Message Content & Name */}
                <div className={`relative flex flex-col max-w-[78%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Sender Name above message */}
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1 mb-0.5">
                    <NgipName
                      name={isMe ? 'You' : msg.senderName}
                      isNgip={Boolean(msg.isNgip || (isMe && user?.isNgip))}
                      className="font-bold truncate max-w-[120px]"
                    />
                    {Boolean(msg.isNgip || (isMe && user?.isNgip)) && <NgipBadge size="xs" />}
                    <span className="text-[9px] text-slate-400 font-mono">
                      {timeString}
                    </span>
                  </div>

                  {/* iMessage Floating Tapback Bar (Visible when active or double-tapped) */}
                  {showTapback && (
                    <div
                      className={`absolute -top-10 z-30 flex items-center gap-1 p-1 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md rounded-full shadow-xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-90 duration-150 ${
                        isMe ? 'right-0' : 'left-0'
                      }`}
                    >
                      {TAPBACK_EMOJIS.map((emoji) => {
                        const hasReacted = (msg.reactions?.[emoji] || []).includes(user?.id || '');
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectTapback(msg.id, emoji);
                            }}
                            className={`p-1.5 rounded-full hover:scale-125 transition-transform text-sm cursor-pointer select-none ${
                              hasReacted ? 'bg-indigo-100 dark:bg-indigo-950/80 scale-110' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {emoji}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* iMessage Bubble (Supports Double Tap / Double Click) */}
                  <div
                    onClick={() => handleMessageTap(msg.id)}
                    onDoubleClick={() => {
                      soundManager.playPop();
                      setActiveTapbackMsgId(prev => (prev === msg.id ? null : msg.id));
                    }}
                    title="Double-tap or double-click to add Tapback reaction"
                    className={`relative px-3.5 py-2 text-[13px] leading-relaxed break-words shadow-xs select-text transition-all cursor-pointer select-none active:scale-[0.98] ${
                      isMe
                        ? 'bg-[#007AFF] text-white rounded-[18px] rounded-br-[4px]'
                        : 'bg-[#E9E9EB] dark:bg-[#2C2C2E] text-slate-900 dark:text-white rounded-[18px] rounded-bl-[4px]'
                    }`}
                  >
                    {msg.text}

                    {/* Reaction Badges Stacked on Bubble */}
                    {reactionEntries.length > 0 && (
                      <div
                        className={`absolute -bottom-2.5 flex items-center gap-0.5 px-1.5 py-0.5 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-slate-700 rounded-full shadow-md text-[11px] ${
                          isMe ? 'left-2' : 'right-2'
                        }`}
                      >
                        {reactionEntries.map(([emoji, uids]) => (
                          <span
                            key={emoji}
                            className="flex items-center gap-0.5 font-bold text-slate-700 dark:text-slate-200"
                            title={`${uids.length} reaction${uids.length > 1 ? 's' : ''}`}
                          >
                            <span>{emoji}</span>
                            {uids.length > 1 && (
                              <span className="text-[9px] text-slate-400">{uids.length}</span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* iMessage Delivered Tag for user's own messages */}
                  {isMe && (
                    <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-0.5 pr-1 opacity-80">
                      <span>Delivered</span>
                      <CheckCheck className="w-2.5 h-2.5 text-indigo-500" />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* iMessage Tapback Reactions Toolbar */}
      <div className="px-2.5 py-1.5 bg-white/80 dark:bg-[#2C2C2E]/80 backdrop-blur-md border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-1 overflow-x-auto shrink-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline ml-1">
          Tapback:
        </span>
        <div className="flex items-center gap-1 mx-auto sm:mx-0">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => sendReaction(emoji)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-xl text-base transition-transform active:scale-130 select-none cursor-pointer"
              title={`Send ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* iMessage Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="p-2.5 bg-white dark:bg-[#2C2C2E] border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2 shrink-0"
      >
        <div className="relative flex-1 flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isDrawer && isDrawingTurn}
            placeholder={getPlaceholder()}
            className="w-full pl-3.5 pr-10 py-2 text-xs bg-[#F2F2F7] dark:bg-[#1C1C1E] text-slate-900 dark:text-white rounded-full border border-slate-300/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#007AFF] disabled:opacity-50 disabled:cursor-not-allowed transition-all placeholder:text-slate-400"
          />
        </div>
        <button
          type="submit"
          disabled={!inputText.trim() || (isDrawer && isDrawingTurn)}
          className="w-8 h-8 rounded-full bg-[#007AFF] hover:bg-[#0062cc] disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all active:scale-95 shadow-sm shrink-0 cursor-pointer"
          title="Send"
        >
          <ArrowUp className="w-4 h-4 stroke-[2.5]" />
        </button>
      </form>
    </div>
  );
};

