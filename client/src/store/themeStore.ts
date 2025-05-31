// src/store/themeStore.ts
import { create } from 'zustand';

interface ThemeState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: (() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') {
      return 'dark';
    }
    return 'light';
  })(),
  setTheme: (theme) => {
    set({ theme });
    localStorage.setItem('theme', theme);
    const html = window.document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  },
  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      const html = window.document.documentElement;
      if (newTheme === 'dark') {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
      return { theme: newTheme };
    });
  },
}));