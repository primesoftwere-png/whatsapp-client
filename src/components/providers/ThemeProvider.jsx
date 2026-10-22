'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/stores/useUIStore';

export default function ThemeProvider({ children }) {
  const { theme, setTheme } = useUIStore();

  useEffect(() => {
    const savedTheme = localStorage.getItem('nexchat-theme') || 'system';
    setTheme(savedTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const currentTheme = localStorage.getItem('nexchat-theme') || 'system';
      if (currentTheme === 'system') {
        setTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [setTheme]);

  return <>{children}</>;
}
