import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type DisplayMode = 'fullscreen' | 'halfscreen';
export type HalfScreenPosition = 'left' | 'center' | 'right';

export interface DisplayModeContextType {
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
  toggleDisplayMode: () => void;
  halfScreenPosition: HalfScreenPosition;
  setHalfScreenPosition: (pos: HalfScreenPosition) => void;
  isBrowserFullscreen: boolean;
  toggleBrowserFullscreen: () => void;
}

const DisplayModeContext = createContext<DisplayModeContextType>({
  displayMode: 'fullscreen',
  setDisplayMode: () => {},
  toggleDisplayMode: () => {},
  halfScreenPosition: 'left',
  setHalfScreenPosition: () => {},
  isBrowserFullscreen: false,
  toggleBrowserFullscreen: () => {}
});

export const useDisplayMode = () => useContext(DisplayModeContext);

const STORAGE_KEY_MODE = 'xrd_display_mode_v2';
const STORAGE_KEY_POS = 'xrd_halfscreen_pos_v2';

export const DisplayModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [displayMode, setDisplayModeState] = useState<DisplayMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MODE);
      return saved === 'halfscreen' ? 'halfscreen' : 'fullscreen';
    } catch {
      return 'fullscreen';
    }
  });

  const [halfScreenPosition, setHalfScreenPositionState] = useState<HalfScreenPosition>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_POS);
      if (saved === 'left' || saved === 'center' || saved === 'right') return saved;
      return 'left';
    } catch {
      return 'left';
    }
  });

  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState<boolean>(() => {
    return typeof document !== 'undefined' && Boolean(document.fullscreenElement);
  });

  const setDisplayMode = useCallback((mode: DisplayMode) => {
    setDisplayModeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY_MODE, mode);
    } catch {
      // Storage unavailable
    }
  }, []);

  const setHalfScreenPosition = useCallback((pos: HalfScreenPosition) => {
    setHalfScreenPositionState(pos);
    try {
      localStorage.setItem(STORAGE_KEY_POS, pos);
    } catch {
      // Storage unavailable
    }
  }, []);

  const toggleDisplayMode = useCallback(() => {
    setDisplayModeState(prev => {
      const next = prev === 'fullscreen' ? 'halfscreen' : 'fullscreen';
      try {
        localStorage.setItem(STORAGE_KEY_MODE, next);
      } catch {
        // Storage unavailable
      }
      return next;
    });
  }, []);

  const toggleBrowserFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, []);

  // Listen to browser fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsBrowserFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Keyboard shortcut listener (Alt + F or Alt + Shift + F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in input or textarea
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if ((e.altKey && (e.key === 'f' || e.key === 'F')) || (e.altKey && e.key === 'd')) {
        e.preventDefault();
        toggleDisplayMode();
      } else if (!isInput && e.key === 'F' && e.shiftKey) {
        e.preventDefault();
        toggleBrowserFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleDisplayMode, toggleBrowserFullscreen]);

  return (
    <DisplayModeContext.Provider
      value={{
        displayMode,
        setDisplayMode,
        toggleDisplayMode,
        halfScreenPosition,
        setHalfScreenPosition,
        isBrowserFullscreen,
        toggleBrowserFullscreen
      }}
    >
      {children}
    </DisplayModeContext.Provider>
  );
};
