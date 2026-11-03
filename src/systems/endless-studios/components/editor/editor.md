---
title: Editor
description: Rich text with headings, lists, links and mentions. Nuxt UI's UEditor as the Endless Studios platform's RichTextEditor uses it.
source: Nuxt UI 4.8 UEditor (Tiptap), as the frontend's components/Generic/inputs/RichTextEditor.vue uses it (Endless-Game-Making-Studio/studio 11517cbee); app.config doesn't change it.
docs: https://ui.nuxt.com/docs/components/editor
---

## When to use

Use the editor where people write formatted text that others will read: a post in the community feed, an event's or a program's description. For plain text, such as notes or a quiz prompt, a textarea is simpler and safer.

The platform has one editor, the app's `RichTextEditor`, and it's built like this:

- `UEditor` with `content-type="html"`, a bordered box (`rounded-lg border`) whose writing area is 200px tall and scrolls.
- A fixed `UEditorToolbar` in the default slot, above the content, in four groups: headings 1–3; bold, italic, underline, strikethrough; quote, code block, link; bullet list, numbered list, image.
- In the community feed only, `mention` on and a `UEditorMentionMenu` that searches people as you type `@`.

## How the app differs

The app adds what the examples here leave out, because each needs a package or a server this system doesn't have:

- Its own link button, a popover with an address field, Remove and Open (`RichTextEditorLinkPopover`). The examples use Nuxt UI's link button, which asks for the address in a browser prompt.
- Image upload through its GraphQL API, which keeps the attributes the server puts on images.
- Links that stop extending into the text typed after them.

## Accessibility

Every toolbar button has a tooltip and a label. The writing area takes the usual keyboard shortcuts (Ctrl+B, Ctrl+I). Give the editor a visible title above it, as `RichTextEditor`'s `title` does.

## In Vue screens

Screens written as `.vue` files use `<UEditor v-model="…" content-type="html">` with the toolbar in its default slot, or import the app's `RichTextEditor` once it's copied in.
