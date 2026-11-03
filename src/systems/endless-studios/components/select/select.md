---
title: Select
description: Picks one value from a short, known list. Nuxt UI's USelect as the Endless Studios platform uses it.
source: Nuxt UI 4.8 USelect, as the frontend uses it (Endless-Game-Making-Studio/studio 11517cbee); app.config doesn't change it.
docs: https://ui.nuxt.com/docs/components/select
---

## When to use

Use a select to choose one value from a list short enough to scan: a cohort's institution or status, the program or view a leader dashboard shows. Give `items` as `{ label, value }` objects so the label can change without changing what's saved.

When the list is long enough that people would rather search it, such as time zones, use a select menu. With two to five options that are worth seeing side by side, use a radio group.

In forms, put the select inside a form field and fill it with `class="w-full"`. The leader dashboard's compact filters use `size="xs"`.

## Accessibility

Like every control, a select needs a label, from its form field or an `aria-label`. Don't change the page the moment someone picks a value inside a form: let them submit.

## In Vue screens

Screens written as `.vue` files use `<USelect v-model="…" :items="…">` directly, with the same props.
