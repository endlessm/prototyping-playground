# Prototypes

Prototypes and their artifacts. A prototype is a folder `src/prototypes/<contributor>/<folder>/` with a `meta.json`; its artifacts are the files in it that an enabled file type claims. This module is required.

- `module.ts` declares the module, its rail button (first), its pages and the view file type.
- `pages/gallery.vue` is `/prototypes`, the gallery (tab title "Prototypes — <studio name>"); see "The gallery".
- `pages/prototype.vue` is `/prototypes/<prototype-id>`. It replaces itself in the browser history with the prototype's first artifact, keeping the query and the `#anchor`. A prototype with no artifacts stays at its address and shows "This prototype is empty" (`components/PrototypeEmpty.vue`) with, locally, a prompt to copy for the agent naming its folder; it moves on to the first artifact as soon as one appears.
- `pages/artifact.vue` is `/prototypes/<prototype-id>/artifacts/<artifact-id>`. It shows the viewer (`components/PrototypeViewer.vue`): the prototype's title, its system and a plain list of its artifacts in file-tree order in the section navigation (`AppSectionNav`: hidden and shown with ⌘;, resized from its edge, remembered in this browser), the open artifact beside it, and the tab title "<Prototype> — <Artifact> — <studio name>". An unknown prototype is "Page not found"; an unknown artifact is too, with the prototype's navigation kept around it. A file type's page that crashes shows its error with "Copy error" (`AppFileBoundary`) and leaves the rest of the viewer working.
- `pages/artifact.vue` keeps its page while the person moves between artifacts of one prototype, so an open preview document stays in place. Locally it also opens the artifact's source (see "Source mode").
- `components/ArtifactActions.vue` is the open artifact's file menu ("File actions", local only): "Edit source", or "View source" when you can't change the prototype. Ticket 11's file tree adds the rest of the file actions.
- `components/ArtifactSource.vue` adapts the shared source editor (`app/components/source/`) to an artifact, through the file service's source route.
- `components/ArtifactUnavailable.vue` stands in for an artifact that can't open, with its reason and, locally, "Open source".
- `components/PrototypesHome.vue` is the module's Home block, archived prototypes left out, each heading linking to the gallery. Locally, for a registered contributor: "Your prototypes" (your three newest, or the New prototype button) and "Latest from the team" (the three newest by others). On the deployed site, and locally for someone the studio doesn't recognise: "Latest prototypes" (the five newest), or "Prototypes" with "Nothing published yet." when there are none. It comes first locally and after what colleagues come for on the deployed site.
- `components/PrototypeCard.vue` and `PrototypeRow.vue` draw a prototype in the gallery and on Home with the shared collection pieces (`app/components/Collection*.vue`, `ContributorAvatar.vue`). `PrototypeMenu.vue` is their "…" menu, from `composables/usePrototypeActions.ts`.
- `types/view/` is the view file type: `.vue` files, with the identity adapter (reads and writes the leading comment), the page that renders a view (`ViewPage.vue`), its preview frame and notices (`ViewPreview.vue`), and the error and empty states (`ViewError.vue`, `ViewEmpty.vue`), drawn in the studio's own style.

## The gallery

`/prototypes` lists every prototype, newest first by `created` (then by title), as cards or a list.

- **Cards and rows.** A card shows the module's icon, the title, the maker's picture (their `avatar` image in `public/`, else their GitHub photo, else their initials, also when the image fails to load) and first name, and the creation date ("Oct 25, 2026"). A row shows the icon, title, first name and date. The whole card or row is the link, named by the title. Makers come from the manifest's `contributors` (name, GitHub account and avatar only).
- **View as.** Cards or List (`CollectionViewToggle`), one choice for every collection, kept in this browser (`design-studio:collection-view`) and followed by other open tabs.
- **Search.** "Search prototypes" matches the title, the maker's name or key, and the folder name. The text is `?q=`, and typing replaces the history entry. The box widens while focused or filled (no animation under reduced motion), with a clear button. Search and View as are hidden while there are no prototypes.
- **Filters.** An icon button ("Filters", or "Filters, 1 active" with a dot) opens a popover with System: "All systems" and each installed system. The choice is `?system=<folder name>` (a permanent ID works too) and combines with the search; a system the address names that isn't installed is still offered.
- **Archived.** Locally, archived prototypes (`"status": "archived"` in `meta.json`) sit below the rest under "Archived", faded, with "Archived items are excluded from the deployed site." The deployed site leaves them out of the gallery and Home. (Leaving them out of the build itself is ticket 13.)
- **Empty and no matches.** With no prototypes: "No prototypes yet", then "A working sketch of an idea: real screens you can click through." locally for a contributor, or "Prototypes your team makes will show up here." With nothing matching: "No matches", "Try a different search or system." and "View all prototypes", which clears both.
- **Actions.** Each card and row has a "…" menu ("Actions for <title>") shown on hover or focus (always on touch screens), and none when there is nothing you may do. Everyone gets Copy link; locally, Copy path too. Ticket 13 adds rename, duplicate, archive and delete to the same composable.

### Creating a prototype

"New prototype" (gallery header, and Home's "Your prototypes" when you have none) shows only locally and only for a registered contributor. Its dialog (`components/PrototypeNewModal.vue`, through `useOverlay`) asks for a Title (placeholder "Agent Config") and a System: each active system, with the studio's default preselected, or "No system — custom styling", with help text for each. "Create" becomes "Creating"; the service's refusals show in the dialog, and the new prototype opens at once.

From the terminal: `yarn new "Prototype Name" [--system <folder name or ID> | --no-system]` (`yarn studio new`) creates it right away and prints the folder and the address. Both use `tooling/files/prototypes.ts`: the folder is `src/prototypes/<your key>/<slug>/` (`Agent Config` → `agent-config`) with `meta.json` (format version, new permanent ID, your contributor ID as owner, title, today's date, system ID or `null`) and one empty starting view, `Prototype.vue`, holding only its identity comment. It refuses, leaving nothing behind: an empty title ("Add a title."), one without letters or numbers, one that isn't plain text, someone who isn't a registered contributor ("Ask your agent to add you."), an unknown or archived system, and a title whose folder you already have ("You already have a prototype named “…”.").

## meta.json

| Field                | Meaning                                                                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `formatVersion`      | `1`.                                                                                                                                    |
| `title`              | Plain text.                                                                                                                             |
| `created`            | The creation date, `YYYY-MM-DD`.                                                                                                        |
| `studioId`           | The prototype's permanent ID: 16 lowercase Crockford base32 characters.                                                                 |
| `ownerContributorId` | The owner's permanent contributor ID.                                                                                                   |
| `systemId`           | The assigned system's permanent ID, or `null` for no system. A missing or unknown assignment is invalid, and the prototype is left out. |
| `status`             | Optional. `"archived"` sets it apart in the gallery and leaves it off the deployed site's gallery and Home.                             |

## Artifacts

The manifest (`tooling/manifest/build.ts`) lists each prototype's artifacts in file-tree order, folders first. Files and folders whose names start with `_` (a prototype's helpers) or `.` are not artifacts. Each artifact needs a permanent identity read from its leading comments; a missing, malformed or repeated one is reported and leaves the file out. The main manifest lists prototypes and systems; each prototype's artifact list is a separate file the viewer loads when the prototype opens.

Files of a type whose module is turned off stay listed, marked `unavailable` with the type's and the module's labels. Their page says "<Type> files can’t open here: the <Module> module is turned off." with "Open source" locally, so they can still be found and repaired.

## Permanent identities

Every prototype and artifact has a permanent ID that stays with it through renames and moves, so its address `/prototypes/<prototype-id>/artifacts/<artifact-id>` never breaks. Older readable addresses (folder or file names) are not supported. A file copied with its original's ID is a duplicate, which the audit and the build report.

- **New files while the dev server runs.** A view an agent or editor creates in your own prototype gets its ID within a second, written as the leading comment (`tooling/identity/assign.ts`). An existing ID is never rewritten, a file created empty waits for its first content, and nothing is assigned while the studio has identity problems (the dev server logs what to fix). Only one dev server assigns at a time.
- **`yarn studio identify src/prototypes/<contributor>/<folder>`.** Lists the files missing an ID (`--json` for tools); `--yes` writes them, plus the prototype's own `studioId` and `ownerContributorId` when missing, and lists each assigned ID. Only the owner or an Admin can run it, the prototype must declare `systemId`, and it refuses while the studio has identity problems.
- **`yarn studio identity-audit`.** Counts every contributor, system, prototype and artifact and reports missing, malformed and duplicate IDs; exits 1 on any. It never writes. File types of switched-off modules count too, so an ID is never handed out twice.
- **The build** (`yarn build`) stops on a missing, malformed or duplicate ID, naming the file.

A file type's identity adapter (`IdentityAdapter` in `tooling/modules/contract.ts`) reads and writes the ID in a comment or metadata, never in code (ADR 0001). New IDs are 16 lowercase Crockford base32 characters from 10 random bytes, checked against every ID in use.

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

A preview document starts in the studio's color mode before it paints, and follows it while open without reloading, so a view keeps its state. The root element gets the `dark` class and a matching `color-scheme`. A system whose `colorModes` has no `dark` stays light (Endless Studios is light only).

In development each preview document has its own Vite server, started on its first request; the build emits each document under `_preview/` beside the app.

## Live updates

In development the studio keeps up with files changing on disk, by an agent, an editor or the studio, without reloading the page:

- The dev server watches the prototypes folder and the studio configuration. A burst of changes (a folder move is many) becomes one refresh; a change during a refresh is picked up after it. When the manifest changes, it is pushed to every open tab over Vite's HMR channel (`studio:manifest`, with every artifact list), so lists and navigation follow within a second. Content carries a `revision`; the same content arriving twice applies once. A tab that was disconnected fetches the manifest again when it reconnects.
- Each running preview document hears of the change too. Its views module (`virtual:studio-preview-views`) is reloaded in place when its views changed (a new, removed, renamed or emptied view), so a new view renders without a restart.
- Editing a view updates it in its preview through Vue's hot reload, keeping its state where Vue can; style changes apply live. Opening another view or reloading resets it.
- `tooling/live/live-manifest.ts` also holds the queue a tab's own changes go through: one at a time, in order, each reply's content applied once, with an `X-Studio-Tab` header. File operations that change the manifest (ticket 11) send their changes through it; saving a file's source doesn't change the manifest and doesn't use it.

On the deployed site there are no live updates: the manifest is built once, and a prototype's artifact list is fetched when the prototype first opens, then kept.

## Source mode

Locally, any artifact's source opens in place of its page: from "File actions" → "Edit source" (or "View source"), from "Open source" on an artifact that can't open, or with ⌘' / Ctrl+' (not while typing in a form field or while a dialog or menu is open; inside the editor it works). The address gets `?mode=source`, so it can be shared and reloaded; the same shortcut, or "Done", returns to the rendered page and focuses it. The editor has focus when it opens. Source opens even when the view is broken, so it can always be repaired.

The rendered page stays alive while its source is open, hidden and inert: a view keeps its state and its hot updates, so returning shows the saved change in the running view.

The editor (`app/components/source/`, CodeMirror 6 wrapped in `SourceCode.vue`) shows the file's path, "Read-only" or "Unsaved changes", Save (tooltip "Save (Ctrl+S)", ⌘S on Apple computers) and Done. It has line numbers, the active line, bracket matching and closing, folding, undo history, search (⌘F / Ctrl+F) and matching-selection highlights, in the studio's colours (Flexoki syntax colours, light and dark). Syntax comes from the extension: Vue for views, TypeScript and JavaScript, Markdown (wrapping, with YAML frontmatter and Mermaid fences), JSON, Mermaid, CSS and YAML. Screen readers hear it as "Source of <path>"; a read-only editor stays focusable for search and keyboard selection.

- **Saving.** ⌘S / Ctrl+S or Save writes through the file service and confirms with "Saved"; the service's warnings show as error toasts, and a refused save shows its reason.
- **Changes on disk.** A clean editor reloads by itself when the file changes elsewhere. With unsaved changes, a bar says "This file changed on disk while you were editing it." with "Load the new version" and "Keep mine" (the next save overwrites). A save over a version the editor hasn't seen is refused, and the bar shows.
- **Leaving.** With unsaved changes, Done, another page, a reload or closing the tab asks first: "Discard your changes?" with "Keep editing" and "Discard" (closing and reloading use the browser's own prompt).
- **Who may save.** Owners save their own prototypes and Admins all of them; anyone else, an archived prototype, or a Git identity that matches no profile reads the source read-only, and the editor says why. The server checks again on every save.

The deployed site has no source mode: `?mode=source` and the shortcut show the rendered page, and the editor's code isn't in the build.

### The file service

While `yarn dev` runs, `tooling/files/` adds Nitro routes the studio's own pages call (same-origin only). They read the configuration, profiles and your Git identity again on every request. The static build has none of them.

| Route                                                                     | Does                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET <base>_studio/files/source?prototype=<id>&artifact=<id>`             | The artifact's text, its `version` (a hash of the text), its `path`, and `editable` with the `reason` when you may not save.                                                                                                                                                                      |
| `PUT <base>_studio/files/source` `{ prototype, artifact, content, base }` | Saves over version `base`. 409 `changed` if the file changed on disk since; 403 with the reason (`identity`, `owner`, `archived`); 409 `identity` if the permanent ID was changed or removed; 413 over 750 KB; 404 for helpers, hidden files, links leading out of the prototype and unknown IDs. |
| `POST <base>_studio/files/prototypes` `{ title, system }`                 | Creates a prototype in your own space (`system`: a system's ID, or `null`) and answers 201 with its `id`, `folder` and starting `artifact`. 400 for an invalid title or system, 403 `identity` if you aren't a registered contributor, 409 `exists` for a folder you already have.                |

Changed content files reach open pages as `studio:source` with their paths, which is how an open editor hears of outside edits. Creating, renaming, moving and deleting files arrive with the file tree (ticket 11); renaming, duplicating, archiving and deleting prototypes with ticket 13.

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
