---
title: Container
description: Centres a page's content and gives it the platform's side padding. Nuxt UI's UContainer with the Endless Studios padding, the same container the platform's pages use.
source: Nuxt UI 4.8 UContainer with the frontend's app.config container settings (Endless-Game-Making-Studio/studio 11517cbee).
docs: https://ui.nuxt.com/docs/components/container
---

## When to use

Use a container around each band of a page (the banner, the hero, the main content, the footer) so they share one width and one left edge. The app's page layouts (`AppPage`, `AppSimplePage`) already wrap their slots in one, so a screen built on them doesn't add its own.

Give it vertical spacing with classes, as the app does: `mt-4 md:mt-12` between bands. Don't nest containers.

## Studios variants

- The side padding is `px-4` on small screens and `px-12` from the `md` breakpoint, wider than Nuxt UI's default steps.

## In Vue screens

Screens written as `.vue` files use `<UContainer>` directly.
