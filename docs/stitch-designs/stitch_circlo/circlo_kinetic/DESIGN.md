# Design System Strategy: Kinetic Fluidity

## 1. Overview & Creative North Star
**The Creative North Star: "The Kinetic Pulse"**
This design system moves away from static, boxy layouts toward a "Kinetic Pulse"—a design language that feels perpetually in motion, even when still. It is an editorial take on athletic social platforms, blending the high-energy vibration of performance sports with the sophisticated transparency of luxury digital interfaces.

To break the "template" look, we utilize **Intentional Asymmetry**. Key elements—like hero typography or signature cards—should bleed off the screen edge or overlap across surface layers. This creates a sense of depth and momentum, suggesting the content is part of a larger, living ecosystem rather than a series of isolated screens.

---

## 2. Colors & Surface Logic
The palette is rooted in a deep, nocturnal Navy (`surface: #111125`), allowing the Teal (`primary: #46f1c5`) and Orange (`secondary: #ffb59a`) to act as high-vis light sources.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through:
- **Background Color Shifts:** E.g., placing a `surface-container-low` card on a `surface` background.
- **Tonal Transitions:** Utilizing the signature 135° Teal-to-Orange gradient to lead the eye between sections.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-translucent materials. 
- **The Base:** `surface-dim` (#111125).
- **The Content Layer:** `surface-container` (#1e1e32).
- **The Action Layer:** `surface-container-high` (#28283d).
By nesting a `surface-container-highest` element inside a `surface-container`, you create a "soft lift" that feels architectural rather than programmed.

### The "Glass & Gradient" Rule
To achieve the "Athletic Premium" vibe, use glassmorphism for all floating elements. 
- **Dark Mode Glass:** `rgba(255, 255, 255, 0.08)` with a 20px backdrop blur.
- **CTA Signature:** Main actions should never be flat. Apply the 135° gradient (`#00D4AA` to `#FF6B2C`) to provide a "visual soul" that vibrates against the deep navy background.

---

## 3. Typography
The typography system is built on a high-contrast scale to mimic premium sports editorials.

*   **Display (Satoshi/Inter Tight, 700-900 Weight):** Use `display-lg` (3.5rem) and `display-md` (2.75rem) for hero stats and motivational headers. The tight tracking and heavy weight convey authority.
*   **Headlines & Titles (Inter Tight, 600-700 Weight):** Used for section headers (`headline-sm` 1.5rem). 
*   **Body (Inter, 400 Weight):** Optimized for readability in social feeds. Use `body-md` (0.875rem) as the standard.
*   **Labels (Inter, 500-600 Weight):** All-caps for metadata to create a "technical" athletic feel.

The hierarchy is driven by **Size Extremity**: A massive `display-lg` stat sitting directly next to a tiny `label-sm` unit creates a professional, intentional tension.

---

## 4. Elevation & Depth

### The Layering Principle
Forget shadows; think in **Tonal Layering**. Use the `surface-container` tiers to stack information.
- **Tier 0:** `surface-container-lowest` (#0c0c1f) for the deep background.
- **Tier 1:** `surface-container-low` (#1a1a2e) for the primary feed area.
- **Tier 2:** `surface-container-highest` (#333348) for interactive cards.

### Ambient Shadows
When an element must "float" (like a FAB or the Pill-style Tab Bar), use an **Ambient Glow** instead of a shadow.
- **Shadow Token:** Blur: 40px, Spread: 0, Opacity: 8%.
- **Color:** Use `surface-tint` (#28dfb5) rather than black to simulate light reflecting off a high-performance surface.

### The "Ghost Border" Fallback
If accessibility requires a container edge, use a **Ghost Border**: `outline-variant` (#3b4a44) at 15% opacity. Never use 100% opaque lines.

---

## 5. Components

### The Floating Tab Bar
The signature navigation is a pill-style bar floating 24px from the bottom.
- **Style:** Glassmorphism (`rgba(255,255,255,0.08)`) + 32px backdrop blur.
- **Radius:** `rounded-full` (9999px).
- **Interaction:** Active state uses a subtle teal glow underline.

### Buttons
- **Primary:** Gradient-fill (Teal to Orange), `rounded-md` (1.5rem), white text for high contrast.
- **Secondary:** Glass-fill with a `Ghost Border`, `rounded-md`.
- **Athletic Chip:** `rounded-full`, `surface-container-highest` background, used for sport categories or social tags.

### Cards & Lists
**Strict Rule:** No dividers. Separate list items using 12px or 16px of vertical whitespace. 
- **The "Dynamic Card":** Cards should use a 28px corner radius (`rounded-lg`) to feel friendly yet modern. In social feeds, the card background should be `surface-container`, with nested content sitting on `surface-bright` for highlights.

### Input Fields
- **State:** Instead of a border-color change, the "Active" state should trigger a subtle increase in the backdrop blur and a tiny `primary` (Teal) glow in the corner of the field.

---

## 6. Do's and Don'ts

### Do
- **Do** use overlapping elements. A user's profile picture can slightly overlap the header background to create depth.
- **Do** lean into the "Off-white" (#FAFAFA) for primary body text on dark backgrounds to reduce eye strain while maintaining high "premium" contrast.
- **Do** use the `rounded-xl` (3rem) radius for large hero sections to create a "container-less" feel.

### Don't
- **Don't** use standard Material Design "Drop Shadows." They feel dated and "out-of-the-box."
- **Don't** use pure black (#000000). Use the Navy `surface` tokens to maintain the athletic, moody vibe.
- **Don't** use sharp 90-degree corners. Everything in this system is "kinetic," meaning edges are softened as if shaped by movement.
- **Don't** use centered text for long-form content. Keep it left-aligned to maintain the editorial "grid" feel.