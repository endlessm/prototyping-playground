# Prototypes

Prototypes and their artifacts. A prototype is a folder `src/prototypes/<contributor>/<folder>/` with a `meta.json`; its artifacts are the files in it that an enabled file type claims. This module is required.

- `module.ts` declares the module, its rail button (first), its pages and the view file type.
- `pages/gallery.vue` is `/prototypes`, the gallery (tab title "Prototypes — <studio name>"); see "The gallery".
- `pages/prototype.vue` is `/prototypes/<prototype-id>`. It replaces itself in the browser history with the prototype's first artifact, keeping the query and the `#anchor`. A prototype with no artifacts stays at its address and shows "This prototype is empty" (`components/PrototypeEmpty.vue`) with, locally, a prompt to copy for the agent naming its folder; it moves on to the first artifact as soon as one appears.
- `pages/artifact.vue` is `/prototypes/<prototype-id>/artifacts/<artifact-id>`. It shows the viewer (`components/PrototypeViewer.vue`): the prototype's title, its system, its "…" menu (`components/PrototypeHeaderMenu.vue`: the prototype's actions and, locally, "Show all files") and its file tree (`components/PrototypeFiles.vue`, see "The file tree") in the section navigation (`AppSectionNav`: hidden and shown with ⌘;, resized from its edge, remembered in this browser), the open artifact beside it, and the tab title "<Prototype> — <Artifact> — <studio name>". A named state's address opens its view's page with the state, titled "<View> · <State>". An unknown prototype is "Page not found"; an unknown artifact is too, with the prototype's navigation kept around it. A file type's page that crashes shows its error with "Copy error" (`AppFileBoundary`) and leaves the rest of the viewer working.
- `pages/artifact.vue` keeps its page while the person moves between artifacts of one prototype, so an open preview document stays in place. Locally it also opens the artifact's source (see "Source mode").
- `components/ArtifactActions.vue` is the open artifact's file menu ("File actions", local only): "Edit source", or "View source" when you can't change the prototype. The file tree's row menus have the rest.
- `components/ArtifactSource.vue` adapts the shared source editor (`app/components/source/`) to an artifact, through the file service's source route.
- `components/ArtifactUnavailable.vue` stands in for an artifact that can't open, with its reason and, locally, "Open source".
- `components/PrototypesHome.vue` is the module's Home block, archived prototypes left out, each heading linking to the gallery. Locally, for a registered contributor: "Your prototypes" (your three newest, or the New prototype button) and "Latest from the team" (the three newest by others). On the deployed site, and locally for someone the studio doesn't recognise: "Latest prototypes" (the five newest), or "Prototypes" with "Nothing published yet." when there are none. It comes first locally and after what colleagues come for on the deployed site.
- `components/PrototypeCard.vue` and `PrototypeRow.vue` draw a prototype in the gallery and on Home with the shared collection pieces (`app/components/Collection*.vue`, `ContributorAvatar.vue`). `PrototypeMenu.vue` is their "…" menu, from `composables/usePrototypeActions.ts`.
- `types/view/` is the view file type: `.vue` files, with the identity adapter (reads and writes the leading comments, the view's and each named state's), its check and named states (`states.ts`), the lo-fi marker (`fidelity.ts`), the page that renders a view (`ViewPage.vue`), its preview frame and notices (`ViewPreview.vue`), the error and empty states (`ViewError.vue`, `ViewEmpty.vue`), drawn in the studio's own style, and its preview embedded in a document (`ViewEmbed.vue`, see "Views in documents").
- `composables/usePreviewFrame.ts` is the studio's side of one preview frame (the channel below): a view's page and its embeds in documents both use it.

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
| `order`              | Optional. The tree's order: paths inside the prototype, files and folders (`tooling/manifest/order.ts`). Written by arranging the tree. |

## Artifacts

The manifest (`tooling/manifest/build.ts`) lists each prototype's artifacts in the tree's order, so the first one is what the prototype's address opens. At each level, the paths listed in `meta.json`'s `order` come first, in that sequence; the rest follow alphabetically, files before folders, so a new file lands after the ones you arranged. Files and folders whose names start with `_` (a prototype's helpers) or `.` are not artifacts. Each artifact needs a permanent identity, read by its file type's identity adapter (a view's leading comment, a canvas's top-level `"studioId"`); a missing, malformed or repeated one is reported and leaves the file out. A view's record also carries its named states (`states`: ID and title, in declaration order) and `lofi: true` when it is lo-fi. A file type may declare a `check` (problems in one file's source, as sentences; it also gets the prototype's ID), which the manifest reports in development and which stops the build. The navigation shows each artifact with its file type's `icon`, and a type may declare a `template` for new files (`ModuleFileType` in `tooling/modules/contract.ts`). The main manifest lists prototypes and systems; each prototype's artifact list is a separate file the viewer loads when the prototype opens.

Files of a type whose module is turned off stay listed, marked `unavailable` with the type's and the module's labels. Their page says "<Type> files can’t open here: the <Module> module is turned off." with "Open source" locally, so they can still be found and repaired.

## Permanent identities

Every prototype and artifact has a permanent ID that stays with it through renames and moves, so its address `/prototypes/<prototype-id>/artifacts/<artifact-id>` never breaks. Older readable addresses (folder or file names) are not supported. A file copied with its original's ID is a duplicate, which the audit and the build report.

- **New files while the dev server runs.** A view an agent or editor creates in your own prototype gets its ID within a second, written as the leading comment (`tooling/identity/assign.ts`). So does each named state added to one of your views, unless the view's check reports a problem (a state renamed in code alone keeps a comment naming no state, which is reported rather than given a new ID). An existing ID is never rewritten, a file created empty waits for its first content, and nothing is assigned while the studio has identity problems (the dev server logs what to fix). Only one dev server assigns at a time.
- **`yarn studio identify src/prototypes/<contributor>/<folder>`.** Lists the files and named states missing an ID (`--json` for tools: `missing` and `missingStates`); `--yes` writes them, plus the prototype's own `studioId` and `ownerContributorId` when missing, and lists each assigned ID. Only the owner or an Admin can run it, the prototype must declare `systemId`, and it refuses while the studio has identity problems.
- **`yarn studio identity-audit`.** Counts every contributor, system, prototype, artifact and named state and reports missing, malformed and duplicate IDs; exits 1 on any. It never writes. File types of switched-off modules count too, so an ID is never handed out twice.
- **The build** (`yarn build`) stops on a missing, malformed or duplicate ID, naming the file (and the state), and on what file types' checks report.

A file type's identity adapter (`IdentityAdapter` in `tooling/modules/contract.ts`) reads and writes the ID in a comment or metadata, never in code (ADR 0001). Its optional `children` reads and writes the IDs of artifacts declared inside the file, such as a view's named states. New IDs are 16 lowercase Crockford base32 characters from 10 random bytes, checked against every ID in use.

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

## Named states

A view may declare named states (ADR 0001): variations of one screen, each with its own title and permanent ID, listed under the view in the navigation and opening at their own addresses `/prototypes/<prototype-id>/artifacts/<state-id>`. The regular `<script>` block, next to `<script setup>`, exports a plain list; each state renders the view with its `props`:

```vue
<!-- @studio-id vhme000000000001 -->
<!-- @studio-state stmb000000000001 Member -->
<!-- @studio-state stnw000000000001 New user -->
<script setup lang="ts">
defineProps<{ name: string }>()
</script>

<script lang="ts">
export const states = [
  { title: 'Member', props: { name: 'Ana' } },
  { title: 'New user', props: { name: '' } },
]
</script>
```

- Titles are read statically, without running the view (`types/view/states.ts`): plain text in quotes on each state object, written in place, different from each other, on one line and without `-->`. A `title` inside props doesn't count. A view whose only script is the regular `<script>` also needs a `default` export.
- Each state's identity is a leading comment, `<!-- @studio-state <id> <title> -->`, matched by title and written by assignment after the view's own. State IDs count with every other identity in the audit.
- The view's check reports unreadable and repeated titles, and comments that name no state ("When renaming a state, change its title in the comment too…"). Renaming a state means changing its title in code and comment together; a rename in code alone is reported, not given a new link.
- The preview renders a state with its props, kept reactive: editing them on disk updates the open state without reloading the document (Vue's hot reload decides whether the view keeps its own state). Moving between states remounts the view. A state whose title the running view no longer exports shows "<View>.vue has no state titled "<title>" in export const states."

## System options

A view may also export its system's options from the regular `<script>`, and each state may override them in its own `system`, option by option (an option the state doesn't name keeps the view's value):

```vue
<script lang="ts">
export const system = {
  user: 'admin',
  sample: { queries: { UpcomingEventInstances: events } },
}

export const states = [
  { title: 'Spanish learner', system: { locale: 'es', user: 'learner' } },
  { title: 'Signed out', system: { user: null } },
]
</script>
```

The preview runtime (`tooling/preview/runtime/mount.ts`) merges them and passes the result to the system's app factory as `system`, beside `component` and `props`. What the options mean is the system's own (Endless Studios: `locale`, `user` and `sample`; see its README); a document with no system ignores them. In development, a hot update that changes the options, compared by value with functions by their source, builds the screen again with a new app in the same document; one that changes only props updates them in place.

## Links and navigation inside a view

Views name other artifacts of their prototype by path, from `#studio/prototype` (`tooling/preview/runtime/navigation.ts`, an alias of the preview documents):

| Export                         | What it does                                                                                         |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `<PrototypeLink to="...">`     | An anchor to the artifact at a path inside the prototype (`flows/Details`), or a studio `/` address. |
| `usePrototypeNavigate()`       | A function that opens a path, or a `/` address (`{ replace: true }` replaces the history entry).     |
| `usePrototypeArtifactHref()`   | A function returning a path's permanent address, with the studio's base path.                        |
| `useIsPrototypeArtifact(path)` | Whether the view at the path (or one of its states) is on screen.                                    |

A path may keep its extension, `?query` and `#anchor`. An unknown or ambiguous path throws an error naming it, which the preview shows. Inside a view:

- A link to a studio address opens it in the studio (the preview document sends `navigate`), so history, Back and Forward and the highlighted row stay right. Opened alone in a tab, the document shows its own views in place, with its own history.
- `#anchors` scroll inside the view, without a history entry.
- Other `http(s)` addresses open in a new tab. Modified clicks (⌘ or Ctrl, Shift, Alt), downloads, links with a `target` and links a view handles itself are the browser's.
- The studio's shortcuts (⌘K, ⌘;, ⌘' and ⌘⇧') pressed in a view reach the studio, except while typing in a field there; ⌘' and ⌘⇧' are left alone while a dialog or menu is open in the view, and a view may handle ⌘K first.

## Lo-fi

A view whose leading comments hold `<!-- @lofi -->` is lo-fi: its components and behavior stay, drawn in grayscale with the bundled handwritten font Comic Neue (`tooling/preview/runtime/lofi.css`, from `@fontsource/comic-neue`), so nothing is fetched from another site. "Make lo-fi" and "Make hi-fi" in a view's context menu add and remove the comment through the file service (`POST <base>_studio/files/tree` `{ op: "lofi" }`), only where you may change the prototype (your own, or any as an Admin, and not archived). An open preview switches in place, without reloading its document. A file type offers this by declaring `fidelity` (`FidelityAdapter`: `isLofi`, `setLofi`).

## Live updates

In development the studio keeps up with files changing on disk, by an agent, an editor or the studio, without reloading the page:

- The dev server watches the prototypes folder and the studio configuration. A burst of changes (a folder move is many) becomes one refresh; a change during a refresh is picked up after it. When the manifest changes, it is pushed to every open tab over Vite's HMR channel (`studio:manifest`, with every artifact list), so lists and navigation follow within a second. Content carries a `revision`; the same content arriving twice applies once. A tab that was disconnected fetches the manifest again when it reconnects.
- Each running preview document hears of the change too. Its views module (`virtual:studio-preview-views`) is reloaded in place when its views changed (a new, removed, renamed or emptied view), so a new view renders without a restart.
- Editing a view updates it in its preview through Vue's hot reload, keeping its state where Vue can; style changes apply live. Opening another view or reloading resets it.
- `tooling/live/live-manifest.ts` also holds the queue a tab's own changes go through: one at a time, in order, each reply's content applied once, with an `X-Studio-Tab` header. File operations that change the manifest (ticket 11) send their changes through it; saving a file's source doesn't change the manifest and doesn't use it.

On the deployed site there are no live updates: the manifest is built once, and a prototype's artifact list is fetched when the prototype first opens, then kept.

## Source mode

Locally, any artifact's source opens in place of its page: from "File actions" → "Edit source" (or "View source"), from "Open source" on an artifact that can't open, or with ⌘' / Ctrl+', also while a view has focus (not while typing in a form field or while a dialog or menu is open; inside the editor it works). The address gets `?mode=source`, so it can be shared and reloaded; the same shortcut, or "Done", returns to the rendered page and focuses it. The editor has focus when it opens. A named state's source is its view's file. Source opens even when the view is broken, so it can always be repaired.

The rendered page stays alive while its source is open, hidden and inert: a view keeps its state and its hot updates, so returning shows the saved change in the running view.

The editor (`app/components/source/`, CodeMirror 6 wrapped in `SourceCode.vue`) shows the file's path, "Read-only" or "Unsaved changes", Save (tooltip "Save (Ctrl+S)", ⌘S on Apple computers) and Done. It has line numbers, the active line, bracket matching and closing, folding, undo history, search (⌘F / Ctrl+F) and matching-selection highlights, in the studio's colours (Flexoki syntax colours, light and dark). Syntax comes from the extension: Vue for views, TypeScript and JavaScript, Markdown (wrapping, with YAML frontmatter and Mermaid fences), JSON, Mermaid, CSS and YAML. Screen readers hear it as "Source of <path>"; a read-only editor stays focusable for search and keyboard selection.

- **Saving.** ⌘S / Ctrl+S or Save writes through the file service and confirms with "Saved"; the service's warnings show as error toasts, and a refused save shows its reason.
- **Changes on disk.** A clean editor reloads by itself when the file changes elsewhere. With unsaved changes, a bar says "This file changed on disk while you were editing it." with "Load the new version" and "Keep mine" (the next save overwrites). A save over a version the editor hasn't seen is refused, and the bar shows.
- **Leaving.** With unsaved changes, Done, another page, a reload or closing the tab asks first: "Discard your changes?" with "Keep editing" and "Discard" (closing and reloading use the browser's own prompt).
- **Who may save.** Owners save their own prototypes and Admins all of them; anyone else, an archived prototype, or a Git identity that matches no profile reads the source read-only, and the editor says why. The server checks again on every save.

The deployed site has no source mode: `?mode=source` and the shortcut show the rendered page, and the editor's code isn't in the build.

### The file service

While `yarn dev` runs, `tooling/files/` adds Nitro routes the studio's own pages call (same-origin only). They read the configuration, profiles and your Git identity again on every request. The static build has none of them.

| Route                                                                     | Does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET <base>_studio/files/source?prototype=<id>&artifact=<id>`             | The artifact's text, its `version` (a hash of the text), its `path`, and `editable` with the `reason` when you may not save.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `PUT <base>_studio/files/source` `{ prototype, artifact, content, base }` | Saves over version `base`. 409 `changed` if the file changed on disk since; 403 with the reason (`identity`, `owner`, `archived`); 409 `identity` if the permanent ID was changed or removed; 413 over 750 KB; 404 for helpers, hidden files, links leading out of the prototype and unknown IDs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `GET <base>_studio/files/tree?prototype=<id>`                             | The prototype's files and folders at any depth (in the tree's order, dot files left out), its repository `folder`, and `editable` with the `reason` when you may not change them.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `POST <base>_studio/files/tree` `{ op, prototype, … }`                    | `create` `{ parent, name, type }`: a folder (`type: "folder"`) or a file of that type, its extension added, from its type's `template` with a new permanent ID (helpers get none). `rename` `{ path, name }`: in place; a file of a type keeps its extension. `move` `{ path, to }`: into the folder `to` (`""` for the top level), after the arranged entries there; a folder can't move into itself. `reorder` `{ path, before, to? }`: before the sibling `before` (`""` for last), after moving into `to` when given, and saves the order in `meta.json`. Renames and moves repair references (see "References follow renames and moves") and answer how many files changed, `relinked`; if they can't, nothing moves (409 `references`). Renames, moves and deletes keep `order` in step. `delete` `{ path }`: to the computer's own trash, answering `trashedTo` (`recycle-bin` or `trash`). `lofi` `{ artifact, lofi }`. `reveal` `{ path }`: shows it in the file browser. `open` `{ path }`: in a code editor (`LAUNCH_EDITOR` first, then Cursor, VS Code, VSCodium, Zed, Sublime Text), else in the file browser with a `message` saying what else to do. Changes answer 403 with the reason, 409 `exists` for a taken name, 400 for a name with a slash or a leading dot, and refuse to rename, move or delete `meta.json` and the prototype's own folder; `reveal` and `open` work in any prototype. |
| `POST <base>_studio/files/prototypes` `{ title, system }`                 | Creates a prototype in your own space (`system`: a system's ID, or `null`) and answers 201 with its `id`, `folder` and starting `artifact`. 400 for an invalid title or system, 403 `identity` if you aren't a registered contributor, 409 `exists` for a folder you already have.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

Changed content files reach open pages as `studio:source` with their paths, which is how an open editor hears of outside edits; files and folders added or removed reach them as `studio:files`, which is how file trees stay current. A save also refuses (409 `identity`) to drop or change the permanent ID of a named state the view still declares. Renaming, duplicating, archiving and deleting prototypes arrive with ticket 13. `STUDIO_LAUNCH_LOG` (browser scenarios) notes the programs the service would start in a file instead, as if no code editor were installed.

## The file tree

`components/PrototypeFiles.vue` fills the prototype's navigation with the shared tree (`app/components/files/FileTree.vue`, on Nuxt UI's `UTree`, `UContextMenu` and `UDropdownMenu`).

- **What it lists.** Locally, the real files and folders, live from the file service (`app/composables/useFileTree.ts`): artifacts with their type's icon and readable title ("user-settings.vue" reads "User Settings", "lofi" reads "Lo-fi"; `tooling/manifest/titles.ts`, also the manifest's titles) and the file name as tooltip, folders that hold them (titled the same way), and empty folders. Helpers (`_` names), `meta.json`, images and other files appear only with "Show all files" (the "…" menu, kept in this browser for every prototype as `design-studio:show-all-files`); the heading then reads "Files" instead of "Artifacts", other files keep their names with the extension dimmed, and choosing one opens it in your code editor. A view's named states are rows under it. On the deployed site, the published artifacts in order with their folders.
- **Current page and folds.** The open artifact (or one of its states) is selected with `aria-current="page"`, and its folders open. Folders start open; the ones you close stay closed per prototype while the app stays open. The header's Filter and "Expand all" / "Collapse all" fade in while the pointer or focus is in the tree; "+" (New) is always shown, last.
- **Filter.** Matches file names, readable titles and paths, keeping and opening the folders that hold matches; "No matching artifacts." when nothing does. Escape clears the text, then closes the field.
- **Changing files** (only where you may change the prototype). "+" offers "New <type>" for each installed file type (views first) and "New folder"; a folder's menu offers the same inside it. An inline name field opens ("untitled", "new-folder", selected); Enter or leaving it confirms, Escape cancels, and a new artifact opens right away. F2 or "Rename" renames in place (the name selected without its extension); the open artifact keeps its page, since its address is its permanent ID. Delete (or ⌘⌫), or "Delete", asks first ("Delete “X”?", saying it moves to the Recycle Bin or the Trash and, for a folder, naming the files inside the tree isn't showing), then says where it went; a deleted open artifact leaves for the prototype's first one. Refusals show as error messages, with "It's hidden: choose Show all files in the … menu." when the name clashes with a hidden file. `meta.json` can't be renamed or deleted.
- **Arranging** (only where you may change the prototype). Drag a row to the top or bottom edge of another to put it before or after (a line shows where it lands), onto a folder to move it inside (the folder highlights), or onto the empty space below the rows to move it to the top level, last. An open folder's lower edge is inside it, and a folder can't go into itself. Alt+↑ / Alt+↓ (Option on a Mac) moves the focused row among its siblings and keeps it focused. While filtering, only moving into a folder works: the rows shown aren't a folder's own. The order is saved in `meta.json` and decides only what opens next: the page on screen stays. A rename or move that repaired references says "Renamed. References updated." or "Moved. References updated."
- **Dragging out.** An artifact's row, or a named state's, carries its full permanent address (`text/uri-list` and `text/plain`), ready to drop onto a canvas or anywhere that takes links, on the deployed site too.
- **Row menus.** Grouped: New (folders); Edit source (View source when you can't change it, with ⌘' or Ctrl+'), Open in editor, Show in Explorer (Reveal in Finder on macOS, Show in folder elsewhere), Copy link (the full address) and Copy path (repository-relative), the first three local only; Make lo-fi / Make hi-fi for types with `fidelity`; Rename; Delete. The deployed site's menus have only Copy link and Copy path.
- File types give the tree an `icon` (an Iconify name) and may give a `template` file whose `template(title)` export is a new file's source (`tooling/modules/contract.ts`). A new view is empty: just its ID comment.

## References follow renames and moves

A rename or move in the tree, or one made outside the studio while `yarn dev` runs, repairs the references to and in what moved, inside the prototype. Pages are addressed by permanent IDs, so an open page stays on its artifact, with its search and hash, wherever the file goes.

- **What is repaired.** Each module names its reference adapters in `module.ts` (`references`: a file whose `references` export lists `ReferenceAdapter`s from `tooling/files/references.ts`, with the grammars in `tooling/files/reference-syntax.ts`). They keep working while their module is turned off. This module's adapters read `.vue` files (imports and other strings in their scripts; `to`, `href` and `src` attributes and expressions in their templates; imports and `url()` in their styles), the code beside them (`.ts`, `.js` and the like) and `.css`. Documents repair Markdown links, images and reference definitions outside code; canvases repair element links to files, as a new version of the element.
- **How.** A relative import, link or URL that reached a moved file is rewritten to reach it from where it is now, keeping its extension or its absence, its `?query` and `#anchor`; a moved file's own relative references are rebased. A view navigation path (`flows/Details`) follows its artifact; a path of one segment (`Details`) counts only in a `to` attribute or as the first argument of `navigate(…)`, `usePrototypeArtifactHref()(…)` or `useIsPrototypeArtifact(…)`, so a word that only looks like a path stays. Permanent addresses, other sites, aliases (`#studio/prototype`) and references leaving the prototype are left alone. Every change is prepared first; if any file can't be read or changed meanwhile, nothing changes and the move is undone.
- **Outside the studio.** The dev server watches the prototypes you may change (`tooling/files/watch-moves.ts`, run by `tooling/files/server/moves.ts`) and compares each file's identity on disk with how it was. Only certain moves are repaired: copies, deleted files, moves into another prototype and ambiguous cases are not guessed. The terminal running `yarn dev` notes the files it updated.

## Views in documents

A document embeds a view, or a view's named state, of its own prototype by linking it on its own line with image syntax (`![Sign in](./flows/Sign in.vue)`, or the state's permanent address); the Documents module's README has the rules. The view's `ViewEmbed.vue` shows it as a picture of its desktop layout: the preview document at 1440 px wide, scaled to the text's width and cropped to the embed's height (220 to 440 px). It takes no clicks or keyboard focus, is hidden from screen readers and can't navigate; the frame's header opens the view. It says "Loading preview…" until the view first renders and "This view has an error. Open it to see what is wrong." when it fails, and updates by itself when the view's source changes, like the view's page. Navigation helpers (`#studio/prototype`) work inside it, resolved in the document's prototype.

A file type gives documents a preview by declaring `embed` (a Vue component taking `prototype`, `artifact`, `width` and `height`) and an `icon` for its cards; without `embed` it shows as a card.

## The preview channel

The studio and a preview document talk over a versioned, validated message channel (`tooling/preview/protocol.ts`, channel `studio-preview`, version 1). The frame's address carries the first artifact and a `session` the studio chose for the frame; later views travel by message, so the frame stays while the person moves between views of the prototype.

| Message     | From     | Meaning                                                                                                                                                                                 |
| ----------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ready`     | document | A load of the document started, with its `runtime` ID. The studio answers with `configure`.                                                                                             |
| `configure` | studio   | Show this artifact. The document keeps the outgoing view on screen, inert, until the next is ready, and updates its own address.                                                        |
| `status`    | document | `loading`, `ready`, `error` (with the detail) or `empty`, numbered by render attempt.                                                                                                   |
| `navigate`  | document | Open this studio address (a path on the studio's origin with its base path), optionally replacing the history entry. Sent for links and `usePrototypeNavigate` in the view.             |
| `shortcut`  | document | One of the studio's shortcuts was pressed in the view: `palette`, `navigation`, `source` or `grid`. The studio handles it as if pressed in its own window.                              |
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
