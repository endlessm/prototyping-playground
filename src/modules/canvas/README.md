# Canvases

A page to arrange things on: views, documents and diagrams of its own prototype beside native Excalidraw text, shapes and arrows. It is [Excalidraw](https://github.com/excalidraw/excalidraw) 0.18.1 with the studio's menu, shortcuts and look. This module is optional: an Admin turns it off with `yarn studio disable canvas`, which keeps the files and lists them as unavailable, and nothing outside this folder imports it. Agent contract: [use-canvas](skills/use-canvas/SKILL.md).

Native Excalidraw tools are the authoring default, including text for annotations. The sticky notes in the Library are an example asset, not the standard annotation.

## The file

- **One file per canvas:** `<name>.excalidraw`, anywhere in a prototype: an Excalidraw scene as JSON. Its name in the navigation is the file name without the extension, with the canvas icon.
- **Identity:** a top-level `"studioId"` next to `"studioVersion"` (`types/canvas/identity.ts`). The dev server assigns it to a new canvas in your own prototype; `yarn studio identify <prototype folder> --yes` fills it in for files written by hand. A file that isn't valid JSON keeps its identity, so it still opens and says what is wrong.
- **Format** (`types/canvas/format.ts`, shared by the app, the build and the command line): Excalidraw's own scene (`"type": "excalidraw"`, `"version": 2`), so it still opens on excalidraw.com, kept slim and stable so canvases diff cleanly. No deleted elements, no images and an empty `files`; fields at Excalidraw's defaults and the volatile `updated` dropped (`version`, `versionNonce` and `index` stay: merging needs them); numbers rounded to 2 decimals, keys sorted, 2-space JSON with a trailing newline. Only the background and grid size of the app state are stored; the camera and the grid and snap toggles are personal. `studioVersion` is this studio's version of the shape (1): an unknown one is refused, a newer one opens read-only and is never saved over.
- **Links:** an item's `link` is its studio address, `/prototypes/<prototype-id>/artifacts/<artifact-id>` (a named state's address is its own ID), never a whole URL, so a canvas works on any host and under any base path. Excalidraw holds whole URLs: they are built on open (`withOrigin` in `island/Editor.ts`) and turned back into addresses on save (`storedLink` in `format.ts`); any other link is kept as it is. The address is made of permanent IDs, so a rename or move inside the prototype leaves it as it is; anything that repairs links reads and writes this form.
- **Check** (`types/canvas/check.ts`): the build stops on a canvas that isn't valid JSON, isn't one object, has no `elements` list, holds an image, has non-empty `files`, links to another prototype or has an unknown `studioVersion`, and each message says how to fix it. Only `/prototypes/<this prototype>/artifacts/…` links count as its own; the older contributor/prototype paths don't. A new canvas (`template`) is an empty scene with a white background.
- **Systems:** a canvas doesn't use its prototype's design system, so it never loads a preview document of its own.

## Opening

`components/CanvasPage.vue` is the artifact page; it keys `CanvasScene.vue` by the canvas's ID, so another canvas starts a fresh editor. The scene loads the editor's code, the file's text and whether you may edit it together before the editor mounts, so it never shows read-only first:

- **Locally**, the text comes from the dev server's file service, which also decides editing: your own prototype, or any as an Admin.
- **Deployed**, every canvas is bundled as the module's `files` build data (`types/canvas/bundle.ts`, by permanent ID) and opens read-only.

One quiet surface (`CanvasOpening.vue`) covers the scene. Screen readers hear "Opening canvas" at once; it shows after 200 ms as a text shimmer, static under reduced motion. The scene stays busy, inert and hidden until `useCanvasOpening` reveals it once with a 160 ms fade (none under reduced motion): after the opening camera has painted (a timer backs up animation frames in hidden tabs) and the live previews visible in the first view settle, never more than 2 s later. Previews report settling through `data-preview-state`, `data-artifact-phase` or `role="alert"` inside `[data-canvas-embed-id]` (`utils/opening.ts`). A file that can't be read shows "This canvas couldn't be opened" with the reason. A canvas that stays empty for half a second shows a hint, worded for editing or reading.

The camera opens where you left it (this browser, `design-studio:canvas-camera:<canvas id>`, saved 400 ms after moving and on leaving), else fitted to the content at 90% of the space and never above 100% (`utils/camera.ts`). A damaged remembered camera is ignored.

## Saving and outside edits

Only locally, and only on a canvas you may edit (not a newer format). `utils/canvasFile.ts` is the framework-neutral logic; `composables/useCanvasFile.ts` connects it to the editor, the file service, toasts and leaving:

- **Edits save by themselves** through the same file service as the Source view (`PUT <base>_studio/files/source`), 1.2 s after the last change, or at least every 5 s during a long run of edits. Only a new scene version is an edit: selecting, panning, zooming and the scene Excalidraw hands back after loading never save, and identical text isn't rewritten. One save at a time; edits made meanwhile save next. Every save keeps the canvas's `studioId`.
- **Each save names the version it builds on.** If the file changed meanwhile (409 `changed`), the newer file is merged in and the union saved, up to 3 times; then saving pauses and a toast says "Couldn't save: the file keeps changing." until Retry. Other failures show one toast, "Couldn't save this canvas. Trying again.", and try again after 2 s, doubling up to 30 s. Both toasts offer Retry, as the status does, since they sit over it.
- **The save status** (`CanvasSaveStatus.vue`) at the bottom right says "Saved", "Saving…", "Unsaved changes" or "Couldn't save" with Retry, as a `role="status"`.
- **Leaving:** hiding the tab or leaving the canvas saves at once. Navigating inside the studio first tries to finish saving; if that fails, `CanvasLeaveModal.vue` offers Keep editing or Discard (`onBeforeRouteLeave` and `onBeforeRouteUpdate`). A reload or closing the tab while anything is unsaved shows the browser's leave warning.
- **Outside edits:** when the dev server says the file changed (`studio:source`, or a reconnect), the canvas reads it. Its own saves coming back are recognized and ignored, and a half-written or invalid file is skipped until the next change. With nothing unsaved the file replaces the scene; with unsaved edits both are merged (`utils/mergeRemote.ts`, with Excalidraw's own `reconcileElements`): per element the newer version wins, elements deleted in the file are removed, elements only here are kept and the union is written back. Either way the change comes in without a reload and outside the undo history.

## The editor island

Excalidraw is React. `island/mount.ts` mounts it in a React root of its own inside the Vue page, loaded on first use (so neither React nor Excalidraw is in the main bundle) and pre-bundled in development (`optimizeDeps` in `nuxt.config.ts`), so the first canvas doesn't make Vite reload the page. React and React DOM are used nowhere else. The island is plain TypeScript with `createElement`: Nuxt's JSX belongs to Vue.

| File                | What it does                                                                                                                                                                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Editor.ts`         | Wires Excalidraw: the opening camera, the studio's colour mode (`theme`), Nunito for new text, read-only view mode, the library, wheel gestures over linked title bars, camera memory, scene changes for saving, and taking in the file |
| `menu.ts`           | The trimmed menu (`UI_OPTIONS`, `CanvasMenu`): Undo, Redo, Toggle grid, Snap to objects, Help, Hide controls and the background swatches; read-only canvases keep only Hide controls                                                    |
| `shortcuts.ts`      | ⌘. / Ctrl+. hides the controls, ⌘⇧' / Ctrl+⇧' the grid, N a sticky note. ⌘' / Ctrl+' stays the studio's (the canvas's source)                                                                                                           |
| `stickyNotes.ts`    | The Library's four sticky notes and the note N adds                                                                                                                                                                                     |
| `helpDialog.ts`     | Hides the Help dialog's rows for shortcuts that don't work here                                                                                                                                                                         |
| `ControlTooltip.ts` | Fast tooltips with the shortcut keys                                                                                                                                                                                                    |
| `canvas.css`        | Excalidraw's UI in Nuxt UI's tokens (`--ui-primary`, `--ui-bg`, `--ui-border`, `--ui-radius`) in both modes, hidden pieces, and the narrow layout                                                                                       |

The canvas follows the studio's colour mode from the first paint and live (`useColorMode`); Excalidraw's own theme toggle is gone. Gestures: trackpad scrolling pans, ⌘/Ctrl + wheel and pinch zoom, and the canvas contains overscroll so a sideways swipe never goes back a page. Images are off three ways: no image tool, shortcut, paste or drop (`tools.image: false`), never stored, and refused by the build.

Excalidraw's fonts load from its CDN (esm.sh). Excalidraw's colour pickers call themselves dialogs, so the canvas marks itself `data-inline-dialogs` and the studio's shortcuts still work beside them.

## The Excalidraw patch

Yarn applies `.yarn/patches/@excalidraw-excalidraw-npm-0.18.1.patch` on install (the `patch:` protocol in `package.json`), to `dist/dev` and `dist/prod`:

- **Hide the link icon:** `renderLinkIcon` and `getElementLinkAtPosition` skip elements with `customData.hideLinkIcon`. Items on a canvas are embeddables whose `link` is their address; without this, Excalidraw paints a link icon on each, and its spot shows the raw URL and opens it.
- **Always the desktop layout:** `isMobileBreakpoint` returns false, so a canvas narrower than 730 px beside other panels keeps the desktop layout; `canvas.css` keeps its top row on one line (tools scroll sideways at 700 px, the Library button becomes an icon, tools shrink at 560 px).

Upgrading Excalidraw: `yarn patch @excalidraw/excalidraw`, make the same two changes in the printed folder, `yarn patch-commit -s <folder>`, then check that a canvas item shows no link icon and a narrow canvas keeps the desktop layout. Remove the patch when Excalidraw offers both.

## Not yet

Live embeds, cards and dropping files from the navigation come with 20 (embedded previews then refresh when the artifacts they show change); the agent tools, `yarn canvas` and canvases inside documents with 21. Until 20, an item on a canvas shows as a plain placeholder.

## Remove it

Preview `yarn studio remove canvas` and apply it with `--yes`. Canvas files stay in prototypes. The `@excalidraw/excalidraw`, `react` and `react-dom` dependencies, the patch and the `optimizeDeps` entries need separate cleanup.
