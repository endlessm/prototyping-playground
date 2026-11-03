---
title: Popover
description: A small floating panel anchored to an element, for content richer than a tooltip. Nuxt UI's UPopover as the Endless Studios platform uses it.
source: Nuxt UI 4.8 UPopover, as the frontend uses it (Endless-Game-Making-Studio/studio 11517cbee); app.config doesn't change it.
docs: https://ui.nuxt.com/docs/components/popover
---

## When to use

Use a popover for a small panel tied to one element, which people open, use and close without leaving the page: the sidebar's notifications, the date range picker's calendar, the editor's link box, the breakdown behind an XP badge. Put the panel in `#content`.

- **Click**, the default, suits panels people work in: a calendar, a form field.
- **Hover** (`mode="hover"`) suits read-only detail, such as which skills an XP total came from. It also opens on keyboard focus.

For one line of text, use a tooltip. For a list of actions, a dropdown menu. For a task with several fields, a modal.

## Accessibility

A click popover moves focus into its panel and returns it on close; Escape closes it. Hover popovers must hold nothing people need to act on, because touch screens and some people never see them.

## In these examples

Each example keeps room for its panel. Press or hover the element to open it.

## In Vue screens

Screens written as `.vue` files use `<UPopover>` directly around the element, with the panel in `#content`.
