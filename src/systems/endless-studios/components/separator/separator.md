---
title: Separator
description: A thin line between groups of content, optionally with a label or a button in it. Nuxt UI's USeparator as the Endless Studios platform uses it.
source: Nuxt UI 4.8 USeparator, as the frontend uses it (Endless-Game-Making-Studio/studio 11517cbee); app.config doesn't change it.
docs: https://ui.nuxt.com/docs/components/separator
---

## When to use

Use a separator where spacing alone doesn't show that one group ends and another begins: under a page header, above the footer's legal line, between groups of toolbar buttons. Most grouping on the platform comes from cards and spacing, so reach for a line only when those aren't enough.

- Space it with margin classes (`mt-6`, `my-4`); it has none of its own.
- Put a button in its default slot for "Show more" at the end of a list, as the infinite lists do.
- A **vertical** separator divides buttons in a row, such as the rich text editor's toolbar; give it a height (`h-6`).

## Accessibility

A separator between sections is announced as one. Make a purely visual line `decorative`, so screen readers skip it.

## In Vue screens

Screens written as `.vue` files use `<USeparator>` directly.
