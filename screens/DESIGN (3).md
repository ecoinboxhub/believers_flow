---
name: Ecclesiastical Heritage
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#ccc3d5'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#958e9e'
  outline-variant: '#4a4453'
  surface-tint: '#d3bbff'
  primary: '#d3bbff'
  on-primary: '#3f008d'
  primary-container: '#673ab7'
  on-primary-container: '#d8c2ff'
  inverse-primary: '#6f43c0'
  secondary: '#ffb4ac'
  on-secondary: '#690007'
  secondary-container: '#a00211'
  on-secondary-container: '#ffa9a0'
  tertiary: '#e9c400'
  on-tertiary: '#3a3000'
  tertiary-container: '#c8a900'
  on-tertiary-container: '#4b3e00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ebddff'
  primary-fixed-dim: '#d3bbff'
  on-primary-fixed: '#250059'
  on-primary-fixed-variant: '#5727a6'
  secondary-fixed: '#ffdad6'
  secondary-fixed-dim: '#ffb4ac'
  on-secondary-fixed: '#410003'
  on-secondary-fixed-variant: '#93000e'
  tertiary-fixed: '#ffe16d'
  tertiary-fixed-dim: '#e9c400'
  on-tertiary-fixed: '#221b00'
  on-tertiary-fixed-variant: '#544600'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: EB Garamond
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: EB Garamond
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 42px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: EB Garamond
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  title-lg:
    fontFamily: Hanken Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style

The design system is an expression of multi-denominational unity, blending the liturgical solemnity of traditional worship with the vibrant energy of modern charismatic movements. It is designed for premium ecclesiastical platforms, religious educational tools, and high-end congregational management.

The aesthetic direction is **Refined Minimalism with Neo-Ecclesiastical accents**. It utilizes a deep, sophisticated foundation to allow denominational colors to function as "sacred highlights." The UI should evoke a sense of reverence, continuity, and architectural stability. It avoids the "tech-startup" look in favor of a timeless, institutional quality that feels both established and forward-leaning.

## Colors

The palette is built upon a **Deep Navy base (#0B0F1A)**, providing a vast, spiritual backdrop that ensures the denominational accents feel like stained glass catching light.

- **Deep Royal Purple (#673AB7):** Used for primary actions and royal status indicators, nodding to Christ Embassy and COZA’s regal aesthetic.
- **Rich Crimson (#C62828):** Used for high-importance notices, spiritual "fire" motifs, and key navigation points, reflecting the Living Faith Church heritage.
- **Vibrant Gold (#FFD700):** Used sparingly for borders, icons, and "Sacred Highlights" to denote excellence and divine favor (FCS/Accents).
- **Surface Strategy:** Backgrounds should remain dark and desaturated. Avoid pure black; use the Navy-slate tones to maintain a premium, soft-touch depth.

## Typography

This design system employs a sophisticated serif-sans pairing to balance tradition with modernity.

- **Headlines (EB Garamond):** Used for titles, quotes, and scripture. The classical proportions of this Garamond variant bring a scholarly, premium, and romantic feel to the "Word."
- **Body & Interface (Hanken Grotesk):** A sharp, contemporary sans-serif used for all functional UI, long-form reading, and labels. It ensures the platform feels high-tech and accessible.
- **Hierarchy Rule:** Use High-contrast serifs for emotional resonance (Display) and clean sans-serifs for utility (Data/Body).

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid Grid**. Content is housed in a centered container (1280px max) to maintain focus and "sanctuary" space.

- **Rhythm:** An 8px linear scale governs all spacing.
- **Negative Space:** Generous top and bottom margins (64px+) are encouraged to give sections "room to breathe," mimicking the vaulted ceilings of a cathedral.
- **Mobile Adaption:** Margins shrink to 16px, and multi-column grids collapse into a single vertical stack. Typography scales down slightly to maintain readability without losing the Serif elegance.

## Elevation & Depth

Hierarchy is achieved through **Tonal Layering and Golden Outlines** rather than aggressive shadows.

- **The Layering Model:** The base is the darkest Navy. Floating cards use a slightly lighter Slate (#1E293B). 
- **The "Halo" Effect:** Instead of traditional shadows, elevated elements (like active cards or modals) feature a 1px low-opacity Gold (#FFD700) or Purple (#673AB7) border.
- **Glassmorphism:** Use backdrop blurs (20px+) on navigation bars to create a sense of presence and continuity as the user scrolls through "sacred" content.

## Shapes

The shape language is **Architectural and Soft**. We avoid the hyper-rounded "bubble" look of social apps in favor of structural integrity.

- **Corner Radius:** A consistent 0.25rem (4px) or 0.5rem (8px) is used to suggest stability and craftsmanship.
- **Interactive Elements:** Buttons should have subtle rounding. Avoid pills unless used for specific "status" tags.
- **Iconography:** Use "Duotone" icons where the secondary color (Gold) highlights a specific part of the icon stroke.

## Components

- **Buttons:** 
  - *Primary:* Deep Royal Purple background with white text.
  - *Secondary:* Rich Crimson background (use for "Give," "Join," or "Live").
  - *Outline:* 1px Gold border with transparent background for subtle actions.
- **Cards:** Use the "Surface Elevated" color. Header areas of cards can feature a 2px top-border in the denominational color (Purple for COZA-related content, Red for Living Faith-related content).
- **Input Fields:** Darker than the surface, with a 1px Navy-slate border. On focus, the border transitions to Gold.
- **Chips/Badges:** Use small, high-contrast labels. For example, a "Live" badge should use the Rich Crimson with a subtle outer glow.
- **Navigation:** Top-fixed, semi-transparent Navy with a blur effect. Navigation links use Hanken Grotesk in Medium weight.
- **Scripture Blocks:** Specialized containers using EB Garamond, italicized, with a Gold left-hand border accent to distinguish "The Word" from UI text.