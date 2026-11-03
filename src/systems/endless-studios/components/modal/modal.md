---
title: Modal
description: A dialog over the page for a short task or a decision. Nuxt UI's UModal as the Endless Studios platform uses it.
source: Nuxt UI 4.8 UModal, as the frontend uses it (Endless-Game-Making-Studio/studio 11517cbee); app.config doesn't change it.
docs: https://ui.nuxt.com/docs/components/modal
---

## When to use

Use a modal for something short that has to be finished or decided before going on: entering an enrollment code, confirming that a cohort should be archived, a learner's onboarding step. It blocks the page, so keep it to one task. For a longer form or an editor, use a slideover; for a passing message, a toast.

The platform's modals follow one shape:

- A `title` and, often, a `description` in the header.
- The content in `#body`, usually a `UForm`.
- The buttons in `#footer`, aligned right with `:ui="{ footer: 'justify-end' }"`: a neutral Cancel, then the main action.

A **confirmation** hides the close button (`:close="false"`) so people pick one of the two buttons, and puts focus on Cancel, so Enter never confirms a destructive action by accident. The app opens these with `useOverlay()` from code; a screen can also bind `v-model:open`.

## Accessibility

Focus moves into the modal when it opens, stays inside while it's open, and returns to the button that opened it. Escape closes it unless `dismissible` is off. A modal without a visible title still needs one for screen readers: leave `title` set and hide the header with `ui`, as the app's full-bleed modals do.

## In these examples

A modal covers its example's frame, so each example keeps room for it. Press the button to open it.

## In Vue screens

Screens written as `.vue` files use `<UModal>` directly, with the trigger button in the default slot or `v-model:open`.
