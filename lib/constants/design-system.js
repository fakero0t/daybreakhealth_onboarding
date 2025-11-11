/**
 * Design System Constants
 * 
 * This file contains all design system constants including colors, typography,
 * spacing, and other design tokens used throughout the application.
 */

// Color Palette - Semantic color names
const colors = {
  primary: {
    50: '#E6F0F2',
    100: '#CCE1E5',
    200: '#99C3CB',
    300: '#66A5B1',
    400: '#338797',
    500: '#02323D', // Main primary (dark teal)
    600: '#02282F',
    700: '#011E21',
    800: '#011413',
    900: '#000A05',
  },
  secondary: {
    50: '#FEF5F2',
    100: '#FDEBE5',
    200: '#FBD7CB',
    300: '#F9C3B1',
    400: '#F7AF97',
    500: '#F78F6F', // Main secondary (coral/orange)
    600: '#C67259',
    700: '#945543',
    800: '#62382D',
    900: '#311B17',
  },
  accent: {
    50: '#F0F8F9',
    100: '#E1F1F3',
    200: '#C3E3E7',
    300: '#A5D5DB',
    400: '#87C7CF',
    500: '#87C0C7', // Main accent (light blue)
    600: '#6C9A9F',
    700: '#517477',
    800: '#364D50',
    900: '#1B2728',
  },
  backgrounds: {
    white: '#FFFFFF',
    cream: '#FFFBF2',
    'muted-teal': '#E0F0F2',
  },
  text: {
    primary: '#02323D',   // Dark teal for headings
    body: '#666666',       // Gray for body text
    secondary: '#999999',  // Lighter gray for secondary text
    inverse: '#FFFFFF',    // White for text on dark backgrounds
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Soft green
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  informational: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Amber
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
}

// Typography
const typography = {
  fontFamilies: {
    heading: 'var(--font-poppins)',
    body: 'var(--font-open-sans)',
  },
  fontSizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px (minimum body text)
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px (minimum heading)
    '3xl': '2rem',    // 32px
    '4xl': '2.5rem',  // 40px
    '5xl': '3rem',    // 48px
    '6xl': '4rem',    // 64px (hero headings)
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeights: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
}

// Spacing Scale
const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
}

// Layout Constants
const layout = {
  maxContentWidth: '800px', // Maximum content width (680-800px range)
  maxContentWidthNarrow: '680px',
  containerPadding: {
    mobile: '1rem',    // 16px
    tablet: '2rem',    // 32px
    desktop: '2rem',   // 32px
  },
}

// Transition Durations
const transitions = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  easing: {
    default: 'ease-in-out',
    easeOut: 'ease-out',
    easeIn: 'ease-in',
  },
}

// Border Radius
const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  base: '0.5rem',  // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  '2xl': '2rem',   // 32px
  full: '9999px',  // Full rounded (for buttons)
}

// Shadows
const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
}

// Export all constants as a single object
const designSystem = {
  colors,
  typography,
  spacing,
  layout,
  transitions,
  borderRadius,
  shadows,
}

// CommonJS exports for Tailwind config
module.exports = {
  colors,
  typography,
  spacing,
  layout,
  transitions,
  borderRadius,
  shadows,
  designSystem,
}

// ES6 exports for React components
// Note: In Next.js, we can use require() in client components or use dynamic imports
// For now, keeping CommonJS for compatibility with Tailwind config

