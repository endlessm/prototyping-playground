---
title: Card
description: Groups related content on a white surface. Nuxt UI's UCard with the Endless Studios card variants, the same card the platform uses.
source: Nuxt UI 4.8 UCard with the frontend's app.config card settings (Endless-Game-Making-Studio/studio 11517cbee).
docs: https://ui.nuxt.com/docs/components/card
---

## When to use

Use a card to hold one piece of content on the page: a list, a form, a summary. Depth comes from white cards on the muted page, so most content sits in one.

Pick the variant by how the card relates to its surroundings:

- **Outline**, the default: Nuxt UI's own outline, a white card with a hairline ring.
- **Shaded**: no ring and a soft wide shadow, as the app's own outline card looks. For content on the page background; choose it per card.
- **Bordered**: a hairline border and no shadow. For cards in a row or a grid, where shadows would pile up.
- **Soft**: an inset panel on `bg-elevated` with tight padding, for grouping inside another card.
- **Ghost** and **flat**: no border or shadow, for purely structural grouping.
- **Subtle** and **solid** are Nuxt UI's own variants; the platform rarely uses them.

Cards are rounder than controls (1rem). Size them with padding, not fixed heights.

## Parts

A card has an optional header, a body and an optional footer, separated by dividers. `title` and `description` fill a simple header; pass `header` for anything else. The `ui` prop adds classes to a part, such as `ui={{ body: 'p-0 sm:p-0' }}` for a list that runs edge to edge.

Content inside a card renders in the app's own styles, so its classes use the app's vocabulary (`text-muted`, `text-highlighted`, `bg-elevated`).

## In Vue screens

Screens written as `.vue` files use `<UCard>` directly, with `#header`, the default slot and `#footer`.
