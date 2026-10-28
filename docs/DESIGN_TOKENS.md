# HOPE Group4 Design Tokens & Styling Contract

> **Visual Specification Extracted from Reference Site ([JeptahzRepo](https://jeptahzrepo.vercel.app/home))**  
> Adapted for HOPE Group4 Daily Sales & Collections Monitoring Business Application.

---

## 1. Color Palette & CSS Custom Properties

The palette adopts the **Monochromatic Raw Luxury / Editorial Broadsheet** aesthetic: warm tactile gallery parchment paper (`#F4F4F0`) grounded by deep architectural midnight cyan ink (`#041a24`).

```css
:root {
  /* Canvas & Surfaces */
  --bg:            #F4F4F0; /* Warm gallery paper background */
  --bg-raised:     #FFFFFF; /* Pure white container surface for cards, tables, dialogs */
  --bg-hover:      #EAEAE4; /* Tactile interactive hover state */
  --bg-subtle:     #DFDFD7; /* Inset dividers, table headers, hairline lines */

  /* Text & Foreground Ink */
  --fg:            #041a24; /* Deep architectural midnight cyan (Primary Ink) */
  --fg-muted:      #1c313b; /* Secondary reading text, descriptions (WCAG AA compliant) */
  --fg-subtle:     #41555f; /* Tertiary metadata, tags, timestamps, captions */

  /* Structural Hairlines & Borders */
  --border:        rgba(4, 26, 36, 0.16); /* 1px hairline boundary */
  --border-strong: #041a24;              /* Focused or active border */
  --border-hover:  #041a24;              /* Hover border state */

  /* Monochromatic Accent */
  --accent:        #041a24;              /* Core brand accent tone */
  --accent-dim:    rgba(4, 26, 36, 0.05);/* Subtle badge/pill background */

  /* Business Application Status Tokens (Adapted for Sales & Collections) */
  --status-paid-bg:        #EAF3EC;
  --status-paid-text:      #1c4d29;
  --status-paid-border:    rgba(28, 77, 41, 0.30);

  --status-partial-bg:     #FDF4E7;
  --status-partial-text:   #824f11;
  --status-partial-border: rgba(130, 79, 17, 0.30);

  --status-overdue-bg:     #FCECEC;
  --status-overdue-text:   #862525;
  --status-overdue-border: rgba(134, 37, 37, 0.30);

  --status-unpaid-bg:      #F1F3F5;
  --status-unpaid-text:    #495057;
  --status-unpaid-border:  rgba(73, 80, 87, 0.25);
}
```

---

## 2. Typography Hierarchy

The system establishes a clear tripartite typographic structure:

| Element | Typeface | Size & Weight | Role & Application |
| :--- | :--- | :--- | :--- |
| **Page Title** | Newsreader (`--font-editorial`) | `text-2xl sm:text-3xl font-normal tracking-tight text-[#041a24]` | Used strictly for main page titles (Dashboard, Sales, Payments, etc.) |
| **Section & Card Headings** | Geist Sans / Inter (`--font-sans`) | `text-base font-semibold text-[#041a24] tracking-tight` | KPI titles, card titles, table headings, modal titles |
| **Body & Descriptions** | Geist Sans / Inter (`--font-sans`) | `text-xs sm:text-sm text-[#1c313b] leading-normal` | Page subtitles, card descriptions, table cell text |
| **Numbers & Currency** | Geist Sans / Inter (`--font-sans`) | `font-semibold tabular-nums tracking-tight` | Peso amounts (`₱8,495.00`), quantities, balances |
| **Technical Metadata** | Geist Mono / JetBrains Mono (`--font-mono`) | `text-[10px] sm:text-xs font-mono text-[#41555f]` | Product codes (`CPU-R5-5600`), Sale `#5001`, `OR #9001`, timestamps |
| **Status Badges & Pills** | Geist Mono / JetBrains Mono (`--font-mono`) | `text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.14em]` | Paid, Partial, Unpaid, Overdue status pills |

---

## 3. Spacing, Radius, Border & Shadow Scales

- **Spacing Scale:** Strict 8px modular scale (`space-y-4` = 16px, `space-y-6` = 24px, `p-4` = 16px, `p-5` = 20px, `p-6` = 24px).
- **Corner Radius Scale:**
  - Micro / Badges / Pills: `rounded-[2px]` (0.125rem).
  - Cards / Tables / Inputs: `rounded-[4px]` (0.25rem).
  - Buttons / Modals: `rounded-[6px]` (0.375rem).
  - Disallowed: Large bubble pill cards or `rounded-3xl` radii.
- **Borders & Dividers:**
  - Standard container boundary: `1px solid var(--border)` (`rgba(4, 26, 36, 0.16)`).
  - Active / hover boundary: `1px solid var(--border-strong)` (`#041a24`).
  - Broadsheet section rule: `.broadsheet-rule` (`border-top: 2px solid var(--fg)`).
  - Thin metadata divider: `.broadsheet-rule-thin` (`border-top: 1px solid var(--border)`).
- **Shadow Scale:**
  - Flat architectural minimalism.
  - Cards: `shadow-none` or subtle `shadow-[0_1px_2px_rgba(4,26,36,0.04)]`.
  - Dropdowns & Modals: `shadow-[0_4px_20px_rgba(4,26,36,0.08)]`.
  - Disallowed: Colored glowing dropshadows or neon fuzz.

---

## 4. Component Design Patterns

### A. Buttons (`src/components/ui/Button.tsx`)
- **Dimensions:** Standard height 40px (`h-10 px-5 text-xs`), small 32px (`h-8 px-3 text-[11px]`).
- **Radius:** `rounded-[6px]`.
- **Variants:**
  - **Primary (`variant="primary"`):** Solid brand `#041a24`, text `#F4F4F0`, hover `#082a38`, active scale `active:scale-[0.99]`.
  - **Outline (`variant="outline"`):** Transparent background, border `1px solid var(--border)`, text `#041a24`, hover `bg-[#EAEAE4] hover:border-[#041a24]`.
  - **Ghost (`variant="ghost"`):** Transparent background, text `#041a24`, hover `bg-[#EAEAE4]`.
  - **Destructive (`variant="destructive"`):** Solid crimson `#862525`, text `#FFFFFF`, hover `#6c1b1b`.
- **States:** Focus ring `focus-visible:ring-1 focus-visible:ring-[#041a24] focus-visible:ring-offset-1`, disabled `opacity-40 cursor-not-allowed`.

### B. Status Badges & Pills (`src/components/ui/Badge.tsx`)
- **Structure:** `inline-flex items-center px-2 py-0.5 text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.14em] rounded-[2px] border`.
- **Semantics:**
  - `PAID`: `bg-[#EAF3EC] text-[#1c4d29] border-[#1c4d29]/30`
  - `PARTIAL`: `bg-[#FDF4E7] text-[#824f11] border-[#824f11]/30`
  - `OVERDUE`: `bg-[#FCECEC] text-[#862525] border-[#862525]/30`
  - `UNPAID`: `bg-[#F1F3F5] text-[#495057] border-[#495057]/30`

### C. Cards & Metric Containers (`src/components/ui/Card.tsx`)
- **Structure:** `bg-white rounded-[4px] border border-[rgba(4,26,36,0.16)] shadow-[0_1px_2px_rgba(4,26,36,0.04)] hover:border-[#041a24] transition-colors`.
- **Header:** `px-5 pt-4 pb-2 border-b border-[rgba(4,26,36,0.08)]`.
- **Content:** `p-5`.

### D. Form Inputs
- **Structure:** `h-10 px-3 bg-white text-xs font-sans text-[#041a24] border border-[rgba(4,26,36,0.2)] rounded-[4px] placeholder-[rgba(4,26,36,0.4)] focus:border-[#041a24] focus:ring-1 focus:ring-[#041a24] outline-none`.

### E. Tables
- **Header Row:** `bg-[#F8F8F6] border-b border-[rgba(4,26,36,0.14)] py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-[rgba(4,26,36,0.7)]`.
- **Body Rows:** `border-b border-[rgba(4,26,36,0.08)] py-3 px-4 text-xs font-sans text-[#041a24] hover:bg-[#F8F8F6] transition-colors`.
- **Numeric Columns:** `text-right tabular-nums font-medium`.

---

## 5. Header Search (`Cmd+K` / `Ctrl+K`) & Sidebar Behavior

- **Top Bar Search:**
  - Clean tactile search box in top bar (`h-10 pl-9 pr-9 bg-white border border-[rgba(4,26,36,0.18)] rounded-[6px] hover:border-[#041a24] focus:border-[#041a24]`).
  - Displays `⌘K` or `Ctrl+K` keyboard hint.
  - Dropdown results popover matches reference command palette:
    - Categorized into Customers, Sales, and Products.
    - Arrow navigation and enter to select.
- **Sidebar / Side Panel:**
  - Surface: Crisp white `bg-white` (`#FFFFFF`) with hairline right boundary `border-r border-neutral-200/80` (matching reference desktop side panel).
  - Brand headline: `HOPE Group4` in `font-editorial italic text-[24px] text-black font-normal tracking-tight`.
  - Subtitle: `Sales & Collections` in `font-mono text-[10px] tracking-widest text-neutral-400 uppercase mt-1`.
  - Masthead divider: `border-b border-neutral-100 pb-4`.
  - Quick Search Trigger: `mt-4 w-full border border-neutral-200/80 bg-neutral-50/70 hover:bg-white hover:border-[#041a24] px-3 py-1.5 text-[13px] text-neutral-500 hover:text-black rounded-[6px]`.
  - Active nav item: `font-bold text-black py-2 px-1 text-[14px] font-sans`.
  - Non-active nav item: `text-neutral-600 hover:text-black font-medium py-2 px-1 text-[14px] font-sans transition-colors`.
  - Bottom touchpoint: User profile banner with clean circular avatar ring, `font-editorial italic text-[15px]` staff name, clean role tag, and sentence-case `Sign out` action.

---

## 6. Light and Dark Mode Handling

- **Reference Analysis:** The live reference site `https://jeptahzrepo.vercel.app/home` is exclusively and deliberately light mode (warm parchment `#F4F4F0` canvas with white raised cards and `#041a24` ink).
- **Rule Alignment:** "Offer dark mode only if the reference has it."
- **Execution:** HOPE Group4 is strictly light mode, using high-contrast paper and midnight ink to eliminate eye strain and maximize rapid scanning for operational accounting and sales staff.
