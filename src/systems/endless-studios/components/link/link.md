---
title: Link
description: Goes to another page, with active and inactive states. Nuxt UI's ULink as the Endless Studios platform uses it.
source: Nuxt UI 4.8 ULink, as the frontend uses it (Endless-Game-Making-Studio/studio 11517cbee); app.config doesn't change it.
docs: https://ui.nuxt.com/docs/components/link
---

## When to use

Use a link to go somewhere: another page in the app, or a page elsewhere. It renders a `NuxtLink`, so app paths load without a full reload, and it knows when its `to` is the current page.

The platform mostly uses `raw` links: they drop ULink's own colours, so the classes set the look. The user card wraps both the avatar and the username in one, with `class="no-underline"`.

- For an action, use a button. A button with `to` is also a link, styled as a button.
- For a row of section links, use a navigation menu; it handles the active state for you.
- A link to another site opens in the same tab unless people need to keep their place, then `target="_blank"`.

## Accessibility

The link's text says where it goes ("Ana Souza's profile", not "Click here"). When two links in a row go to the same place, such as an avatar and a name, hide one from the keyboard or merge them, so people don't tab through both.

## In these examples

Links here stay on the example: pressing one doesn't leave the page.

## In Vue screens

Screens written as `.vue` files use `<ULink :to="…">` directly.
