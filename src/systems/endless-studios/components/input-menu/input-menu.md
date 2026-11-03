---
title: Input menu
description: An input that suggests values from a list as people type. Nuxt UI's UInputMenu as the Endless Studios platform uses it.
source: Nuxt UI 4.8 UInputMenu, as the frontend uses it (Endless-Game-Making-Studio/studio 11517cbee); app.config doesn't change it.
docs: https://ui.nuxt.com/docs/components/input-menu
---

## When to use

Use an input menu when people type to find a value in a long list and the field should look and feel like an input: the event form's time zone, with `America/New_York` as its placeholder. Typing filters the suggestions; picking one fills the input.

When the field should look like a button that opens a list, use a select menu. With `multiple`, chosen values show as tags inside the input, which suits tags and skills.

## Accessibility

Arrow keys move through the suggestions and Enter picks one. Like every control, the input menu needs a label from its form field.

## In Vue screens

Screens written as `.vue` files use `<UInputMenu v-model="…" :items="…">` directly, with the same props.
