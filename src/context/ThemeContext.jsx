import React, { createContext, useContext, useEffect, useState } from 'react';

// Theme options: 'dark' | 'light' | 'system'
const ThemeContext = createContext(null);

const STORAGE_KEY = 'medicare-ai-theme';

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(preference) {
  const resolved = preference === 'system' ? getSystemTheme() : preference;
  const root = document.documentElement;
  root.classList.remove('dark', 'light');
  root.classList.add(resolved);
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'system';
  });

  // Resolved = actual applied theme (dark or light)
  const resolved = preference === 'system' ? getSystemTheme() : preference;

  useEffect(() => {
    applyTheme(preference);
    localStorage.setItem(STORAGE_KEY, preference);
  }, [preference]);

  // React to system theme changes when preference is 'system'
  useEffect(() => {
    if (preference !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preference]);

  return (
    <ThemeContext.Provider value={{ preference, setPreference, resolved }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
