# UI Style Guide Implementation Task List

This document outlines the exact steps needed to implement the UI style guide update as specified in `ui_update_prd.md`.

## Phase 1: Design System Foundation

### Task 1.1: Update Design System Constants
**File**: `lib/constants/design-system.js`

1. Replace the `colors.primary` object with the new dark teal palette:
   - Update all 10 shades (50-900) using the values from PRD (lines 118-131)
   - Ensure `500` is `#02323D`

2. Replace the `colors.secondary` object with the new coral/orange palette:
   - Update all 10 shades (50-900) using the values from PRD (lines 134-147)
   - Ensure `500` is `#F78F6F`

3. Add new `colors.accent` object with light blue palette:
   - Create all 10 shades (50-900) using the values from PRD (lines 150-163)
   - Ensure `500` is `#87C0C7`

4. Add new `colors.backgrounds` object:
   - `white: '#FFFFFF'`
   - `cream: '#FFFBF2'`
   - `mutedTeal: '#E0F0F2'`

5. Add new `colors.text` object:
   - `primary: '#02323D'`
   - `body: '#666666'`
   - `secondary: '#999999'`
   - `inverse: '#FFFFFF'`

6. Update `typography.fontFamilies`:
   - Change `heading` to `'var(--font-poppins)'`
   - Change `body` to `'var(--font-open-sans)'`

7. Update `typography.fontSizes`:
   - Add `'6xl': '4rem'` for hero headings
   - Verify all sizes match PRD (lines 192-204)

8. Update `spacing` object:
   - Add `32: '8rem'` for 128px spacing
   - Verify all values match PRD (lines 216-232)

9. Update `borderRadius` object:
   - Update values to match PRD (lines 237-247)
   - Ensure `full: '9999px'` is present

10. Update `shadows` object:
    - Replace all shadow values with PRD values (lines 252-259)

11. Update the `designSystem` export to include new color objects

### Task 1.2: Update Tailwind Configuration
**File**: `tailwind.config.js`

1. Import the updated design system constants

2. In `theme.extend.colors`, add:
   - `accent: colors.accent`
   - `background: colors.backgrounds`
   - `text: colors.text`

3. In `theme.extend.fontFamily`, update:
   - `heading: typography.fontFamilies.heading`
   - `body: typography.fontFamilies.body`
   - `sans: typography.fontFamilies.body`

4. Verify `theme.extend.fontSize` uses `typography.fontSizes`

5. Verify `theme.extend.spacing` uses the updated `spacing` object

6. Verify `theme.extend.borderRadius` uses the updated `borderRadius` object

7. Verify `theme.extend.boxShadow` uses the updated `shadows` object

## Phase 2: Typography Setup

### Task 2.1: Update Layout with Google Fonts
**File**: `app/layout.js`

1. Import `Poppins` from `next/font/google`:
   - Configure with subsets: `['latin']`
   - Set variable: `'--font-poppins'`
   - Include weights: `[400, 500, 600, 700]`

2. Import `Open_Sans` from `next/font/google`:
   - Configure with subsets: `['latin']`
   - Set variable: `'--font-open-sans'`
   - Include weights: `[400, 500, 600]`

3. Remove the existing `Inter` import

4. Update the `body` className to include both font variables:
   - Add `${poppins.variable}` and `${openSans.variable}`
   - Keep `font-sans` class

### Task 2.2: Update Global CSS
**File**: `app/globals.css`

1. Remove the `--font-inter` CSS variable definition

2. Add CSS variables for the new fonts:
   - `--font-poppins: 'Poppins', sans-serif;`
   - `--font-open-sans: 'Open Sans', sans-serif;`

3. Update the `body` font-family to use `var(--font-open-sans)`

4. Verify focus indicator uses `theme('colors.primary.500')` (should now be dark teal)

5. Ensure all accessibility styles remain intact (reduced motion, focus states, etc.)

## Phase 3: Component Updates

### Task 3.1: Update Button Component
**File**: `components/shared/Button.jsx`

1. Update `variantStyles.primary`:
   - Change background to `bg-secondary-500` (coral)
   - Change hover to `hover:bg-secondary-600`
   - Change focus ring to `focus:ring-secondary-500`
   - Change disabled to `disabled:bg-secondary-300`
   - Add `rounded-full` to base styles for primary variant

2. Update `variantStyles.secondary`:
   - Change border to `border-secondary-500` (coral)
   - Change text to `text-secondary-500`
   - Change hover background to `hover:bg-secondary-50`
   - Change focus ring to `focus:ring-secondary-500`

3. Update `variantStyles.outline`:
   - Change border to `border-secondary-500`
   - Change text to `text-secondary-500`
   - Change hover to `hover:bg-secondary-50`
   - Change focus ring to `focus:ring-secondary-500`

4. Update `variantStyles.text`:
   - Change text to `text-secondary-500`
   - Change hover to `hover:bg-secondary-50`
   - Change focus ring to `focus:ring-secondary-500`

5. Verify minimum sizes remain 44px for accessibility

### Task 3.2: Update LandingPage Component
**File**: `components/onboarding/LandingPage.jsx`

1. Update background color:
   - Change `bg-neutral-50` to `bg-cream` (or use `bg-background-cream` if using Tailwind config)

2. Update heading styles:
   - Change `text-neutral-900` to `text-primary-500` (dark teal)
   - Add `font-heading` class
   - Consider increasing size to `text-4xl` or `text-5xl` for hero

3. Update body text colors:
   - Change `text-neutral-700` to `text-body` (or `text-text-body`)
   - Change `text-neutral-600` to `text-text-secondary`

4. Update card styles:
   - Change `bg-white` to `bg-white` (keep white)
   - Change `border-neutral-200` to a subtle border or remove
   - Update shadow to `shadow-md` for subtle depth
   - Ensure `rounded-lg` is applied

5. Update spacing:
   - Increase vertical padding to `py-16` or `py-20` for sections
   - Increase gap between cards if needed

6. Update button:
   - Ensure it uses the updated Button component with coral styling

### Task 3.3: Update Other Onboarding Components
**Files**: 
- `components/onboarding/InsuranceUpload.jsx`
- `components/onboarding/InsuranceResults.jsx`
- `components/onboarding/IntakeSurvey.jsx`
- `components/onboarding/SchedulingAssistant.jsx`

For each component:

1. Update background colors:
   - Replace `bg-neutral-50` with `bg-cream` or `bg-muted-teal` (alternate for visual interest)
   - Or use `bg-white` where appropriate

2. Update text colors:
   - Headings: `text-primary-500` with `font-heading`
   - Body text: `text-text-body` or `text-text-secondary`
   - Remove `text-neutral-*` classes

3. Update card/container styles:
   - Ensure `rounded-lg` for cards
   - Add `shadow-md` for depth
   - Update padding to be more generous (`p-6` or `p-8`)

4. Update button usage:
   - Verify buttons use the updated Button component
   - Ensure primary buttons appear with coral background

5. Update spacing:
   - Increase section padding (`py-16` or `py-20`)
   - Ensure consistent spacing between elements

### Task 3.4: Update Shared Components
**Files**:
- `components/shared/ProgressIndicator.jsx`
- `components/shared/QuestionCard.jsx`
- `components/shared/FileUpload.jsx`
- `components/shared/FAQChatbot.jsx`

For each component:

1. Update color references:
   - Replace `primary-*` colors (old blue) with new dark teal
   - Replace `secondary-*` colors (old pink) with new coral
   - Update text colors to use new text palette

2. Update typography:
   - Headings: Add `font-heading` class
   - Body: Ensure `font-body` or `font-sans` is applied

3. Update styling:
   - Ensure rounded corners match design (`rounded-lg` for cards)
   - Update shadows to `shadow-md`
   - Update spacing to be more generous

## Phase 4: Verification & Testing

### Task 4.1: Visual Verification
1. Check all pages render correctly with new fonts
2. Verify color palette is applied consistently
3. Ensure buttons have coral background and rounded-full shape
4. Check that cards have proper shadows and rounded corners
5. Verify spacing is generous and consistent
6. Confirm background colors alternate appropriately

### Task 4.2: Accessibility Testing
1. Test contrast ratios:
   - Dark teal text (`#02323D`) on white background
   - Coral buttons (`#F78F6F`) with white text
   - Gray body text (`#666666`) on white/cream backgrounds
   - Use a contrast checker tool to verify WCAG AA compliance

2. Test focus states:
   - Verify focus rings are visible on all interactive elements
   - Ensure focus color uses `primary-500` (dark teal)

3. Test touch targets:
   - Verify all buttons are at least 44px height
   - Check interactive elements have adequate spacing

4. Test reduced motion:
   - Verify animations respect `prefers-reduced-motion`

### Task 4.3: Cross-Browser Testing
1. Test in Chrome/Edge
2. Test in Firefox
3. Test in Safari
4. Verify fonts load correctly in all browsers
5. Check that colors render consistently

### Task 4.4: Responsive Testing
1. Test mobile viewport (320px - 639px)
2. Test tablet viewport (640px - 1024px)
3. Test desktop viewport (1025px+)
4. Verify typography scales appropriately
5. Check spacing adjusts for smaller screens
6. Ensure buttons remain accessible on mobile

## Phase 5: Cleanup

### Task 5.1: Remove Unused Styles
1. Search for any remaining `text-neutral-*` classes
2. Search for any remaining `bg-neutral-*` classes
3. Search for any remaining old color references
4. Update or remove as needed

### Task 5.2: Update Documentation
1. Verify component comments reflect new styling
2. Update any inline documentation about color usage
3. Ensure design system constants are well-documented

## Implementation Order

1. **Phase 1** (Design System Foundation) - Must be completed first
2. **Phase 2** (Typography Setup) - Can be done in parallel with Phase 1
3. **Phase 3** (Component Updates) - Must be done after Phases 1 & 2
4. **Phase 4** (Verification & Testing) - After all updates
5. **Phase 5** (Cleanup) - Final step

## Notes

- Always test after each phase before moving to the next
- Keep accessibility requirements in mind throughout
- Maintain semantic HTML structure while updating styles
- Use Tailwind utility classes where possible for consistency
- Reference `ui_update_prd.md` for exact color values and specifications

