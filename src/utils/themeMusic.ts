// Web Audio API High-Performance Symphonic Rock / Rockhestra Audio Engine
// Theme Song: "Battle Hymn of the Republic - Rockhestra Version" (Inspired by XunQz-Rockhestra)

export interface ThemeMusicState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number; // 0.0 to 1.0
  title: string;
  artist: string;
}

type MusicListener = (state: ThemeMusicState) => void;

class ThemeMusicManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private isPlaying = false;
  private isMuted = false;
  private volume = 0.6;
  private listeners: Set<MusicListener> = new Set();
  private timerId: number | null = null;
  private nextNoteTime = 0;
  private currentStep = 0;
  public readonly title = "Battle Hymn of the Republic (Rockhestra)";
  public readonly artist = "XunQz-Rockhestra";
  private tempo = 138; // BPM

  // Pre-rendered sample buffers for 0ms latency and 0 CPU garbage collection
  private kickBuffer: AudioBuffer | null = null;
  private snareBuffer: AudioBuffer | null = null;
  private hihatBuffer: AudioBuffer | null = null;
  private crashBuffer: AudioBuffer | null = null;

  // Notes frequencies (Hz)
  private noteFreqs: Record<string, number> = {
    'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
    'C6': 1046.50
  };

  // Melody for "Battle Hymn of the Republic" (Glory Glory Hallelujah)
  // [note, duration in 16th steps]
  private leadMelody: Array<[string | null, number]> = [
    // Fanfare / Chorus: "Glory, Glory, Hallelujah!"
    ['G4', 3], ['G4', 1], ['G4', 3], ['E4', 1], ['G4', 4], ['C5', 4],
    ['E5', 3], ['E5', 1], ['E5', 2], ['D5', 2], ['C5', 4], ['G4', 4],
    ['A4', 3], ['A4', 1], ['A4', 2], ['B4', 2], ['C5', 4], ['A4', 4],
    ['G4', 3], ['E4', 1], ['G4', 2], ['E4', 2], ['D4', 6], [null, 2],

    ['G4', 3], ['G4', 1], ['G4', 3], ['E4', 1], ['G4', 4], ['C5', 4],
    ['E5', 3], ['E5', 1], ['E5', 2], ['D5', 2], ['C5', 4], ['G4', 4],
    ['A4', 3], ['A4', 1], ['A4', 2], ['B4', 2], ['C5', 4], ['A4', 4],
    ['G4', 3], ['E4', 1], ['D4', 2], ['E4', 2], ['C4', 6], [null, 2],

    // Verse: "Mine eyes have seen the glory of the coming of the Lord..."
    ['G4', 2], ['G4', 2], ['G4', 2], ['G4', 2], ['G4', 3], ['F4', 1], ['E4', 2], ['G4', 2],
    ['C5', 2], ['C5', 2], ['C5', 2], ['D5', 2], ['E5', 4], ['C5', 4],
    ['A4', 2], ['A4', 2], ['A4', 2], ['B4', 2], ['C5', 4], ['A4', 4],
    ['G4', 3], ['E4', 1], ['G4', 2], ['E4', 2], ['D4', 6], [null, 2],

    // Climax Riff
    ['G4', 2], ['G4', 2], ['G4', 2], ['G4', 2], ['G4', 3], ['F4', 1], ['E4', 2], ['G4', 2],
    ['C5', 2], ['C5', 2], ['C5', 2], ['D5', 2], ['E5', 4], ['C5', 4],
    ['A4', 3], ['A4', 1], ['A4', 2], ['B4', 2], ['C5', 3], ['D5', 1], ['E5', 2], ['F5', 2],
    ['G5', 4], ['E5', 2], ['D5', 2], ['C5', 6], [null, 2]
  ];

  // Chords progression for rock rhythm guitar & heavy bass (chords per bar)
  private chordProgression: string[] = [
    'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C',
    'F', 'F', 'F', 'F', 'C', 'C', 'G', 'G',
    'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C',
    'F', 'F', 'F', 'F', 'C', 'G', 'C', 'C',
    'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C',
    'F', 'F', 'F', 'F', 'C', 'C', 'G', 'G',
    'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C',
    'F', 'F', 'F', 'F', 'C', 'G', 'C', 'C'
  ];

  constructor() {
    try {
      const savedMute = localStorage.getItem('gw_music_muted');
      if (savedMute !== null) this.isMuted = savedMute === 'true';
      const savedVol = localStorage.getItem('gw_music_volume');
      if (savedVol !== null) this.volume = parseFloat(savedVol) || 0.6;
    } catch {
      // ignore
    }
  }

  private initAudio() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Studio Mastering Bus: Gain -> Compressor -> Destination
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-16, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.2, this.ctx.currentTime);

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);

      // Pre-synthesize clean drum samples into memory buffers
      this.buildDrumBuffers();
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private buildDrumBuffers() {
    if (!this.ctx) return;
    const sr = this.ctx.sampleRate;

    // 1. Kick Buffer (Punchy 90ms punch)
    const kickLen = Math.floor(sr * 0.12);
    this.kickBuffer = this.ctx.createBuffer(1, kickLen, sr);
    const kickData = this.kickBuffer.getChannelData(0);
    for (let i = 0; i < kickLen; i++) {
      const t = i / sr;
      const freq = 130 * Math.exp(-t * 32) + 40;
      const env = Math.exp(-t * 22);
      kickData[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.9;
    }

    // 2. Snare Buffer (Rock snap + noise body)
    const snareLen = Math.floor(sr * 0.15);
    this.snareBuffer = this.ctx.createBuffer(1, snareLen, sr);
    const snareData = this.snareBuffer.getChannelData(0);
    for (let i = 0; i < snareLen; i++) {
      const t = i / sr;
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 26);
      const tone = Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 30);
      snareData[i] = (noise * 0.7 + tone * 0.3) * 0.75;
    }

    // 3. Hi-Hat Buffer (Crisp metallic click)
    const hhLen = Math.floor(sr * 0.05);
    this.hihatBuffer = this.ctx.createBuffer(1, hhLen, sr);
    const hhData = this.hihatBuffer.getChannelData(0);
    for (let i = 0; i < hhLen; i++) {
      const t = i / sr;
      hhData[i] = (Math.random() * 2 - 1) * Math.exp(-t * 70) * 0.28;
    }

    // 4. Crash Buffer (Open cymbal shimmer)
    const crashLen = Math.floor(sr * 0.35);
    this.crashBuffer = this.ctx.createBuffer(1, crashLen, sr);
    const crashData = this.crashBuffer.getChannelData(0);
    for (let i = 0; i < crashLen; i++) {
      const t = i / sr;
      crashData[i] = (Math.random() * 2 - 1) * Math.exp(-t * 9) * 0.35;
    }
  }

  public subscribe(listener: MusicListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((l) => {
      try {
        l(state);
      } catch (err) {
        console.warn('Listener notification note:', err);
      }
    });
  }

  public getState(): ThemeMusicState {
    return {
      isPlaying: this.isPlaying,
      isMuted: this.isMuted,
      volume: this.volume,
      title: this.title,
      artist: this.artist,
    };
  }

  public async start(): Promise<void> {
    try {
      this.initAudio();
      if (!this.ctx) return;

      if (this.isPlaying) return;

      this.isPlaying = true;
      this.nextNoteTime = this.ctx.currentTime + 0.05;
      this.currentStep = 0;

      this.scheduleLoop();
      this.notify();
    } catch (e) {
      console.warn('Theme music start note:', e);
    }
  }

  public pause(): void {
    this.isPlaying = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.notify();
  }

  public toggle(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.start();
    }
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('gw_music_volume', String(this.volume));
    } catch {
      // ignore
    }
    if (this.masterGain && this.ctx) {
      if (!this.isMuted) {
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      }
    }
    this.notify();
  }

  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('gw_music_muted', String(this.isMuted));
    } catch {
      // ignore
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    this.notify();
  }

  // --- Smooth Playback Generators ---

  private playBuffer(buf: AudioBuffer | null, time: number, gainVal = 1) {
    if (!this.ctx || !this.masterGain || !buf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    if (gainVal !== 1) {
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(gainVal, time);
      src.connect(g);
      g.connect(this.masterGain);
    } else {
      src.connect(this.masterGain);
    }

    src.start(time);
  }

  private playGuitarChord(chordName: string, time: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;

    let rootFreq = 130.81; // C3
    if (chordName === 'F') rootFreq = 174.61;
    if (chordName === 'G') rootFreq = 196.00;
    if (chordName === 'Am') rootFreq = 220.00;

    const freqs = [rootFreq, rootFreq * 1.4983, rootFreq * 2];

    freqs.forEach((f) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, time);

      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(time);
      osc.stop(time + duration + 0.01);
    });

    // Sub bass
    const bass = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bass.type = 'triangle';
    bass.frequency.setValueAtTime(rootFreq / 2, time);

    bassGain.gain.setValueAtTime(0.18, time);
    bassGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    bass.connect(bassGain);
    bassGain.connect(this.masterGain);

    bass.start(time);
    bass.stop(time + duration + 0.01);
  }

  private playLeadNote(note: string, time: number, duration: number) {
    if (!this.ctx || !this.masterGain || !this.noteFreqs[note]) return;
    const freq = this.noteFreqs[note];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    // Warm filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, time);

    gain.gain.setValueAtTime(0.01, time);
    gain.gain.linearRampToValueAtTime(0.22, time + 0.02);
    gain.gain.setValueAtTime(0.18, time + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  // --- Main Music Sequencer Loop (Drift-Resistant & Glitch-Free) ---
  private scheduleLoop() {
    if (!this.isPlaying || !this.ctx) return;

    const secondsPer16th = (60 / this.tempo) / 4;
    const lookahead = 0.12;

    // Reset clock if browser tab slept or lagged behind
    if (this.nextNoteTime < this.ctx.currentTime) {
      this.nextNoteTime = this.ctx.currentTime + 0.02;
    }

    while (this.nextNoteTime < this.ctx.currentTime + lookahead) {
      const stepInMeasure = this.currentStep % 16;
      const measureIndex = Math.floor(this.currentStep / 16) % this.chordProgression.length;
      const currentChord = this.chordProgression[measureIndex];

      // 1. Drums (Pre-buffered instant triggers)
      if (stepInMeasure === 0 || stepInMeasure === 8) {
        this.playBuffer(this.kickBuffer, this.nextNoteTime, 0.85);
      } else if (stepInMeasure === 6 || stepInMeasure === 14) {
        this.playBuffer(this.kickBuffer, this.nextNoteTime, 0.6);
      }

      if (stepInMeasure === 4 || stepInMeasure === 12) {
        this.playBuffer(this.snareBuffer, this.nextNoteTime, 0.75);
      }

      if (stepInMeasure % 2 === 0) {
        if (stepInMeasure === 14) {
          this.playBuffer(this.crashBuffer, this.nextNoteTime, 0.4);
        } else {
          this.playBuffer(this.hihatBuffer, this.nextNoteTime, 0.3);
        }
      }

      // 2. Rhythm Guitar & Bass Chords
      if (stepInMeasure % 2 === 0) {
        const chordDur = stepInMeasure % 4 === 0 ? secondsPer16th * 1.8 : secondsPer16th * 0.9;
        this.playGuitarChord(currentChord, this.nextNoteTime, chordDur);
      }

      // 3. Lead Guitar Melody
      let melodyAcc = 0;
      for (let i = 0; i < this.leadMelody.length; i++) {
        const [note, len] = this.leadMelody[i];
        if (this.currentStep % 128 === melodyAcc && note) {
          this.playLeadNote(note, this.nextNoteTime, len * secondsPer16th * 0.92);
          break;
        }
        melodyAcc += len;
      }

      this.nextNoteTime += secondsPer16th;
      this.currentStep++;
    }

    this.timerId = window.setTimeout(() => this.scheduleLoop(), 30);
  }
}

export const themeMusic = new ThemeMusicManager();
