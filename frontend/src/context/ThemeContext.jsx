import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = [
  {
    id: 'cosmic',
    name: 'কসমিক থ্রিডি (Cosmic 3D)',
    tag: 'ডিফল্ট / ইউনিক',
    description: 'ফিউচারিস্টিক কসমিক গ্লাস ও নিওন সাইবার প্যাটার্ন',
    previewColor: '#6366f1',
    bgPreview: '#090d16',
    isDark: true
  },
  {
    id: 'midnight',
    name: 'ডার্ক মিডনাইট (Midnight OLED)',
    tag: 'ডার্ক মোড',
    description: 'চোখের আরামদায়ক গভীর ডার্ক ও ব্লু অ্যাকসেন্ট',
    previewColor: '#3b82f6',
    bgPreview: '#0b0f19',
    isDark: true
  },
  {
    id: 'aurora',
    name: 'অরোরা নিওন (Neon Aurora)',
    tag: 'ভাইব্র্যান্ট',
    description: 'নর্দান লাইটসের সবুজ ও ভায়োলেট গ্রেডিয়েন্ট',
    previewColor: '#10b981',
    bgPreview: '#06131a',
    isDark: true
  },
  {
    id: 'ocean',
    name: 'ডিপ ওশান (Ocean Abyss)',
    tag: 'প্রফেশনাল',
    description: 'গভীর সমুদ্রের নীল ও অ্যাকোয়া প্যাটার্ন',
    previewColor: '#06b6d4',
    bgPreview: '#041326',
    isDark: true
  },
  {
    id: 'sunset',
    name: 'সানসেট অ্যাম্বার (Sunset Amber)',
    tag: 'ওয়ার্ম ডার্ক',
    description: 'কপার ও গোল্ডেন অ্যাম্বার নিওন লুক',
    previewColor: '#f59e0b',
    bgPreview: '#170c06',
    isDark: true
  },
  {
    id: 'clean-light',
    name: 'মডার্ন স্টুডিও (Studio Light)',
    tag: 'লাইট মোড',
    description: 'রিফাইন্ড ওয়ার্ম সফট লাইট ইন্টারফেস',
    previewColor: '#2563eb',
    bgPreview: '#f8fafc',
    isDark: false
  }
];

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('app_theme');
    // Ensure default is always the unique 'cosmic' theme
    return saved || 'cosmic';
  });

  useEffect(() => {
    // Apply theme attribute to document root
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  const selectTheme = (newTheme) => {
    setTheme(newTheme);
  };

  const currentThemeObj = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, selectTheme, currentTheme: currentThemeObj, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
