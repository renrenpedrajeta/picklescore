---
name: PikolScore Tonal Auth
colors:
  off-white: '#FAF9F5'
  ivory: '#FEFEFB'
  pale-sage: '#EAF0E5'
  teal: '#0F5C62'
  dark-teal: '#084B46'
  forest-teal: '#085953'
  deep-green: '#203F39'
  sage: '#8A9B82'
  muted: '#748079'
  line: '#E2E5DC'
  cream: '#FEECD6'
  error: '#BA1A1A'
typography:
  display-h1:
    fontFamily: Outfit
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  quote-display:
    fontFamily: Outfit
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  brand-logo:
    fontFamily: Outfit
    fontSize: 26px
    fontWeight: '700'
    letterSpacing: -0.01em
  button-primary:
    fontFamily: Outfit
    fontSize: 17px
    fontWeight: '600'
  body-base:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  input-text:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '500'
  body-sm:
    fontFamily: Outfit
    fontSize: 15px
    fontWeight: '400'
  label-sm:
    fontFamily: Outfit
    fontSize: 14px
    fontWeight: '600'
  caption:
    fontFamily: Outfit
    fontSize: 12px
    fontWeight: '600'
    letterSpacing: 0.06em
rounded:
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  card-mobile: 1.5rem
  card-desktop: 3rem
  panel-inner: 1.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  card-padding-desktop: 2.5rem
  card-padding-mobile: 1rem
  panel-padding-x: 2rem
  panel-padding-y: 2.5rem
---

# PikolScore Tonal Authentication Design System

## 1. Design Intent & Philosophy

The PikolScore authentication experience delivers an elevated, tactile athletic aesthetic inspired by sunlit pickleball pavilions and modern architectural clubhouses. It strips away noisy borders, high-gloss gradients, and generic SaaS card kit defaults in favor of **tonal minimalism**: depth, structure, and hierarchy are established through organic tonal shifts—soft warm ivory on pale sage and vice versa.

### Key Tenets
1. **Tonal Separation Over Line Noise:** Cards, inputs, social buttons, and tab controls rely on tone (`#FEFEFB` Ivory on `#EAF0E5` Pale-Sage) rather than hard borders. The only borders/rings allowed are focused keyboard states (`focus-visible:outline` and `focus-within:ring-2`).
2. **Unified Dual-Mode Shell:** Sign In and Sign Up share a single layout shell (`AuthShell.jsx`), preventing visual drift between entry points.
3. **Natural Flow Without Overlap:** Logo, form controls, and toggle switches live in normal document flow. `my-auto` vertically centers the form safely without clipping content on shorter viewports.
4. **Authentic Sporting Heritage:** The right panel anchors an inline animated SVG court simulation (8-second continuous rally loop respecting `prefers-reduced-motion`) reflecting live match intensity.

---

## 2. Palette Architecture

| Token | Hex | Role & Usage |
|---|---|---|
| `deep-green` | `#203F39` | Full-page backdrop, body text, primary button hover state |
| `off-white` | `#FAF9F5` | Main app background, input and social-button fills |
| `ivory` | `#FEFEFB` | Player-facing panels, header, score flap cards |
| `pale-sage` | `#EAF0E5` | Left authentication panel, cards, illustration backgrounds |
| `teal` | `#0F5C62` | Court Green: Primary action button, active tab pill, links, focus rings |
| `dark-teal` | `#084B46` | Deep Teal: Headings, wordmark, input value text, attribution text |
| `forest-teal` | `#085953` | Primary hover, scoreboard team/server blocks |
| `cream` | `#FEECD6` | Supporting accent (replaces old yellow) |
| `muted` | `#748079` | Subtle text, placeholders, divider text |
| `line` | `#E2E5DC` | Borders and dividers |
| `sage` | `#8A9B82` | Testimonial quotation icon |
| `error` | `#BA1A1A` | Inline form validation and authentication failure text (`role="alert"`) |

---

## 3. Typography Hierarchy

The system strictly utilizes **Outfit** across all weights (`400`, `500`, `600`, `700`) loaded via `next/font/google`.

- **Brand Wordmark:** `Outfit`, 26px, weight 700, tracking `-0.01em`, color `#084B46`.
- **Form Heading (H1):** `Outfit`, 40px, line-height 48px, weight 700, tracking `-0.02em`, color `#084B46`. Left-aligned on the form column.
- **Form Subtitle:** `Outfit`, 16px, line-height 24px, weight 400, color `#203F39`.
  - Sign In: *"Welcome back! Please enter your details to continue"*
  - Sign Up: *"Register to score and manage matches"*
- **Field Labels:** `Outfit`, 14px, weight 600, color `#084B46`.
- **Input Text:** `Outfit`, 16px, weight 500, color `#084B46`. Placeholder color `#748079`.
- **Primary Button Text:** `Outfit`, 17px, weight 600, color `#FEECD6`.
- **Social Buttons & Toggle Pills:** `Outfit`, 15–16px, weight 600, color `#203F39`.
- **Showcase Quote:** `Outfit`, 28–30px, line-height 38–40px, weight 600, tracking `-0.01em`, color `#084B46`.
- **Attribution Text:** `Outfit`, 14–15px, weight 500–600, color `#203F39` on `#FEECD6` chip.

---

## 4. Layout & Responsive Geometry

### Desktop (>= 900px)
- **Viewport Frame:** Deep Green (`#203F39`) page container with `p-10` (40px) padding, `min-h-screen grid place-items-center`.
- **Card Container:**
  - Width: `w-[min(1360px,100%)]`
  - Height: `h-auto min-h-[min(820px,calc(100vh_-_80px))]`
  - Split: `grid-cols-2` (desktop 50/50 split, or `min-[1280px]:grid-cols-[640px_1fr]`)
  - Border Radius: `48px` (`rounded-[48px]`)
  - Overflow: `overflow-hidden`
  - Background: `#FEFEFB` (`bg-ivory`)
  - Elevation: Tonal contrast with zero drop shadow.

### Mobile & Tablet (< 900px)
- **Backdrop Padding:** Reduced to `16px` (`p-4`).
- **Card Structure:** Single column (`grid-cols-1`), radius reduced to `24px` (`rounded-[24px]`).
- **Right Showcase Panel:** Hidden (`hidden min-[900px]:block`).
- **Scrolling Behavior:** The card grows with the form; page body scrolls natively. **No internal scrollbar (`overflow-y-auto`) inside the card.**

---

## 5. Component Anatomy & DOM Order

### Left Panel (`LoginForm.jsx`)
- Container: `relative flex flex-col items-center bg-pale-sage px-8 pt-10 pb-10`
- **Logo Row:** Normal document flow (not absolute). `mb-6 ml-6 flex items-center gap-3 self-start`. Includes 40px teal rounded-rect with cream dot mark + wordmark.
- **Form Wrapper:** `my-auto flex w-full max-w-[400px] flex-col py-4`.
- **Sequential Flow:**
  1. **Segmented Mode Toggle:** `h-11 mb-6 grid grid-cols-2 gap-1 rounded-full bg-off-white p-1`
     - Active Tab: `rounded-full bg-teal text-off-white font-semibold text-[15px]`
     - Inactive Tab: `rounded-full bg-transparent text-deep-green hover:bg-pale-sage font-semibold text-[15px]`
  2. **H1 Title & Subtitle:** Left-aligned or centered, clear hierarchy.
  3. **Input Fields Container:** `flex flex-col gap-4`.
     - *Sign Up Only:* Full Name (`fullName`)
     - *Shared:* Email (`email`)
     - *Shared:* Password with `"Forgot password?"` link and eye toggle button
     - *Sign Up Only:* Confirm Password (`confirmPassword`)
  4. **Primary CTA Button:** 56px height, `rounded-full bg-teal text-cream shadow-[0_10px_24px_-10px_rgba(15,92,98,0.5)] hover:bg-forest-teal active:translate-y-[2px]`.
  5. **Text Divider:** Text only without horizontal line rules: `"or continue with"`.
  6. **Social Action Buttons:** Stacked `flex flex-col gap-3`, each 52px high, `rounded-full bg-off-white hover:bg-pale-sage`.
  7. **Footer Navigation Link:** `mt-6 text-center text-[15px] text-deep-green` with clickable text-teal link.

### Right Panel (`CourtPanel.jsx`)
- Container: `relative hidden overflow-hidden bg-ivory min-[900px]:block`.
- **Testimonial Block:** Padding `px-14 pt-16` (or `px-[72px] pt-[104px]`). Features sage quote mark, bold umpire quote, and cream attribution chip with teal dot.
- **Animated Court Surface:** Anchored directly to bottom edge (`absolute inset-x-0 bottom-[-6px]` or `-bottom-1.5`).
  - SVG dimensions: `viewBox="0 25 572 385"`, `w-full h-auto`.
  - CSS Keyframes: 8-second looping rally sequence animating ball squash, ball ground shadow, ball flight arc, net wobble, and dust impact tokens. Respects `prefers-reduced-motion: reduce`.

---

## 6. Accessibility & Autofill Rules

- **Autofill Tint Neutralization:**
  ```css
  @layer base {
    input:-webkit-autofill,
    input:-webkit-autofill:focus {
      -webkit-box-shadow: 0 0 0 1000px #FAF9F5 inset;
      -webkit-text-fill-color: #084B46;
      caret-color: #084B46;
    }
  }
  ```
- **Keyboard Navigation:** Every link and button enforces visible focus ring: `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal`.
- **Field Focus:** Input containers enforce `focus-within:ring-2 focus-within:ring-teal` without blurry halos.
- **Screen Reader Clarity:** Password visibility toggle carries `aria-pressed` and dynamic `aria-label` ("Show password" / "Hide password").
- **Error Live Regions:** Form validation alerts render directly under the failing field using `role="alert"` in `#BA1A1A` 14px text.
