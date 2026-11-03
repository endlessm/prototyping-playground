---
title: Chip
description: A small dot on the corner of an icon or avatar that flags something new. Nuxt UI's UChip as the Endless Studios platform uses it.
source: Nuxt UI 4.8 UChip, as the frontend uses it (Endless-Game-Making-Studio/studio 11517cbee); app.config doesn't change it.
docs: https://ui.nuxt.com/docs/components/chip
---

## When to use

Use a chip to flag that something needs a look: unread notifications on the top bar's bell, an unseen notification in the list. Wrap the element it marks and bind `show` to the condition, so the dot disappears once there's nothing new.

- The bell's dot is `primary` at the `top-left`.
- An unseen notification has a `standalone` dot next to its title.
- A notification's avatar carries its type as an icon in the chip's `#content` slot, with `:ui="{ base: 'bg-transparent ring-0' }"`.

To show a count or a status in words, use a badge. A chip says only "there's something here".

## Accessibility

A dot is invisible to screen readers. Say the same thing in the marked element's label, such as "Notifications, 3 unread".

## In Vue screens

Screens written as `.vue` files use `<UChip>` directly around the element.
