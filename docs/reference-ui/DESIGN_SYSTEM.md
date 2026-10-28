# JeptahzRepo: Monochromatic Raw Luxury Design System

> **Strict Anti-Slop Specification & Visual Contract**  
> Form Follows Function. Elevated Restraint. Intellectual Precision.

---

## 1. Core Color Palette & CSS Variables

```css
:root {
  /* Canvas & Surfaces */
  --bg:            #F5F5F3; /* Warm gallery paper background */
  --bg-raised:     #FFFFFF; /* Pure white container surface */
  --bg-hover:      #ECECE8; /* Tactile interactive hover state */
  --bg-subtle:     #E6E6E1; /* Secondary active indicators */

  /* Text & Foreground */
  --fg:            #0A0A0A; /* Deep architectural ink */
  --fg-muted:      #55554F; /* Secondary prose, excerpt descriptions */
  --fg-subtle:     #6E6E68; /* Tertiary metadata, tags, timestamps */

  /* Structural Hairlines & Borders */
  --border:        rgba(10, 10, 10, 0.14); /* 1px hairline panel boundary */
  --border-strong: rgba(10, 10, 10, 0.32); /* Focused or active border */

  /* Accent & Monochromatic Hits */
  --accent:        #0A0A0A; /* Monochromatic focal punch */
  --accent-dim:    rgba(10, 10, 10, 0.06); /* Pill / badge background */
}
```

---

## 2. Typography Hierarchy

| Style Role | Font Family | Size / Tracking | Usage |
| :--- | :--- | :--- | :--- |
| **Hero Display** | Space Grotesk / Geist Sans | `text-4xl md:text-5xl font-medium tracking-tight` | Intro welcome headline, app titles |
| **Section Headings**| Space Grotesk / Geist Sans | `text-xl md:text-2xl font-medium tracking-tight` | Hub section headers, tab titles |
| **Article Prose** | Geist Sans / System Serif | `text-base leading-relaxed text-fg-muted` | Documentation, course notes, devlogs |
| **Micro Labels** | Geist Mono / JetBrains Mono | `text-[11px] font-mono uppercase tracking-[0.18em]` | Sidebar category labels, status indicators |
| **Technical Data**| Geist Mono / JetBrains Mono | `text-xs font-mono text-fg-subtle` | File sizes, versions (`v1.0.0`), timestamps, tags |

---

## 3. Strict Anti-Slop Rules

1. **NO Neon Gradients:** Disallowed: purple-to-blue neon washes, cyan highlights, or gamer aesthetic glows.
2. **NO Bubble Radii:** Rounded corners are restricted to `rounded-[2px]` or `rounded-[4px]`. Large `rounded-3xl` or bubbly pill cards are strictly forbidden.
3. **NO Generic 3-Card Columns:** Content is arranged in architectural grids, linear editorial indexes, or split-panel preview layouts.
4. **NO Inert Illustrations:** No cartoon developer vectors, generic 3D floating spheres, or AI sparkle badges.
5. **Hairline Structural Grids:** Panels and sections are delineated by clean `1px solid var(--border)` divisions.

---

## 4. Animation Contract: "Botanical Kinetic Drift"

The ambient animation on `/` embodies tranquility and focus:
* **Frame Rate:** Hard-capped at 60fps via `requestAnimationFrame` on a 2D HTML5 `<canvas>`.
* **Physics Model:**
  * Particles represent delicate monochrome botanical leaves and seed silhouettes.
  * Constant gentle downward gravity combined with lateral sinusoidal sway (`sin(time)`).
  * Smooth mouse cursor draft reaction: nearby leaves softly deflect away from the cursor path.
* **Portal Transition:** Clicking **"Visit Community"** activates a subtle opacity and scale dissipation, smoothly routing into `/home` without layout jumps.

---

## 5. UI State Coverage Standard

Every interface in JeptahzRepo implements three mandatory states:

1. **Loading Skeletons (`<Skeleton />`):**
   * Monochromatic pulse shimmer with a subtle `rgba(10,10,10,0.04)` to `rgba(10,10,10,0.08)` gradient.
   * Matches the exact geometric silhouette of the final rendered card or table row.
2. **Empty States (`<EmptyState />`):**
   * Monospace subtitle, crisp 1px stroke icon, and clear instructional copy explaining how to populate data.
3. **Error Boundaries (`<ErrorState />`):**
   * High-contrast monochrome alert banner with reload trigger and failure explanation.
