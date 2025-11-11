# UI Style Guide Update Plan

## Overview
Update the Daybreak Health onboarding UI to match ParentLab.com's warm, approachable design aesthetic. This includes updating colors, typography, spacing, and component styles while maintaining accessibility standards.

## Design Analysis from ParentLab.com

### Color Palette
- **Primary Text**: `#02323D` (dark teal - rgb(2, 50, 61))
- **Body Text**: `#666666` (medium gray - rgb(102, 102, 102))
- **Backgrounds**:
  - White: `#FFFFFF`
  - Light Yellow/Cream: `#FFFBF2`
  - Muted Teal/Green: `#E0F0F2`
- **Accent Colors**:
  - Coral/Orange: `#F78F6F` (primary CTA buttons, highlights)
  - Light Blue: `#87C0C7` (secondary accents, carousel indicators)
- **Star Rating**: `#FFD700` (gold)

### Typography
- **Heading Font**: "Tropiline Bold" (custom font - will use similar Google Font alternative: "Poppins" or "Montserrat" bold)
- **Body Font**: "Open Sans" (Google Fonts)
- **Font Sizes**: Large headings (3-4rem), medium headings (2-2.5rem), body (1rem), small (0.875rem)

### Design Characteristics
- Rounded corners: `rounded-lg` for cards, `rounded-full` for primary buttons
- Generous spacing with consistent padding
- Subtle shadows for depth
- Clean, modern, friendly aesthetic
- Warm color scheme

## Implementation Tasks

### 1. Update Design System Constants
**File**: `lib/constants/design-system.js`

- Replace color palette with ParentLab-inspired colors:
  - Primary: Dark teal shades (`#02323D` as base)
  - Secondary: Coral/Orange (`#F78F6F`)
  - Accent: Light blue (`#87C0C7`)
  - Backgrounds: White, cream (`#FFFBF2`), muted teal (`#E0F0F2`)
  - Text: Dark teal for headings, gray for body
- Update typography to include:
  - Heading font family: "Poppins" or "Montserrat" (bold weights)
  - Body font family: "Open Sans"
- Adjust spacing scale for more generous padding
- Update border radius values to match rounded aesthetic
- Update shadows to be more subtle

### 2. Update Tailwind Configuration
**File**: `tailwind.config.js`

- Extend theme with new color palette
- Add font families for headings and body
- Update font sizes to match ParentLab scale
- Configure border radius values
- Update shadow definitions

### 3. Update Global Styles
**File**: `app/globals.css`

- Import Google Fonts: "Open Sans" and "Poppins" (or "Montserrat")
- Set up CSS variables for fonts
- Update base body styles with new colors
- Ensure accessibility (focus states, reduced motion)
- Add any custom utility classes needed

### 4. Update Layout
**File**: `app/layout.js`

- Import and configure Google Fonts using Next.js font optimization
- Set up font variables for use throughout the app
- Ensure proper font loading

### 5. Update Component Styles
**Files**: All component files in `components/`

- Update Button component to use coral accent color and rounded-full for primary
- Update LandingPage with new color scheme and spacing
- Update other onboarding components to match new aesthetic
- Ensure all components use new design tokens

## Files to Modify

1. `lib/constants/design-system.js` - Complete color and typography overhaul
2. `tailwind.config.js` - Update theme extensions
3. `app/globals.css` - Add font imports and base styles
4. `app/layout.js` - Configure Google Fonts
5. `components/shared/Button.jsx` - Update button styles
6. `components/onboarding/LandingPage.jsx` - Update colors and spacing
7. All other component files as needed for consistency

## Font Strategy

Since "Tropiline Bold" is a custom font, we'll use:
- **Headings**: "Poppins" (bold weights 600-700) as a close alternative
- **Body**: "Open Sans" (regular 400, medium 500) - matches ParentLab exactly

Both fonts are available via Google Fonts and Next.js font optimization.

## Color Mapping

- Current `primary-500` (blue) → New `primary-500` (dark teal `#02323D`)
- Current `secondary-500` (pink) → New `secondary-500` (coral `#F78F6F`)
- Add new `accent-500` (light blue `#87C0C7`)
- Background colors: `bg-cream` (`#FFFBF2`), `bg-muted-teal` (`#E0F0F2`)

## Accessibility Considerations

- Maintain WCAG AA contrast ratios
- Ensure focus indicators are visible
- Keep minimum touch target sizes (44px)
- Preserve reduced motion preferences
- Maintain readable font sizes (minimum 16px for body)

## Detailed Color Palette

### Primary Colors (Dark Teal)
```javascript
primary: {
  50: '#E6F0F2',
  100: '#CCE1E5',
  200: '#99C3CB',
  300: '#66A5B1',
  400: '#338797',
  500: '#02323D', // Main primary
  600: '#02282F',
  700: '#011E21',
  800: '#011413',
  900: '#000A05',
}
```

### Secondary Colors (Coral/Orange)
```javascript
secondary: {
  50: '#FEF5F2',
  100: '#FDEBE5',
  200: '#FBD7CB',
  300: '#F9C3B1',
  400: '#F7AF97',
  500: '#F78F6F', // Main secondary
  600: '#C67259',
  700: '#945543',
  800: '#62382D',
  900: '#311B17',
}
```

### Accent Colors (Light Blue)
```javascript
accent: {
  50: '#F0F8F9',
  100: '#E1F1F3',
  200: '#C3E3E7',
  300: '#A5D5DB',
  400: '#87C7CF',
  500: '#87C0C7', // Main accent
  600: '#6C9A9F',
  700: '#517477',
  800: '#364D50',
  900: '#1B2728',
}
```

### Background Colors
```javascript
backgrounds: {
  white: '#FFFFFF',
  cream: '#FFFBF2',
  mutedTeal: '#E0F0F2',
}
```

### Text Colors
```javascript
text: {
  primary: '#02323D',   // Dark teal for headings
  body: '#666666',       // Gray for body text
  secondary: '#999999',  // Lighter gray for secondary text
  inverse: '#FFFFFF',    // White for text on dark backgrounds
}
```

## Typography Scale

### Font Families
- **Headings**: Poppins (weights: 400, 500, 600, 700)
- **Body**: Open Sans (weights: 400, 500, 600)

### Font Sizes
```javascript
fontSizes: {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px (body text)
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '2rem',    // 32px
  '4xl': '2.5rem',  // 40px
  '5xl': '3rem',    // 48px
  '6xl': '4rem',    // 64px (hero headings)
}
```

### Line Heights
- Tight: 1.25 (headings)
- Snug: 1.375
- Normal: 1.5 (body text)
- Relaxed: 1.625
- Loose: 2

## Spacing Scale

```javascript
spacing: {
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
```

## Border Radius

```javascript
borderRadius: {
  none: '0',
  sm: '0.25rem',   // 4px
  base: '0.5rem',  // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  '2xl': '2rem',   // 32px
  full: '9999px',  // Full rounded (for buttons)
}
```

## Shadows

```javascript
shadows: {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
}
```

## Component Style Guidelines

### Buttons
- **Primary CTA**: Coral background (`#F78F6F`), white text, `rounded-full`, bold font
- **Secondary**: Outline style with coral border, coral text
- **Text buttons**: Coral text, transparent background
- Minimum size: 44px height for touch targets

### Cards
- White background
- `rounded-lg` corners
- Subtle shadow (`shadow-md`)
- Generous padding (`p-6` or `p-8`)

### Sections
- Alternate between white, cream (`#FFFBF2`), and muted teal (`#E0F0F2`) backgrounds
- Generous vertical padding (`py-16` or `py-20`)
- Max width container for content (`max-w-6xl` or `max-w-7xl`)

### Typography Hierarchy
- **H1**: `text-5xl` or `text-6xl`, `font-bold`, `text-primary-500`
- **H2**: `text-4xl`, `font-semibold`, `text-primary-500`
- **H3**: `text-3xl`, `font-semibold`, `text-primary-500`
- **Body**: `text-base`, `font-normal`, `text-gray-600`
- **Small**: `text-sm`, `font-normal`, `text-gray-600`

## Implementation Notes

1. All colors should be defined in `design-system.js` first, then referenced in Tailwind config
2. Use Tailwind's color opacity modifiers (e.g., `bg-primary-500/10`) for subtle backgrounds
3. Maintain semantic color names (primary, secondary, accent) for consistency
4. Test contrast ratios to ensure WCAG AA compliance
5. Use Next.js font optimization for Google Fonts to improve performance
6. Consider adding custom CSS variables for dynamic theming if needed in the future

