---
name: Courtside Precision
colors:
  deep-green: '#203F39'
  teal: '#0F5C62'
  dark-teal: '#084B46'
  forest-teal: '#085953'
  sage: '#8A9B82'
  pale-sage: '#EAF0E5'
  off-white: '#FAF9F5'
  ivory: '#FEFEFB'
  muted: '#748079'
  line: '#E2E5DC'
  cream: '#FEECD6'
  error: '#BA1A1A'
typography:
  scoreboard-display:
    fontFamily: Outfit
    fontSize: 112px
    fontWeight: '800'
    lineHeight: 100px
    letterSpacing: -0.04em
  scoreboard-display-mobile:
    fontFamily: Outfit
    fontSize: 64px
    fontWeight: '800'
    lineHeight: 60px
    letterSpacing: -0.03em
  display-lg:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Outfit
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Outfit
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Outfit
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Outfit
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Outfit
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.04em
  label-md:
    fontFamily: Outfit
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.06em
  label-sm:
    fontFamily: Outfit
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 2.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system channels the refined energy of modern country clubs, architectural court design, and tactical sports precision. Built for an elevated pickleball scoring and match tracking experience, the interface departs from loud, chaotic arcade trackers and moves into a realm of sunlit pavilion elegance, crisp geometry, and effortless glanceability under natural sunlight.

### Target Audience & Emotional Intent
- **Audience:** Passionate recreational players, competitive club members, tournament directors, and spectators seeking seamless real-time match tracking on court-side tablets, mobile phones, and large display monitors.
- **Tone:** Authoritative, breezy, athletic, and sophisticated. The interface should feel as tactile and satisfying as a clean paddle strike on a fresh ball.
- **Design Movement:** Clean Modern Athletic meets Warm Tactile Minimalism. Subtle debossed score blocks, pill-shaped markers, crisp baseline borders reminiscent of court striping, and balanced negative space prevent cognitive overload during fast-paced play.

## Colors

The palette draws inspiration directly from championship courts, lush club grounds, and tactile sporting precision. Contrast ratios strictly adhere to WCAG AAA standards for scoreboard elements to ensure total legibility under outdoor glares and bright daylight.

### Palette Architecture
- **Page Canvas (`#FAF9F5` - Off-White):** The foundational substrate across all screens. Soft on the eyes outdoors, steering clear of stark, clinical cold whites.
- **Card & Surface (`#EAF0E5` - Pale Sage):** Court-side card containers, scoreboard serving panel, and timer cell.
- **Player-Facing Panels & Flap Cards (`#FEFEFB` - Ivory):** Elevated panels, header, and flap cards.
- **Primary Action / Court Green (`#0F5C62` - Teal):** The engine of interaction. Used for key action states, active point confirmations, primary controls, and dominant court indicators.
- **Primary Hover & Server Blocks (`#085953` - Forest Teal):** Primary button hover states, scoreboard bottom team-name and SERVER blocks.
- **Secondary / Accent (`#8A9B82` - Sage):** Complementary interactive states, quotation marks, and court apron.
- **Accent Highlight (`#FEECD6` - Cream):** Supporting accent (replaces old yellow) reserved for active serve badges, server number tile, and winning match celebration highlights.
- **Deep Branding & Primary Text (`#084B46` - Dark Teal):** The primary text color for headers, dominant team names, and heavy score numbers.
- **Net Details & Backdrop (`#203F39` - Deep Green):** Secondary deep structural contrast, page backdrop, and high-emphasis body text.
- **Secondary Text & Receiving State (`#748079` - Muted):** Receiving panel indicators, placeholders, and secondary text.
- **Structural Borders & Dividers (`#E2E5DC` - Line):** Delivers clean lines reminiscent of court tape and structural net cords without visual harshness.

## Typography

Outfit serves as the universal typeface across display, editorial, body, and tabular scoreboard roles. Its balanced geometric construction delivers both modern sporting sophistication and immediate tactical legibility.

### Tabular Numerical Treatment
- All scoreboard counters, game clocks, set tallies, and server numbers (`1` or `2`) must enforce OpenType tabular figures (`font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1;`). This eliminates number jitter and layout jumping when points are recorded.
- Large numerical score components use negative letter spacing (`-0.03em` to `-0.04em`) to maintain optical density, keeping scores visible from across a 44-foot court.
- Sub-labels for team assignments, court stations, and server positions are rendered in uppercase using `label-sm` or `label-md` with expanded letter spacing to ensure quick scanning at glancing angles.

## Layout & Spacing

The layout is structured around responsive courtside adaptability: a flexible grid that transitions effortlessly between desktop tournament overviews, landscape referee tablets, and single-hand mobile scoring inputs.

### Grid System
- **Desktop & Scoreboard Monitors (1200px+):** 12-column layout with 2.5rem margins and 1.5rem gutters. Centered scoreboard viewport maxes out at 1360px width.
- **Tablet Landscape / Umpire Console (768px - 1199px):** 8-column layout with 1.5rem margins and 1rem gutters. Side-by-side team layout split symmetrically 4x4.
- **Mobile Handheld (Under 768px):** 4-column layout with 1rem outer margin and 0.75rem gutters. Vertical split or stacked cards optimize large thumb tap targets.

### Spacing Philosophy
Spacing reflects physical court layout discipline: clear margins between serving zones and sideline elements. Use `space-md` for grouped score inputs, `space-lg` between distinct team modules, and `space-xl` to segment primary match controls from historical game analytics.

## Elevation & Depth

This system avoids heavy drop shadows, adopting tonal court layering paired with crisp interior borders and subtle ambient warmth.

### Elevation Hierarchy
- **Level 0 (Canvas):** Pure `#FAF9F5`. Flat background plane.
- **Level 1 (Card & Module Layer):** `#EAF0E5` resting on `#FAF9F5`. Outlined with a 1px solid `#E2E5DC` border. No drop shadow. Depth is achieved purely through organic color contrast.
- **Level 2 (Tactile Score Tiles & Interactive Widgets):** `#FEFEFB` panels nested inside pale sage cards. Features a crisp 1.5px border in `#E2E5DC` and a crisp, light-absorbing ambient shadow: `0 4px 12px -2px rgba(8, 75, 70, 0.06), 0 2px 4px -1px rgba(8, 75, 70, 0.03)`.
- **Level 3 (Modals, Overlays, and Match Confirmation Sheets):** Resting on top of a 35% `#203F39` tinted backdrop blur (`backdrop-filter: blur(8px)`). Shadow: `0 20px 32px -8px rgba(8, 75, 70, 0.16)`.
- **Level 4 (Tactile Button Press):** Interactive score increment buttons simulate physical score paddles: `transform: translateY(2px)` with an active border highlight in `#0F5C62`.

## Shapes

The geometric signature combines the soft, aerodynamic curvature of a pickleball paddle edge with crisp, rectilinear court boundaries.

- **Base Radius (0.5rem / 8px):** Applied to numeric inputs, action chips, match statistics cells, and dropdown select menus.
- **Large Radius (`rounded-lg`, 1rem / 16px):** Standard for main team scoreboard cards, set containers, side-out alert panels, and dialogs.
- **Extra Large Radius (`rounded-xl`, 1.5rem / 24px):** Reserved for primary court surface wrappers and overall match overview enclosures.
- **Full Pill (`rounded-full`):** Strictly used for ball indicators, server sequence badges (`Server 1`, `Server 2`), game status pills (`In Progress`, `Final`), and quick scoring stepper buttons (`+1`, `-1`).

## Components

### 1. Scoreboard Card & Numeric Display
- **Structure:** Split card layout representing Serving Team vs. Receiving Team.
- **Serving Panel:** Surfaces use `#EAF0E5` (Pale Sage) with an inner score digit well in `#FEFEFB` (Ivory). 2px `#0F5C62` border on digit well. Digits in `#084B46`. Team pill in `#0F5C62` with `#FEFEFB` text and `#FEECD6` "SERVING".
- **Receiving Panel:** Surfaces use `#FEFEFB` (Ivory) with `#E2E5DC` border. Digits in `#748079`. Header pill in `#E2E5DC` with `#748079` text.
- **Callout Row:** Bottom team-name block and SERVER block use `#085953` (Forest Teal) background, `#FEFEFB` team name, `#FEECD6` "SERVER" label, and `#FEECD6` digit tile with `#084B46` digit.

### 2. Control Bar
- **Bar:** `#FEFEFB` background with `#E2E5DC` border.
- **Undo / Redo:** Buttons use `#203F39` for active state and `#748079` for disabled state.
- **Timer Cell:** `#EAF0E5` background with `#084B46` digits and `#748079` label.

### 3. Server & Ball Indicator Chips
- **Active Serve Pill:** Background `#0F5C62` with `#FEFEFB` bold uppercase text (`label-sm`) and `#FEECD6` "SERVING".
- **Server Indicator Badge:** `#FEECD6` tile with `#084B46` digit.

### 4. Court Visualizer & Rotation Map
- Compact top-down schematic of the non-volley zone ("kitchen") and service courts.
- Court floor rendered in `#0F5C62`, apron in `#8A9B82`, shadow in `#E2E5DC`, and court lines in `#FEECD6`.

### 5. Input Fields & Match Setup Controls
- **Text Inputs:** `#FAF9F5` fill, 1.5px border in `#E2E5DC`, text in `#084B46`, placeholder in `#748079`. Focus state shifts border to 2px solid `#0F5C62`.
- **Checkboxes & Radios:** Border 2px `#8A9B82`. Checked state fills `#0F5C62` with a `#FEFEFB` check icon.

### 6. Set & Game History Table
- Clean list layout using alternating horizontal dividers of 1px `#E2E5DC`.
- Column headings styled with `#748079`.
- Winning sets highlighted with a tiny `#FEECD6` dot beside the set score.
