---
title: Input
description: A single line of text, such as a name, an email or a code. Nuxt UI's UInput as the Endless Studios platform uses it.
source: Nuxt UI 4.8 UInput, as the frontend uses it (Endless-Game-Making-Studio/studio 11517cbee); app.config doesn't change it.
docs: https://ui.nuxt.com/docs/components/input
---

## When to use

Use an input for one short value the person types: a cohort's name, an enrollment code, an email, a link. For several lines, use a textarea. To choose from a known list, use a select, or an input menu when typing should suggest values.

Put every input inside a form field, which gives it its label, help and error. The platform's inputs are outline and medium, and fill their field with `class="w-full"`.

The placeholder is an example of the value, never the label: it disappears as soon as someone types.

## Accessibility

An input needs a visible label, from its form field. An input without one, such as the link box in the rich text editor, needs an `aria-label`. Use the right `type` (`email`, `url`), so phones show the matching keyboard.

## In Vue screens

Screens written as `.vue` files use `<UInput v-model="…">` directly, with the same props.
