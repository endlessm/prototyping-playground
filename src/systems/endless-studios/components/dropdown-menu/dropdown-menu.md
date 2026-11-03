---
title: Dropdown menu
description: A list of actions behind a button, such as a row's "More" menu. Nuxt UI's UDropdownMenu as the Endless Studios platform uses it.
source: Nuxt UI 4.8 UDropdownMenu, as the frontend uses it (Endless-Game-Making-Studio/studio 11517cbee); app.config doesn't change it.
docs: https://ui.nuxt.com/docs/components/dropdown-menu
---

## When to use

Use a dropdown menu for secondary actions that don't each deserve a button: a post's, a list row's or a page header's Edit, Duplicate and Delete. The platform opens it from a neutral ghost button with `i-lucide-ellipsis`, aligned to the button's end (`:content="{ align: 'end' }"`) so it opens toward the page. The sidebar's account menu is one too, opening upward from the profile.

- Order actions by how often they're used, with destructive ones last, in their own group and `color: 'error'`.
- An action that opens a page takes `to`; one that runs code takes `onSelect`.
- For links between the sections of an area, use a navigation menu. For choosing a value, use a select.

In a list, the last rows open their menu upward (`side: 'top'`) so it doesn't fall off the page.

## Accessibility

The ellipsis button needs an `aria-label` that names what the menu is for ("More actions for Lantern Keeper"). Arrow keys move through the actions, Enter runs one, and Escape closes the menu.

## In these examples

Each example keeps room for its menu. Press the button to open it.

## In Vue screens

Screens written as `.vue` files use `<UDropdownMenu :items="…">` directly around the button.
