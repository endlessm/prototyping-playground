---
title: Tooltip
description: A short label that shows on hover or focus. Nuxt UI's UTooltip as the Endless Studios platform uses it.
source: Nuxt UI 4.8 UTooltip, as the frontend uses it (Endless-Game-Making-Studio/studio 11517cbee); app.config doesn't change it.
docs: https://ui.nuxt.com/docs/components/tooltip
---

## When to use

Use a tooltip to name an icon-only button ("Delete this comment", "Link" in the editor's toolbar) or to explain why something can't be used yet. Keep it to a few words. Anything people need to read to do the task belongs on the page, because a tooltip never shows on touch screens.

The platform opens most tooltips above the element (`:content="{ side: 'top' }"`). Tooltips that explain a restriction, such as a feature a partner account can't use, open at once (`:delay-duration="0"`) and are `disabled` when there's nothing to explain.

## Accessibility

The tooltip doesn't replace a name: an icon-only button still needs its own `aria-label`. A disabled button can't be hovered or focused, so a tooltip on it never shows. Leave it enabled and explain in the tooltip, as the app's restricted buttons do, or wrap it in a focusable element.

## In Vue screens

Screens written as `.vue` files use `<UTooltip text="…">` directly around the element.
