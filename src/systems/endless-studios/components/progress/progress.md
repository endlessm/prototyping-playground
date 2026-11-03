---
title: Progress
description: A bar that shows how far along something is, or a score out of a total. Nuxt UI's UProgress as the Endless Studios platform uses it.
source: Nuxt UI 4.8 UProgress, as the frontend uses it (Endless-Game-Making-Studio/studio 11517cbee); app.config doesn't change it.
docs: https://ui.nuxt.com/docs/components/progress
---

## When to use

Use a progress bar to show a share of a whole at a glance: how much of a program has passed, a cohort's quiz score, how many learners a report covers. The leader dashboards draw these bars in `secondary` (cornflower), mostly at `size="sm"`.

- Always write the number beside the bar ("81%", "12 of 20 weeks"). The bar is a picture of the number, so the app hides it from screen readers with `aria-hidden="true"`.
- A score bar can take the colour of its performance band through `:ui="{ indicator: '…' }"`, as the cohort overview does.
- Without a value, the bar moves on its own, for work whose length isn't known yet.

## Accessibility

If the bar is the only place the number appears, leave it visible to screen readers and give it an `aria-label`. If the number is written next to it, hide the bar with `aria-hidden`.

## In Vue screens

Screens written as `.vue` files use `<UProgress :model-value="…">` directly.
