---
title: Editor toolbar
description: The formatting buttons of a rich text editor. Nuxt UI's UEditorToolbar as the Endless Studios platform's RichTextEditor uses it.
source: Nuxt UI 4.8 UEditorToolbar, as the frontend's components/Generic/inputs/RichTextEditor.vue uses it (Endless-Game-Making-Studio/studio 11517cbee); app.config doesn't change it.
docs: https://ui.nuxt.com/docs/components/editor-toolbar
---

## When to use

A toolbar only works inside a `UEditor`: put it in the editor's default slot and pass it the `editor` the slot gives you. See the Editor page for the whole thing.

The app's toolbar is **fixed**, above the content, with a bottom border, `flex-wrap` so it wraps on narrow screens, and four groups divided by separators: headings; text styles; quote, code block and link; lists and image. Each button is neutral ghost, turns primary soft while its format is on, and has a tooltip.

- Describe each button with an item: `kind` says what it does (`mark`, `heading`, `bulletList`, `link`…), `icon` its Lucide icon, `tooltip.text` its name.
- For a button of your own, give the item a `slot` and fill the slot of that name, as the app does for its link popover.
- A **bubble** toolbar floats over selected text instead, for editors with little room.

## Accessibility

Each button's tooltip is also its name for screen readers, so every item needs `tooltip.text`. Buttons show their pressed state while their format is on.

## In Vue screens

Screens written as `.vue` files use `<UEditorToolbar :editor="editor" :items="…">` inside `<UEditor v-slot="{ editor }">`.
