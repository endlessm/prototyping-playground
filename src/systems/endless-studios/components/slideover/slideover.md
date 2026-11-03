---
title: Slideover
description: A panel that slides in from the edge for a longer form or an editor. Nuxt UI's USlideover as the Endless Studios platform uses it.
source: Nuxt UI 4.8 USlideover, as the frontend uses it (Endless-Game-Making-Studio/studio 11517cbee); app.config doesn't change it.
docs: https://ui.nuxt.com/docs/components/slideover
---

## When to use

Use a slideover for work that needs more room than a modal but should keep the page behind it in view: creating or editing a cohort or a report profile, authoring a quiz. It slides in from the right, takes the screen's full height, and scrolls its own body.

- Give it a `title` that names the task ("Create profile", "Edit quiz") and, when it helps, a `description` with the item's status.
- Put the form in `#body` and the Save and Cancel buttons in `#footer`.
- Widen it for editors with `:ui="{ content: 'max-w-4xl' }"`, as the quiz editor does.
- While it saves, turn off `dismissible` and `close`, so a stray click outside can't lose the work.

For a short task or a decision, use a modal.

## Accessibility

Like a modal, it moves focus inside when it opens, keeps it there, and returns it when it closes; Escape closes it unless `dismissible` is off.

## In these examples

A slideover covers its example's frame, so each example keeps room for it. Press the button to open it.

## In Vue screens

Screens written as `.vue` files use `<USlideover>` directly, with the trigger button in the default slot or `v-model:open`.
