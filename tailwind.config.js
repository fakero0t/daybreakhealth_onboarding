const { colors, typography, spacing, layout, transitions, borderRadius, shadows } = require('./lib/constants/design-system')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      screens: {
        'mobile': { 'max': '639px' },
        'tablet': { 'min': '640px', 'max': '1024px' },
        'desktop': { 'min': '1025px' },
      },
      colors: {
        primary: colors.primary,
        secondary: colors.secondary,
        accent: colors.accent,
        background: colors.backgrounds,
        text: colors.text,
        success: colors.success,
        informational: colors.informational,
        warning: colors.warning,
        neutral: colors.neutral,
      },
      fontFamily: {
        heading: typography.fontFamilies.heading,
        body: typography.fontFamilies.body,
        sans: typography.fontFamilies.body,
      },
      fontSize: typography.fontSizes,
      fontWeight: typography.fontWeights,
      lineHeight: typography.lineHeights,
      spacing: spacing,
      maxWidth: {
        'content': layout.maxContentWidth,
        'content-narrow': layout.maxContentWidthNarrow,
      },
      transitionDuration: {
        'fast': transitions.fast,
        'normal': transitions.normal,
        'slow': transitions.slow,
      },
      transitionTimingFunction: transitions.easing,
      borderRadius: borderRadius,
      boxShadow: shadows,
    },
  },
  plugins: [],
}

