---
title: Tabs
description: Switches between views of the same content without leaving the page. Nuxt UI's UTabs as the Endless Studios platform uses it.
source: Nuxt UI 4.8 UTabs, as the frontend uses it (Endless-Game-Making-Studio/studio 11517cbee); app.config doesn't change it.
docs: https://ui.nuxt.com/docs/components/tabs
---

## When to use

Use tabs to switch between views of the same data without changing the address: the analytics chart's Daily and Monthly granularity, a small pill switcher above the chart (`size="sm"`, `class="w-48"`). When each choice is its own page that people may share or go back to, use a navigation menu instead, as the profile and dashboard sections do.

- **Pill**, the default, is a segmented control, right for two to four short options.
- **Link** is an underlined row, for sections of content inside a card.
- With `:content="false"` the tabs only switch the value; render what changes yourself, as the analytics chart does.

## Accessibility

Arrow keys move between tabs and Tab moves into the panel. Keep labels short and parallel ("Daily", "Monthly").

## In Vue screens

Screens written as `.vue` files use `<UTabs v-model="…" :items="…">` directly.
