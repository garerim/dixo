// =============================================================================
// Sound Manager — Low-level audio engine (no React dependency)
// =============================================================================

export type SoundName =
  | "dice-roll"
  | "round-win"
  | "round-win2"
  | "round-win3"
  | "game-victory"
  | "game-defeat"
  | "player-join"
  | "player-leave"
  | "message";

const SOUND_MAP: Record<SoundName, string> = {
  "dice-roll": "/sounds/dice-roll.mp3",
  "round-win": "/sounds/round-win.mp3",
  "round-win2": "/sounds/round-win2.wav",
  "round-win3": "/sounds/round-win3.wav",
  "game-victory": "/sounds/game-victory.mp3",
  "game-defeat": "/sounds/game-defeat.mp3",
  "player-join": "/sounds/player-join.mp3",
  "player-leave": "/sounds/player-leave.mp3",
  message: "/sounds/message.mp3",
};

const MUSIC_PATH = "/sounds/bg-heist.mp3";

export class SoundManager {
  private static instance: SoundManager | null = null;
  private audioCache = new Map<string, HTMLAudioElement>();
  private musicElement: HTMLAudioElement | null = null;
  private sfxVolume = 0.7;
  private musicVolume = 0.3;
  private muted = false;
  private musicEnabled = false;
  private unlocked = false;

  private constructor() {
    // Unlock audio on first user interaction
    if (typeof document !== "undefined") {
      const unlock = () => {
        this.unlocked = true;
        document.removeEventListener("click", unlock);
        document.removeEventListener("keydown", unlock);
        document.removeEventListener("touchstart", unlock);
      };
      document.addEventListener("click", unlock, { once: false });
      document.addEventListener("keydown", unlock, { once: false });
      document.addEventListener("touchstart", unlock, { once: false });
    }
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  // ── Play a sound effect ──
  play(name: SoundName): void {
    if (this.muted) return;

    const path = SOUND_MAP[name];
    if (!path) return;

    try {
      // Clone from cache or create new
      let source = this.audioCache.get(path);
      if (!source) {
        source = new Audio(path);
        this.audioCache.set(path, source);
      }

      const audio = source.cloneNode(true) as HTMLAudioElement;
      audio.volume = this.sfxVolume;
      audio.play().catch(() => {
        // Autoplay blocked — ignore silently
      });
    } catch {
      // Audio not supported
    }
  }

  // ── Background music ──
  playMusic(): void {
    if (!this.musicEnabled) return;

    if (!this.musicElement) {
      this.musicElement = new Audio(MUSIC_PATH);
      this.musicElement.loop = true;
    }

    this.musicElement.volume = this.muted ? 0 : this.musicVolume;
    this.musicElement.play().catch(() => {});
  }

  stopMusic(): void {
    if (this.musicElement) {
      this.musicElement.pause();
      this.musicElement.currentTime = 0;
    }
  }

  // ── Volume setters ──
  setSfxVolume(vol: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  setMusicVolume(vol: number): void {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicElement) {
      this.musicElement.volume = this.muted ? 0 : this.musicVolume;
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.musicElement) {
      this.musicElement.volume = muted ? 0 : this.musicVolume;
    }
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (enabled) {
      this.playMusic();
    } else {
      this.stopMusic();
    }
  }

  // ── Getters ──
  getSfxVolume(): number {
    return this.sfxVolume;
  }
  getMusicVolume(): number {
    return this.musicVolume;
  }
  isMuted(): boolean {
    return this.muted;
  }
  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }
}
