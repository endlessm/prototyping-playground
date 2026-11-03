---
title: Badge
description: Labels a status, a count or a category. Nuxt UI's UBadge with the Endless Studios secondary soft colours, the same badge the platform uses.
source: Nuxt UI 4.8 UBadge with the frontend's app.config badge settings (Endless-Game-Making-Studio/studio 11517cbee).
docs: https://ui.nuxt.com/docs/components/badge
---

## When to use

Use a badge for a short, read-only label next to the thing it describes: a cohort's status, a pull request's state, a "New" marker on a table row, a count in the sidebar. A badge isn't clickable; for an action, use a button.

Most of the platform's badges are **soft**, coloured by meaning: success for active, info for upcoming or new, warning for something waiting on someone, error for closed or failed, neutral for everything else. Outline and solid are for the few places that need more weight, such as the sidebar's notification count and the live stream marker.

## Studios variants

- **Secondary soft** uses the lighter cornflower tint (`cornflower-50`) with `cornflower-700` text, a calmer pairing than Nuxt UI's default.

## Accessibility

Don't rely on colour alone: the label has to say the status. An icon-only badge needs text nearby or an `aria-label`.

## In Vue screens

Screens written as `.vue` files use `<UBadge>` directly, with the same props.
