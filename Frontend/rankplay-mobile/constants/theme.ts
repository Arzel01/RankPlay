/**
 * RankPlay Theme Configuration
 * Professional red color scheme for the gaming platform
 */

import { Platform } from 'react-native';

// Primary Red Palette
export const Colors = {
  // Brand colors
  primary: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',  // Main red
    600: '#DC2626',  // Primary button
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  
  // Neutral colors
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },

  // Accent colors
  accent: {
    gold: '#F59E0B',
    silver: '#94A3B8',
    bronze: '#D97706',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // Achievement rarity colors
  rarity: {
    common: '#94A3B8',
    uncommon: '#10B981',
    rare: '#3B82F6',
    epic: '#8B5CF6',
    legendary: '#F59E0B',
  },

  // Light theme
  light: {
    text: '#0F172A',
    textSecondary: '#64748B',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    surfaceVariant: '#F1F5F9',
    tint: '#DC2626',
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#DC2626',
    border: '#E2E8F0',
    card: '#FFFFFF',
  },

  // Dark theme
  dark: {
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceVariant: '#334155',
    tint: '#EF4444',
    icon: '#94A3B8',
    tabIconDefault: '#64748B',
    tabIconSelected: '#EF4444',
    border: '#334155',
    card: '#1E293B',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
  display: 40,
};

export const FontWeights = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Shadows = {
  sm: {
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
  },
  md: {
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  },
  lg: {
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
  },
  xl: {
    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.2)',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', sans-serif",
    mono: "Menlo, Monaco, 'Courier New', monospace",
  },
});

export const Theme = {
  colors: Colors,
  spacing: Spacing,
  borderRadius: BorderRadius,
  fontSizes: FontSizes,
  fontWeights: FontWeights,
  shadows: Shadows,
  fonts: Fonts,
};

export default Theme;
