---
title: Textarea
description: Several lines of plain text, such as a description or notes. Nuxt UI's UTextarea as the Endless Studios platform uses it.
source: Nuxt UI 4.8 UTextarea, as the frontend uses it (Endless-Game-Making-Studio/studio 11517cbee); app.config doesn't change it.
docs: https://ui.nuxt.com/docs/components/textarea
---

## When to use

Use a textarea for free text longer than a line: an event's description, a contribution's notes, a quiz question's prompt. For one short value, use an input. When people need formatting, links or mentions, the platform uses its rich text editor instead.

Size it for the text you expect, with `rows` (the event form uses 5), or let it grow with `autoresize`. Fill the field with `class="w-full"`.

## Accessibility

A textarea needs a label, from its form field or an `aria-label`, as the quiz editor's prompts have. A read-only textarea in an editor someone can't change is `disabled`, so it can't be focused by mistake.

## In Vue screens

Screens written as `.vue` files use `<UTextarea v-model="…">` directly, with the same props.
