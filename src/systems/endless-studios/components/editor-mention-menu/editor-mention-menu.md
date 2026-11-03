---
title: Editor mention menu
description: Suggests people to @-mention while writing. Nuxt UI's UEditorMentionMenu as the Endless Studios community feed uses it.
source: Nuxt UI 4.8 UEditorMentionMenu, as the frontend's components/Generic/inputs/RichTextEditor.vue uses it (Endless-Game-Making-Studio/studio 11517cbee); app.config doesn't change it.
docs: https://ui.nuxt.com/docs/components/editor-mention-menu
---

## When to use

Use a mention menu when writers should be able to name someone in their text and notify them: posts and comments in the community feed are the only place the platform turns it on. It works only inside a `UEditor` with `mention` on: put it in the editor's default slot and pass it the `editor`.

Typing `@` opens it at the cursor; the next letters narrow the list, and picking a person inserts a mention.

- With a short, known list, pass it as `items` and let the menu filter it.
- The app searches the server instead: it sets `ignore-filter`, listens to `@update:search-term`, and passes back the people the search returns as `items`.

## Safeguarding

Mentions notify people, so who can be suggested matters on a platform with learners under 18. The app decides who the search returns; a prototype that suggests people a learner couldn't otherwise reach should say so, and the system's user types (Safeguarding, in Part 2) apply.

## Accessibility

Arrow keys move through the suggestions, Enter inserts one, and Escape closes the menu and keeps the `@` as text.

## In Vue screens

Screens written as `.vue` files use `<UEditorMentionMenu :editor="editor" :items="…">` inside `<UEditor mention v-slot="{ editor }">`.
