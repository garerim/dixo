"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { SoundManager, type SoundName } from "@/lib/sounds/sound-manager";

// =============================================================================
// Types
// =============================================================================

interface SoundPreferences {
  sfxVolume: number;
  musicVolume: number;
  isMuted: boolean;
  musicEnabled: boolean;
}

interface SoundContextType {
  playSound: (name: SoundName) => void;
  sfxVolume: number;
  musicVolume: number;
  isMuted: boolean;
  musicEnabled: boolean;
  setSfxVolume: (vol: number) => void;
  setMusicVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleMusic: () => void;
}

const STORAGE_KEY = "dixo-sound-preferences";

const DEFAULT_PREFS: SoundPreferences = {
  sfxVolume: 0.7,
  musicVolume: 0.3,
  isMuted: false,
  musicEnabled: false,
};

// =============================================================================
// Context
// =============================================================================

const SoundContext = createContext<SoundContextType>({
  playSound: () => {},
  sfxVolume: DEFAULT_PREFS.sfxVolume,
  musicVolume: DEFAULT_PREFS.musicVolume,
  isMuted: DEFAULT_PREFS.isMuted,
  musicEnabled: DEFAULT_PREFS.musicEnabled,
  setSfxVolume: () => {},
  setMusicVolume: () => {},
  toggleMute: () => {},
  toggleMusic: () => {},
});

// =============================================================================
// Provider
// =============================================================================

function loadPrefs(): SoundPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<SoundPreferences>;
      return { ...DEFAULT_PREFS, ...parsed };
    }
  } catch {
    // Invalid localStorage data
  }
  return DEFAULT_PREFS;
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<SoundPreferences>(loadPrefs);
  const managerRef = useRef<SoundManager | null>(null);

  // Sync manager with preferences on mount
  useEffect(() => {
    managerRef.current = SoundManager.getInstance();
    managerRef.current.setSfxVolume(prefs.sfxVolume);
    managerRef.current.setMusicVolume(prefs.musicVolume);
    managerRef.current.setMuted(prefs.isMuted);
    managerRef.current.setMusicEnabled(prefs.musicEnabled);
    // Only run once on mount — prefs are synced via persistPrefs after that
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist prefs to localStorage
  const persistPrefs = useCallback((newPrefs: SoundPreferences) => {
    setPrefs(newPrefs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
    } catch {
      // Storage full or unavailable
    }
  }, []);

  const playSound = useCallback((name: SoundName) => {
    managerRef.current?.play(name);
  }, []);

  const setSfxVolume = useCallback(
    (vol: number) => {
      managerRef.current?.setSfxVolume(vol);
      persistPrefs({ ...prefs, sfxVolume: vol });
    },
    [prefs, persistPrefs],
  );

  const setMusicVolume = useCallback(
    (vol: number) => {
      managerRef.current?.setMusicVolume(vol);
      persistPrefs({ ...prefs, musicVolume: vol });
    },
    [prefs, persistPrefs],
  );

  const toggleMute = useCallback(() => {
    const newMuted = !prefs.isMuted;
    managerRef.current?.setMuted(newMuted);
    persistPrefs({ ...prefs, isMuted: newMuted });
  }, [prefs, persistPrefs]);

  const toggleMusic = useCallback(() => {
    const newEnabled = !prefs.musicEnabled;
    managerRef.current?.setMusicEnabled(newEnabled);
    persistPrefs({ ...prefs, musicEnabled: newEnabled });
  }, [prefs, persistPrefs]);

  return (
    <SoundContext.Provider
      value={{
        playSound,
        sfxVolume: prefs.sfxVolume,
        musicVolume: prefs.musicVolume,
        isMuted: prefs.isMuted,
        musicEnabled: prefs.musicEnabled,
        setSfxVolume,
        setMusicVolume,
        toggleMute,
        toggleMusic,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  return useContext(SoundContext);
}
