---
title: Navigation menu
description: A row or column of links between the sections of an area. Nuxt UI's UNavigationMenu with the Endless Studios pill tabs, the same menu the platform uses.
source: Nuxt UI 4.8 UNavigationMenu with the frontend's app.config navigationMenu settings (Endless-Game-Making-Studio/studio 11517cbee).
docs: https://ui.nuxt.com/docs/components/navigation-menu
---

## When to use

Use a navigation menu for links that move between pages of one area: the tabs of a profile (Overview, Skills, Certificates, Games), the sections of a leader's analytics, the sidebar's groups. Each item goes to its own address, so the page can be shared and the browser's back button works.

To switch views inside one page without changing the address, use tabs instead. For a list of actions, use a dropdown menu.

- **Neutral pill** is the platform's page tabs, under a page header.
- **Neutral link** with `highlight` is the leader dashboard's tabs, with a line under the active one.
- **Vertical link** is the sidebar's menu. For the whole sidebar, use the app's own (the Studio sidebar component).

## Studios variants

- **Neutral pill**: inactive links are muted text with no background, even on hover; the active link is a dark pill (`bg-inverted`) with light text. Links have no underline and no transition.

## Active link

A link is active when its `to` matches the current address. Screens here don't change address, so set `active: true` on the item a state should show as current.

## In Vue screens

Screens written as `.vue` files use `<UNavigationMenu>` directly, with `:items`. The app adds `:ui="{ link: 'no-underline' }"` to pills.
