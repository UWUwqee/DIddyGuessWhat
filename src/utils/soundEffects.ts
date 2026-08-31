// Web Audio API procedural sound synthesizer
class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Read mute preference
    this.isMuted = localStorage.getItem('guess_what_muted') === 'true';
  }

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('guess_what_muted', String(this.isMuted));
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    localStorage.setItem('guess_what_muted', String(muted));
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playCorrect(): void {
    this.playCorrectGuess();
  }

  public playWrong(): void {
    this.playWrongGuess();
  }

  public playError(): void {
    this.playWrongGuess();
  }

  public playButton(): void {
    this.playCardPlay();
  }

  public playStartGame(): void {
    this.playTurnStart();
  }

  public playCountdownTick(): void {
    this.playTick();
  }

  public playPop(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // ignore
    }
  }

  // Correct Guess Joyful Major Arpeggio
  public playCorrectGuess(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + index * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  // Timer Tick (Subtle woodblock-like click)
  public playTick(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, start);
    osc.frequency.exponentialRampToValueAtTime(200, start + 0.04);

    gain.gain.setValueAtTime(0.08, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + 0.05);
  }

  // Urgent Timer Tick (Last 10 seconds)
  public playUrgentTick(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1100, start);
    osc.frequency.exponentialRampToValueAtTime(450, start + 0.06);

    gain.gain.setValueAtTime(0.12, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + 0.07);
  }

  // Round / Turn Start Fanfare
  public playTurnStart(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [440, 554.37, 659.25]; // A4, C#5, E5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + idx * 0.1;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  public playRoundStart(): void {
    this.playTurnStart();
  }

  // Word Reveal Ping
  public playWordReveal(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, start);
    osc.frequency.exponentialRampToValueAtTime(900, start + 0.2);

    gain.gain.setValueAtTime(0.12, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + 0.3);
  }

  // Game Over Sad descending tone
  public playGameOver(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [392.0, 369.99, 349.23, 311.13]; // G4, F#4, F4, D#4
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + idx * 0.15;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.1, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.4);
    });
  }

  // Close Guess Hint Whoosh
  public playCloseGuess(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, start);
    osc.frequency.exponentialRampToValueAtTime(750, start + 0.15);

    gain.gain.setValueAtTime(0.1, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + 0.2);
  }

  // Wrong Guess / Penalty Buzzer
  public playWrongGuess(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, start);
    osc.frequency.linearRampToValueAtTime(110, start + 0.2);

    gain.gain.setValueAtTime(0.12, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + 0.24);
  }

  // Card Draw Swoosh
  public playCardDraw(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, start);
    osc.frequency.exponentialRampToValueAtTime(520, start + 0.08);

    gain.gain.setValueAtTime(0.1, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + 0.1);
  }

  // Card Play Snap
  public playCardPlay(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, start);
    osc.frequency.exponentialRampToValueAtTime(320, start + 0.07);

    gain.gain.setValueAtTime(0.15, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + 0.09);
  }

  // UNO Shout Triumph
  public playUnoCall(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [587.33, 880.0, 1174.66]; // D5, A5, D6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + idx * 0.06;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.4);
    });
  }

  // Wild Magic Ripple
  public playWildPlay(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + idx * 0.05;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.1, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  // Reverse Spiral Sound
  public playReverse(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, start);
    osc.frequency.linearRampToValueAtTime(700, start + 0.1);
    osc.frequency.linearRampToValueAtTime(350, start + 0.22);

    gain.gain.setValueAtTime(0.12, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + 0.26);
  }

  // Victory / Game Over Fanfare
  public playVictory(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const chords = [
      { notes: [523.25, 659.25, 783.99], time: 0 }, // C
      { notes: [587.33, 739.99, 880.0], time: 0.2 }, // D
      { notes: [659.25, 830.61, 987.77], time: 0.4 }, // E
      { notes: [1046.5, 1318.51, 1567.98], time: 0.65 }, // High C
    ];

    chords.forEach((chord) => {
      chord.notes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + chord.time;
        const dur = chord.time > 0.5 ? 0.8 : 0.25;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + dur + 0.05);
      });
    });
  }

  // Neon Reflex / Rhythm Beat Hit (Perfect / Good / Miss)
  public playNeonHit(rating: 'perfect' | 'great' | 'good' | 'miss'): void {
    const ctx = this.getContext();
    if (!ctx) return;

    if (rating === 'miss') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, start);
      osc.frequency.linearRampToValueAtTime(80, start + 0.15);
      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.16);
      return;
    }

    const freqMap = {
      good: [587.33, 880],
      great: [659.25, 987.77],
      perfect: [783.99, 1174.66, 1567.98],
    };

    const freqs = freqMap[rating];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + i * 0.03;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.14, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.22);
    });
  }

  // Neon Reflex Bass Pulse
  public playNeonBeat(trackType: number = 0): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime;

    const baseFreq = trackType === 0 ? 120 : trackType === 1 ? 160 : 200;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, start);
    osc.frequency.exponentialRampToValueAtTime(45, start + 0.09);

    gain.gain.setValueAtTime(0.2, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + 0.11);
  }

  // Audio Mystery Sound Effect Synthesizer Player
  public playMysterySound(soundId: string): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    switch (soundId) {
      case 'thunder': {
        // Deep rumble noise burst
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, now);
        filter.frequency.exponentialRampToValueAtTime(80, now + 1.8);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.9);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + 2);
        break;
      }
      case 'laser': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(2400, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.36);
        break;
      }
      case 'car_engine': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.linearRampToValueAtTime(360, now + 0.6);
        osc.frequency.linearRampToValueAtTime(600, now + 1.2);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.35);
        break;
      }
      case 'ufo': {
        const osc = ctx.createOscillator();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        const gain = ctx.createGain();

        lfo.frequency.setValueAtTime(8, now);
        lfoGain.gain.setValueAtTime(150, now);
        lfo.connect(osc.frequency);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, now);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        lfo.start(now);
        osc.start(now);
        lfo.stop(now + 1.6);
        osc.stop(now + 1.65);
        break;
      }
      case 'cat_meow': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(750, now + 0.25);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.6);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.7);
        break;
      }
      case 'microwave_ding': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1760, now);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.25);
        break;
      }
      case 'retro_jump': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }
      case 'telephone': {
        [0, 0.4].forEach((offset) => {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + offset;
          osc1.type = 'sine';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(440, start);
          osc2.frequency.setValueAtTime(480, start);
          gain.gain.setValueAtTime(0.1, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          osc1.start(start);
          osc2.start(start);
          osc1.stop(start + 0.3);
          osc2.stop(start + 0.3);
        });
        break;
      }
      case 'rocket_launch': {
        const bufferSize = ctx.sampleRate * 2.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(120, now);
        filter.frequency.linearRampToValueAtTime(900, now + 2.2);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.28, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + 2.5);
        break;
      }
      case 'clock_tick': {
        [0, 0.25, 0.5, 0.75].forEach((offset, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + offset;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(idx % 2 === 0 ? 900 : 700, start);
          gain.gain.setValueAtTime(0.12, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.05);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.06);
        });
        break;
      }
      case 'heartbeat': {
        [0, 0.18, 0.6, 0.78].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + offset;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(70, start);
          osc.frequency.exponentialRampToValueAtTime(35, start + 0.1);
          gain.gain.setValueAtTime(0.25, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.13);
        });
        break;
      }
      default: {
        // Fallback tone chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.4);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.46);
        break;
      }
    }
  }
}

export const soundManager = new SoundEffectsManager();
