---
name: build-prototype
description: Create or edit a prototype view, a Vue file that renders in its assigned system's preview document, with its named states, links to other views and lo-fi marker.
---

# Build a prototype view

The [prototypes README](../../README.md) is the contract; read the sections you need (views, named states, navigation, lo-fi, permanent identities).

## Before you start

1. Find the prototype's folder, `src/prototypes/<contributor>/<folder>/`, and read its `meta.json`. `systemId` names its system, or `null` for no system. Work only in your own prototypes unless you are an Admin.
2. For a system, read that system's `AGENTS.md` and follow it: it says which components, stand-ins and strings views use.
3. A new prototype is a folder with a `meta.json` (the README lists its fields) that names its `systemId`, or `null`. Run `yarn studio identify src/prototypes/<contributor>/<folder> --json`, then `--yes`, to give it its IDs and owner.

## Write views

4. A view is a `.vue` file in the prototype; its path inside the prototype, without `.vue`, is how other views link to it (`flows/Sign in`). Put helpers that are not artifacts (components, data) in a folder whose name starts with `_`, such as `_parts/`.
5. Use `<script setup lang="ts">` and a `<template>`. In a system's prototype, Vue, the system's components and its stand-ins are auto-imported. In a prototype with no system, import from `vue` and style the view yourself; it starts from browser defaults, and the root element has the `dark` class while the studio is in dark mode.
6. An empty view is a `.vue` file holding only comments. The studio shows "This view is empty" with a prompt to copy until you write it. To add a view someone will fill in later, write the file with nothing but a comment, such as `<!-- Sign in, for returning members -->`.
7. Leave the permanent identity to the studio. While `yarn dev` runs, a new view in your own prototype gets its `<!-- @studio-id <id> -->` comment at the top within a second. Without the dev server, run `yarn studio identify src/prototypes/<contributor>/<folder> --json` to preview and then `--yes`. Never write, change or copy an ID by hand: keep the comment when you edit, rename or move the file, and give a copied file no ID so it gets its own. `yarn studio identity-audit` reports missing and duplicate IDs; the build fails on them.

## Named states

8. For variations of one screen (a member, a new user, an error, an empty list), declare named states in the view instead of copying the file. Export a plain list from the regular `<script>` block, next to `<script setup>`; each state renders the view with its `props`:

   ```vue
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

   Titles are plain text in quotes, written in place, each different, on one line and without `-->`. The studio reads them without running the view, so never compute a title or build the list elsewhere. A view whose only script is the regular `<script>` must also export its component as `default`; with `<script setup>` beside it, it needn't.

9. Each state gets its own permanent ID as a comment at the top, `<!-- @studio-state <id> <title> -->`, matched by title. The dev server or `yarn studio identify` writes it; never write it yourself. Each state is listed under its view in the navigation and opens at its own address. To rename a state, change its title in the code and in its comment together: the comment keeps its link. A comment that names no state, a repeated title or one that isn't plain text stops the build, naming the file and title. Remove a state's comment only when removing the state.

## Links between views

10. Link to another artifact of the prototype by its path, never by its ID or address. Import the helpers from `#studio/prototype`:

    ```vue
    <script setup lang="ts">
    import { PrototypeLink, usePrototypeNavigate } from '#studio/prototype'
    const navigate = usePrototypeNavigate()
    </script>

    <template>
      <PrototypeLink to="flows/Details">Details</PrototypeLink>
      <UButton @click="navigate('flows/Details')">Continue</UButton>
    </template>
    ```

    `usePrototypeArtifactHref()` gives a function returning a path's address; `useIsPrototypeArtifact('Home')` says whether that view (or one of its states) is on screen. A path may keep its `?query` or `#anchor`; a target starting with `/` is a studio address. An unknown or ambiguous path stops the view with an error naming it. Links open in the studio, so Back and Forward work; `#anchors` scroll inside the view; other web addresses open in a new tab. When you rename or move a view, update the paths that link to it.

## Lo-fi

11. A lo-fi view keeps its components and behavior and is drawn in grayscale with a handwritten font. People switch it with "Make lo-fi" and "Make hi-fi" in the view's context menu in the navigation. In code, it is a comment at the top, `<!-- @lofi -->`; add or remove only that comment.

## Check it

12. Open `/prototypes/<prototype-id>/artifacts/<artifact-id>` in the running studio, or a state's own ID. The view renders in its system's preview document; "Open in a new tab" opens that document alone. New, renamed and removed views and states appear without a restart, and edits update the open preview live.
13. Before trusting what the preview shows, check its state: in the studio, the element with `data-preview-session` has `data-preview-state` (`ready`, `error`, `empty`, `loading`) and `data-preview-freshness` (`stale` means the latest save did not render yet or failed). In a document opened alone, read `data-preview-state` on `<html>`. On an error, read the message under "This page couldn't load" or the out-of-date notice; it names the file, line and column. Fix the file; the preview recovers by itself.
14. Run `yarn studio identity-audit` after adding views or states; it must report no missing or duplicate IDs.
15. The person may be editing the same file in the studio's source mode (`?mode=source` on the artifact's address, or ⌘' / Ctrl+'). Your writes reach their editor: a clean editor reloads, and one with unsaved changes offers "Load the new version" or "Keep mine". Their save never silently overwrites yours, and the studio refuses saves that change or drop the identity comment.
