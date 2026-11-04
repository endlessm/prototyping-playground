# Documents

A `.md` file in a prototype is a document: a written page read in the studio's own style (Nuxt UI's prose, not the prototype's system). The module is optional and on by default. Turned off, `.md` files stay listed as unavailable ("Document files can’t open here: the Documents module is turned off.") and their source still opens locally. Mermaid fences and the shared Markdown reader belong to the studio, so other readers (the Manual) keep them when this module is off.

- `module.ts` declares the module, its skill and the document file type: `.md`, the identity adapter, the check, the template, the page and the card icon. Documents have no preview inside other documents; they show as cards there.
- `types/document/identity.ts` reads and writes the permanent identity, `studioId` in the frontmatter. A file without frontmatter gets a frontmatter block holding only `studioId`; frontmatter that is never closed is refused until it is.
- `types/document/check.ts` reports frontmatter that is never closed and a `toc` that isn't `true` or `false`; the audit and the build stop on them.
- `types/document/template.ts` is a new document: its `title` and the line "This document is empty. Ask your agent to write it: describe what it’s for and who will read it." The studio adds `studioId` when it writes the file.
- `types/document/DocumentPage.vue` is the page. It reads the file's text (`useArtifactText`: the dev server's file service locally, the file the build ships on the deployed site), parses it and shows it with the shared reader.
- `types/document/documentSurface.ts` is the page's [artifact surface](../../../app/utils/artifactSurface.ts), and `types/document/anchors.ts` the rules it finds targets again by (see [The surface](#the-surface)).
- `skills/write-document/` tells agents how to write documents.

## Writing a document

```md
---
studioId: d0c5000000000002
title: Research brief
description: What we learned from five interviews.
toc: true
---

## Goals

| Goal    | Owner |
| ------- | ----- |
| Sign in | Ada   |

![Sign-in screen](./flows/Sign in.vue)
```

| Frontmatter   | Meaning                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------- |
| `studioId`    | The document's permanent ID. The studio writes it; never change it.                               |
| `title`       | The page's title. Without one, an opening level-one heading becomes the title.                    |
| `description` | A line under the title.                                                                           |
| `toc`         | `true` adds "On this page" on wide screens, when the document has two level 2–3 headings or more. |

An opening level-one heading that repeats the title shows once. Without a title or heading, a `SKILL.md` is titled from its `name` ("document-component" → "Document component").

## How a document reads

The shared reader (`app/markdown/`, `app/components/markdown/`) parses at run time with Nuxt's MDC (`@nuxtjs/mdc`, set up in `nuxt.config.ts` through Nuxt UI's `mdc` option) and renders Nuxt UI's prose components. MDC's own component syntax and raw HTML passthrough are off: documents are plain Markdown.

- GitHub-style Markdown: tables, task lists, strikethrough, footnotes and autolinks. Every level 2–4 heading gets an anchor that links to itself.
- Code fences are highlighted in the browser with Shiki in the studio's accent palette (`app/utils/contentPalette.ts`, Flexoki, light only), the same palette as the source editor and diagrams.
- Raw HTML shows as the text that was typed and never runs; an HTML comment is hidden, so it can hold a note for whoever edits the file (`remark-html-as-text.ts`).
- A `mermaid` fence is a diagram (`remark-mermaid.ts`, `app/components/MermaidDiagram.vue`), drawn in the studio's light colours, one render at a time. Invalid Mermaid shows "Unable to render Mermaid diagram." with Mermaid's message.
- "On this page" (`MarkdownToc.vue`) lists level 2–3 headings and highlights the one scrolled to. Choosing one puts it in the address and scrolls there, without animation when the person prefers reduced motion.
- Opening an address with `#heading` scrolls to that heading, and keeps it there while diagrams and embeds above it render, until the person scrolls. Another document opens at the top. An edit to the open document keeps the scroll position.

### Links

A link to a file of the same prototype is relative to the document, with or without its extension (`[the notes](./notes/Interview.md)`, `[the notes](./notes/Interview)`). It opens the artifact at its permanent address, so it survives renaming the prototype's folder. Renaming or moving the file, or the document, in the studio or outside it while `yarn dev` runs updates the link (`references.ts`, see the prototypes README, "References follow renames and moves"); links and images inside code stay as written. `/…` addresses navigate inside the studio, `#anchors` stay on the page, and other sites open in a new tab.

### Embeds

A file of the same prototype linked with image syntax on its own line is embedded: `![Sign-in screen](./flows/Sign in.vue)` (angle brackets around a path with spaces: `![Sign-in screen](<./flows/Sign in.vue>)`). A view's named state is embedded by its permanent address, `![Signed in](/prototypes/<prototype-id>/artifacts/<state-id>)`. The same reference inside a sentence stays a link, and ordinary pictures (`.png`, `.jpg`, `.svg`, …) stay images.

An embed is as wide as the text, between 220 and 440 px tall. A type with a preview (views, diagrams) shows it in a frame with rounded corners whose header names it and opens it ("Open <name>"; "Open" shows on hover and focus). Other types (documents) show as a card with their icon, name, type and an "Open" link. Something that can't be shown is a card that says why:

| Card                                                                                | When                                                                      |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Not found · This file was moved or deleted. Ask your agent to fix the link.         | Nothing at that path in the prototype (locally).                          |
| Not found · Not on this site. It may be archived. Run the studio locally to see it. | The same, on the deployed site.                                           |
| Not found · Choose a file inside this prototype.                                    | A path out of the prototype, into its helpers (`_…`), or to another site. |
| Not found · File unavailable. Check its path and whether its module is enabled.     | No enabled file type opens a file like it.                                |
| Not found · This artifact format is unavailable.                                    | Its file type's module is turned off.                                     |
| Another prototype · A document shows only its own prototype. Copy the view here.    | A permanent address in another prototype.                                 |

A preview that crashes says "This preview could not render. Open the file to inspect it." and leaves the document working. Embeds keep their place, and a view's running preview, while the text around them changes; each updates by itself when its own source changes. Resolution rules are in `app/utils/artifactReference.ts`.

## Live updates and errors

Saving a document updates every open reader in place, without reloading the page: the file service tells open pages which files changed (`studio:source`), and the page reads the file again. While the newer text is on its way for more than 200 ms, a notice says "This document is out of date. Updating document…". A document that can't be read (frontmatter that isn't valid YAML, a part that crashes) shows "This page couldn’t load. Copy the error and give it to your agent." with the error and "Copy error", and reads again once the file is fixed. The page carries `data-document-state` (`loading`, `ready`, `error`) and `data-document-freshness` (`current`, `stale`) for agents and browser tools.

## The surface

The page offers tools drawn over it (such as comments) an [artifact surface](../../../app/utils/artifactSurface.ts) through `useArtifactSurfaceProvider`. It knows nothing about comments. The reader is in the studio's own DOM, so the surface reads it directly (`documentSurface.ts`); its anchors are JSON the tool stores and hands back.

- **Blocks.** A point is over a block: a heading, a paragraph, a list item, a table row, a code block, a Mermaid fence (`diagram`) or an embed, the most specific first (a paragraph in a list item is the list item; anything in an embed is the embed, commented on as a whole). Its anchor records `block` (the kind), `text` (squashed and clipped; a table row's cells joined with " · "; an embed's caption), `heading` and `headingId` (the nearest heading at or before it, and its anchor), `index` (its place among blocks of its kind under that heading) and, for an embed, `embed` (the reference as written, `./Home.vue`). Labels read `Heading "Goals"`, `Table row "Sign in · Ada"`, `Embed "Home screen"`.
- **Quotes.** `selection()` turns selected text in the article into a text-quote selector: `quote` (the exact words), `prefix` and `suffix` (up to 32 characters either side), over the article's text flattened with whitespace squashed and a space between blocks. It also records the block the selection starts in, labelled `Text in "<heading>"`, with the pin at the selection's end.
- **Finding a target again** (`anchors.ts`, unit-tested) after every render: a quote by its words, the occurrence whose surroundings match `prefix` and `suffix` best, so text added or changed before it doesn't lose it; then by its block. A block by its kind and text (an embed by its `embed` reference, whatever its caption), the same heading first, then the nearest place under it. A block whose text changed is not found ("Target not found" in the tool).
- **Where things are.** Positions are in the window's coordinates; a target outside the reader's scrolling area is off screen. Changes are sampled each animation frame while a tool listens (`sampledChanges` in `app/utils/domSurface.ts`), so pins follow scrolling, resizing and re-renders with no listener on the reader. Revealing a target scrolls it to the middle (without animation under reduced motion).
- **Taking the pointer** (`interceptElement`): capture listeners on the page's element stop presses, clicks and links, and finishing a text selection is a press for the tool. Text can still be selected; links and controls keep their focus. Embedded frames stop taking the pointer meanwhile, and one style sets the crosshair cursor. All of it goes when the tool lets go.

## On the deployed site

The build ships each document's text as a file of its own beside the manifest (a file type with `text: true`; the artifact record's `text` names it), so documents read the same there, without source mode or file actions. Embedded views render from the built preview documents.
