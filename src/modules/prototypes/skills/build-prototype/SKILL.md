---
name: build-prototype
description: Create or edit a prototype view, a Vue file that renders in its assigned system's preview document.
---

# Build a prototype view

1. Find the prototype's folder, `src/prototypes/<contributor>/<folder>/`, and read its `meta.json`. `systemId` names its system, or `null` for no system.
2. For a system, read that system's `AGENTS.md` and follow it: it says which components, stand-ins and strings views use.
3. Write the view as a `.vue` file in the prototype. Put helpers that are not artifacts in a folder whose name starts with `_`.
4. Leave the permanent identity to the studio. While `yarn dev` runs, a new view in your own prototype gets its `<!-- @studio-id <id> -->` comment at the top within a second. Without the dev server, run `yarn studio identify src/prototypes/<contributor>/<folder> --json` to preview and then `--yes`. Never write, change or copy an ID by hand: keep the comment when you edit, rename or move the file, and give a copied file no ID so it gets its own. `yarn studio identity-audit` reports missing and duplicate IDs; the build fails on them.
5. Use `<script setup lang="ts">`. In a system's prototype, Vue, the system's components and its stand-ins are auto-imported. In a prototype with no system, import from `vue` and style the view yourself; it starts from browser defaults, and the root element has the `dark` class while the studio is in dark mode.
6. Open `/prototypes/<prototype-id>/artifacts/<artifact-id>` in the running studio to check it. The view renders in its system's preview document; "Open in a new tab" opens that document alone. New, renamed and removed views appear without a restart, and edits update the open preview live.
7. Before trusting what the preview shows, check its state: in the studio, the element with `data-preview-session` has `data-preview-state` (`ready`, `error`, `empty`, `loading`) and `data-preview-freshness` (`stale` means the latest save did not render yet or failed). In a document opened alone, read `data-preview-state` on `<html>`. On an error, read the message under "This page couldn't load" or the out-of-date notice; it names the file, line and column. Fix the file; the preview recovers by itself.
8. A new view file that holds only its identity comment shows "This view is empty" until you write it.
9. The person may be editing the same file in the studio's source mode (`?mode=source` on the artifact's address, or ⌘' / Ctrl+'). Your writes reach their editor: a clean editor reloads, and one with unsaved changes offers "Load the new version" or "Keep mine". Their save never silently overwrites yours, and the studio refuses saves that change or drop the identity comment.
