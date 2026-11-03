---
title: Select menu
description: Picks from a long list by searching it. Nuxt UI's USelectMenu as the Endless Studios platform uses it.
source: Nuxt UI 4.8 USelectMenu, as the frontend uses it (Endless-Game-Making-Studio/studio 11517cbee); app.config doesn't change it.
docs: https://ui.nuxt.com/docs/components/select-menu
---

## When to use

Use a select menu when the list is long enough that people would rather type than scroll, and the value has to be one of the list: a cohort's time zone, a learner from a roster. It opens with a search box at the top. For a short list, a plain select is simpler; when people may also type a value of their own, use an input menu.

With `multiple`, people pick several values and the button shows them all.

## Accessibility

The search box filters as people type, and arrow keys move through the results. Like every control, the select menu needs a label from its form field.

## In Vue screens

Screens written as `.vue` files use `<USelectMenu v-model="…" :items="…">` directly, with the same props.
