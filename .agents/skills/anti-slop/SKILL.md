---
name: anti-slop
description: Stop coding agents from shipping generic UI. Build product-specific interfaces, define design contracts, cover required states, and run a hard finish gate.
---

# Anti-Slop Specification & Visual Contract

## Core Rules
1. No purple or blue-pink gradients, glassmorphism, glowing shadows, decorative blobs, or emoji used as icons. Use lucide-react icons.
2. No lorem ipsum, fake stats or filler text. Every number comes from the database.
3. One sans-serif typeface for UI chrome, forms, buttons, and navigation (or Newsreader serif reserved exclusively for page titles).
4. One accent color plus neutral grays. Red only for overdue or danger, green only for paid or positive change, amber for partial, gray for unpaid.
5. 8px spacing scale, geometric corner radius (rounded-[2px] / rounded-[4px] or 6px-8px max), tabular numbers for peso amounts.
6. Every element must earn its place: if it doesn't help a user decide or act, remove it.
7. Text at least 13px, WCAG AA contrast, visible keyboard focus states.
8. Include loading skeletons, empty states and error states.
