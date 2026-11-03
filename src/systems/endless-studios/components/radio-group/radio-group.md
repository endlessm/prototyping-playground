---
title: Radio group
description: Picks exactly one of a few options shown side by side. Nuxt UI's URadioGroup as the Endless Studios platform uses it.
source: Nuxt UI 4.8 URadioGroup, as the frontend uses it (Endless-Game-Making-Studio/studio 11517cbee); app.config doesn't change it.
docs: https://ui.nuxt.com/docs/components/radio-group
---

## When to use

Use a radio group when people choose one of two to five options and it helps to see them all at once: a quiz question's answers, a profile cover. For a longer list, use a select. For a setting that is simply on or off, use a switch.

Give the group a `legend` that asks the question; the quiz uses the question number and prompt. Options are `{ label, value }` objects, with an optional `description`.

- **List**, the default, is a plain column of options.
- **Card** makes each option a bordered box, easier to tap and to scan.
- For options that are pictures, such as profile covers, hide the dot with `indicator="hidden"` and draw each option in the `#label` slot, as the cover picker does with `color="neutral"`.

## Accessibility

Arrow keys move between options and choose them; Tab moves out of the group. The legend names the group for screen readers, so it has to make sense alone.

## In Vue screens

Screens written as `.vue` files use `<URadioGroup v-model="…" :items="…">` directly, with the same props.
