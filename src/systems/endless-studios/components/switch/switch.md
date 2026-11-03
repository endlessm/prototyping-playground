---
title: Switch
description: Turns one setting on or off, taking effect at once. Nuxt UI's USwitch as the Endless Studios platform uses it, including its parental-consent state.
source: Nuxt UI 4.8 USwitch, as the frontend uses it (Endless-Game-Making-Studio/studio 11517cbee); app.config doesn't change it.
docs: https://ui.nuxt.com/docs/components/switch
---

## When to use

Use a switch for a setting that is on or off and applies right away: making a profile public, shuffling a quiz's questions, including quiz results in a program's score. When the choice only applies once a form is submitted, or when it's one of several options, a checkbox or a radio group says that better.

Give the switch a `label` beside it. In a settings row whose title and description sit apart from the switch, the switch takes an `aria-label` instead.

## Parental consent

When a learner under 18 needs a parent's consent before a setting can turn on (making a profile public, for example), the platform shows the switch with `color="kids"`, `unchecked-icon="i-lucide-shield"` and reduced opacity. Teal (`kids`) is reserved for these consent surfaces: never use it on a switch for any other reason.

## Accessibility

Its label says what turns on, not what happens when you press it ("Public profile", not "Make public"). If a change saves to the server, show `loading` while it does.

## In Vue screens

Screens written as `.vue` files use `<USwitch v-model="…">` directly, with the same props.
