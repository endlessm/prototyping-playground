# Prototypes

Prototypes and their artifacts. A prototype is a folder `src/prototypes/<contributor>/<folder>/` with a `meta.json`; its artifacts are the files in it that an enabled file type claims. This module is required.

- `module.ts` declares the module, its pages and the view file type.
- `pages/prototype.vue` is `/prototypes/<prototype-id>`. It replaces itself in the browser history with the prototype's first artifact, keeping the query and the `#anchor`.
- `pages/artifact.vue` is `/prototypes/<prototype-id>/artifacts/<artifact-id>`. It shows the viewer (`components/PrototypeViewer.vue`): the prototype's title, its system and a plain list of its artifacts in file-tree order on the left, the open artifact on the right, and the tab title "<Prototype> — <Artifact> — <studio name>".
- `pages/artifact.vue` keeps its page while the person moves between artifacts of one prototype, so an open preview document stays in place.
- `types/view/` is the view file type: `.vue` files, with the identity reader, the page that renders a view (`ViewPage.vue`), its preview frame and notices (`ViewPreview.vue`), and the error and empty states (`ViewError.vue`, `ViewEmpty.vue`), drawn in the studio's own style.

## meta.json

| Field                | Meaning                                                                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `formatVersion`      | `1`.                                                                                                                                    |
| `title`              | Plain text.                                                                                                                             |
| `created`            | The creation date, `YYYY-MM-DD`.                                                                                                        |
| `studioId`           | The prototype's permanent ID: 16 lowercase Crockford base32 characters.                                                                 |
| `ownerContributorId` | The owner's permanent contributor ID.                                                                                                   |
| `systemId`           | The assigned system's permanent ID, or `null` for no system. A missing or unknown assignment is invalid, and the prototype is left out. |

## Artifacts

The manifest (`tooling/manifest/build.ts`) lists each prototype's artifacts in file-tree order, folders first. Files and folders whose names start with `_` (a prototype's helpers) or `.` are not artifacts. Each artifact needs a permanent identity read from its leading comments; a missing, malformed or repeated one is reported and leaves the file out. The main manifest lists prototypes and systems; each prototype's artifact list is a separate file the viewer loads when the prototype opens.

## Views

A view is a Vue single-file component. Its permanent identity is an HTML comment at the top of the file:

```vue
<!-- @studio-id vhme000000000001 -->
<template>
  <UCard>
    <h1>{{ $t('welcome_back') }}</h1>
    <UButton>Start</UButton>
  </UCard>
</template>
```

A view renders in its system's preview document, a same-origin iframe at `<base>_preview/<system-id>/?artifact=<artifact-id>`. The document holds only the system's Vue app, made by the system's app factory with its stylesheet, Nuxt UI configuration and stand-ins (`app` in the system's `system.ts`). The studio's stylesheet and Nuxt runtime never enter it, and the system's styles never reach the studio; pop-ups stay inside the document. Views and system code get the system's stand-ins as auto-imports, never the studio's Nuxt composables.

A prototype with no system renders in a document with plain Vue, browser colours and a system font. Its views import what they use from `vue` and style themselves.

In development each preview document has its own Vite server, started on its first request; the build emits each document under `_preview/` beside the app.

## Live updates

In development the studio keeps up with files changing on disk, by an agent, an editor or the studio, without reloading the page:

- The dev server watches the prototypes folder and the studio configuration. A burst of changes (a folder move is many) becomes one refresh; a change during a refresh is picked up after it. When the manifest changes, it is pushed to every open tab over Vite's HMR channel (`studio:manifest`, with every artifact list), so lists and navigation follow within a second. Content carries a `revision`; the same content arriving twice applies once. A tab that was disconnected fetches the manifest again when it reconnects.
- Each running preview document hears of the change too. Its views module (`virtual:studio-preview-views`) is reloaded in place when its views changed (a new, removed, renamed or emptied view), so a new view renders without a restart.
- Editing a view updates it in its preview through Vue's hot reload, keeping its state where Vue can; style changes apply live. Opening another view or reloading resets it.
- `tooling/live/live-manifest.ts` also holds the queue a tab's own changes go through: one at a time, in order, each reply's content applied once, with an `X-Studio-Tab` header. The file service (tickets 09 and 11) sends its changes through it.

On the deployed site there are no live updates: the manifest is built once, and a prototype's artifact list is fetched when the prototype first opens, then kept.

## The preview channel

The studio and a preview document talk over a versioned, validated message channel (`tooling/preview/protocol.ts`, channel `studio-preview`, version 1). The frame's address carries the first artifact and a `session` the studio chose for the frame; later views travel by message, so the frame stays while the person moves between views of the prototype.

| Message     | From     | Meaning                                                                                                                                                                                 |
| ----------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ready`     | document | A load of the document started, with its `runtime` ID. The studio answers with `configure`.                                                                                             |
| `configure` | studio   | Show this artifact. The document keeps the outgoing view on screen, inert, until the next is ready, and updates its own address.                                                        |
| `status`    | document | `loading`, `ready`, `error` (with the detail) or `empty`, numbered by render attempt.                                                                                                   |
| `lifecycle` | document | Development only: whether the shown output matches the saved source: `current`, `updating`, `error` (the latest change failed to compile or render, with the detail) or `disconnected`. |

The studio accepts only messages from its own frame, session and current runtime about the open artifact; the document accepts `configure` only from its parent with its session and runtime.

What the person sees:

- Loading that takes longer than 200 ms says "Loading preview", or "Opening view" while the outgoing view stays visible.
- A view that fails to compile or throws shows "This page couldn't load. Copy the error and give it to your agent.", the compiler's message with its file, line and column, and "Copy error". It loads again by itself once the file is fixed.
- A view whose `<script setup>` has no `<template>` says so the same way.
- A view file holding only comments is empty: "This view is empty", with the short path and "Copy prompt" locally (the deployed site shows only the explanation).
- When the shown output is older than the saved source, a notice says "This preview is out of date." with "Updating preview" or "The latest changes could not render. Give the error to your agent." and the error.
- A document that sends nothing for 15 seconds while the studio waits gets "Preview has not responded."

For agents and browser tools, the preview boundary in the studio carries `data-preview-session`, `data-preview-artifact`, `data-preview-state`, `data-preview-phase` and `data-preview-freshness` (`current` or `stale`), and dispatches bubbling `studio:preview-state` and `studio:artifact-lifecycle` events. The document itself, opened alone in a tab ("Open in a new tab", the address without a session), sets `data-preview-state`, `data-preview-artifact` and `data-preview-phase` on `<html>` and dispatches `studio:preview-state` on `window`.
