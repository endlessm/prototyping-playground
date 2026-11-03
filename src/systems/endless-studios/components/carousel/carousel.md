---
title: Carousel
description: Shows a row of slides one or a few at a time, with arrows and dots to move between them. Nuxt UI's UCarousel with the Endless Studios arrow settings, the same carousel the dashboard hero uses.
source: Nuxt UI 4.8 UCarousel with the frontend's app.config carousel settings (Endless-Game-Making-Studio/studio 11517cbee).
docs: https://ui.nuxt.com/docs/components/carousel
---

## When to use

Use a carousel when there are more items than fit and seeing all of them at once isn't the point: the dashboard hero's banners, a game's screenshots, a "discover" row of projects. Each slide is the default slot, rendered once per item in `items`.

Don't hide anything essential on a later slide: many people never move past the first. When people need to compare items or find one, use a grid or a list.

Turn on `arrows` and `dots` so the slides are discoverable. Avoid `autoplay` for content people read; if you use it, keep it slow.

## Studios variants

- The previous and next arrows are hidden below the `md` breakpoint, where people swipe instead.

## Accessibility

Give every image slide an `alt` that says what it shows. Arrows and dots are buttons with labels, and the carousel moves with the keyboard's arrow keys once focused.

## In Vue screens

Screens written as `.vue` files use `<UCarousel v-slot="{ item }" :items="…">` directly. Size the slides with classes on the content or with the `ui` prop's `item` slot, such as `basis-1/3` for three at a time.
