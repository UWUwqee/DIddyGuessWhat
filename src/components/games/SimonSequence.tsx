import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, Trophy, Music, RefreshCw, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../utils/soundEffects';

interface SimonPad {
  id: number;
  label: string;
  color: string;
  activeColor: string;
  freq: number;
}

const PADS: SimonPad[] = [
  { id: 0, label: 'Green', color: 'bg-emerald-500', activeColor: 'bg-emerald-300 ring-4 ring-white shadow-emerald-400', freq: 330 },
  { id: 1, label: 'Red', color: 'bg-rose-500', activeColor: 'bg-rose-300 ring-4 ring-white shadow-rose-400', freq: 440 },
  { id: 2, label: 'Yellow', color: 'bg-amber-400', activeColor: 'bg-amber-200 ring-4 ring-white shadow-amber-300', freq: 554 },
  { id: 3, label: 'Blue', color: 'bg-blue-500', activeColor: 'bg-blue-300 ring-4 ring-white shadow-blue-400', freq: 659 },
];

export const SimonSequence: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
  const { user, updateStats, winBetReward } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userStep, setUserStep] = useState(0);
  const [activePad, setActivePad] = useState<number | null>(null);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [round, setRound] = useState(0);

  const playTone = (freq: number) => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio not permitted or muted
    }
  };

  const playPadFeedback = (padId: number) => {
    setActivePad(padId);
    playTone(PADS[padId].freq);
    setTimeout(() => {
      setActivePad(null);
    }, 300);
  };

  const startNextRound = (currentSeq: number[]) => {
    setIsShowingSequence(true);
    setUserStep(0);
    const nextItem = Math.floor(Math.random() * 4);
    const newSeq = [...currentSeq, nextItem];
    setSequence(newSeq);
    setRound(newSeq.length);

    // Playback sequence
    newSeq.forEach((padId, index) => {
      setTimeout(() => {
        playPadFeedback(padId);
        if (index === newSeq.length - 1) {
          setTimeout(() => {
            setIsShowingSequence(false);
          }, 400);
        }
      }, (index + 1) * 550);
    });
  };

  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setRound(0);
    setSequence([]);
    setUserStep(0);
    soundManager.playCorrect();
    startNextRound([]);
  };

  const handlePadClick = (padId: number) => {
    if (!isPlaying || isShowingSequence || isGameOver) return;

    playPadFeedback(padId);

    if (padId === sequence[userStep]) {
      const nextStep = userStep + 1;
      if (nextStep === sequence.length) {
        soundManager.playCorrect();
        setTimeout(() => {
          startNextRound(sequence);
        }, 600);
      } else {
        setUserStep(nextStep);
      }
    } else {
      // Wrong pad
      soundManager.playWrong();
      endGame();
    }
  };

  const endGame = () => {
    setIsGameOver(true);
    setIsPlaying(false);

    const score = Math.max(0, (round - 1) * 20);
    const pointsEarned = Math.min(250, score + 20);
    const won = round >= 6;

    updateStats(
      {
        totalScore: pointsEarned,
        gamesPlayed: 1,
        wins: won ? 1 : 0,
        highestRoundScore: score,
      },
      won
    );

    if (won) {
      soundManager.playVictory();
      winBetReward('jade', '5000', 'Simon Sound Matrix');
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-2 sm:p-4 space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHub}
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Arcade</span>
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Music className="w-5 h-5 text-emerald-500" />
              <span>Simon Sound Matrix</span>
            </h2>
            <p className="text-[11px] text-slate-400">Audio-visual sequential memory challenge</p>
          </div>
        </div>

        {isPlaying && (
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Round</span>
            <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
              {round}
            </span>
          </div>
        )}
      </div>

      {/* Main Arena */}
      <div className="flex-1 min-h-[440px] flex items-center justify-center">
        {!isPlaying && !isGameOver && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 max-w-md w-full text-center space-y-6 shadow-xl">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg">
              <Music className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Simon Sound Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Watch the glowing color matrix and listen to the procedural acoustic tones, then repeat the exact sequence step by step!
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-left text-xs text-slate-600 dark:text-slate-300 space-y-1.5 border border-slate-200 dark:border-slate-700">
              <p className="font-bold flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" /> Instructions:
              </p>
              <p>• Memorize the flashing order of colors and tones.</p>
              <p>• Reach round 6+ to win and claim bonus Jade gems!</p>
            </div>

            <button
              onClick={startGame}
              className="w-full py-3.5 rounded-2xl font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Simon Matrix
            </button>
          </div>
        )}

        {isPlaying && (
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              {isShowingSequence ? '👀 Watch & Listen closely...' : '👉 Your Turn! Repeat the sequence!'}
            </div>

            {/* 4 Simon Pads Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-950 rounded-3xl shadow-inner aspect-square max-w-[320px] mx-auto">
              {PADS.map((pad) => {
                const isActive = activePad === pad.id;
                return (
                  <button
                    key={pad.id}
                    disabled={isShowingSequence}
                    onClick={() => handlePadClick(pad.id)}
                    className={`rounded-2xl transition-all cursor-pointer shadow-lg ${
                      isActive ? pad.activeColor : `${pad.color} opacity-85 hover:opacity-100`
                    } ${isShowingSequence ? 'cursor-not-allowed' : 'active:scale-95'}`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {isGameOver && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 mx-auto">
              <Trophy className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {round >= 6 ? 'Master of Memory!' : 'Sequence Broken!'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                You reached <span className="font-extrabold text-emerald-600">Round {round}</span>!
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={startGame}
                className="flex-1 py-3 rounded-2xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer"
              >
                Play Again
              </button>
              <button
                onClick={onBackToHub}
                className="flex-1 py-3 rounded-2xl font-bold text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                Back to Arcade
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
