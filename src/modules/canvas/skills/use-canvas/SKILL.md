---
name: use-canvas
description: Create or edit an Endless Design Studio canvas, an .excalidraw page of views, documents, notes and arrows. Use only when the Canvases module is enabled.
---

Read this module's [README](../../README.md) first; it describes the file, how a canvas opens and what the editor offers.

1. Before editing, run `yarn studio context src/prototypes/<key>/<id> --json` and respect `canEdit`. A canvas you may not edit opens read-only in the studio too.
2. A canvas is one `<name>.excalidraw` file inside a prototype. Start a new one from the empty scene in `types/canvas/check.ts` (`template`); its name in the navigation is the file name.
3. Leave the permanent identity to the studio: the dev server adds a new canvas's top-level `"studioId"` in your own prototype. For files written while it isn't running, run `yarn studio identify <prototype folder>` and apply with `--yes`. Never change or copy an existing `studioId`.
4. Keep items within the canvas's own prototype: link them as `/prototypes/<prototype-id>/artifacts/<artifact-id>`. To show another prototype's view, copy it into this prototype first.
5. Never store images; put the working view on the canvas instead. Keep `"files": {}` and `"studioVersion": 1`.
6. Prefer native Excalidraw elements: text for annotations, with shapes, lines, arrows and frames. The Library's sticky notes are optional.
7. Preserve the person's arrangement; move existing content only when the request needs it, and keep changes small enough to review. You can edit the file while the canvas is open: the studio takes your change in live and merges it with the person's unsaved edits, per element by `version`. Keep each element's `id`, and raise its `version` (with a new `versionNonce`) when you change it, or the open canvas may keep its own copy. Write the file in one go.
8. Check the result: `yarn build` refuses a canvas with invalid JSON, no `elements` list, images, stored files, links to another prototype or an unknown `studioVersion`, and names the file. Then open the canvas in the studio.

Report which canvas changed and what you placed. Canvas tools for agents (`yarn canvas`, `window.__studioCanvas`) are not in the Vue studio yet; edit the JSON directly until they are.
