# Prototypes

Prototypes and their artifacts. A prototype is a folder `src/prototypes/<contributor>/<folder>/` with a `meta.json`; its artifacts are the files in it that an enabled file type claims. This module is required.

- `module.ts` declares the module, its pages and the view file type.
- `pages/prototype.vue` is `/prototypes/<prototype-id>`. It replaces itself in the browser history with the prototype's first artifact, keeping the query and the `#anchor`.
- `pages/artifact.vue` is `/prototypes/<prototype-id>/artifacts/<artifact-id>`. It shows the viewer (`components/PrototypeViewer.vue`): the prototype's title, its system and a plain list of its artifacts in file-tree order in the section navigation (`AppSectionNav`: hidden and shown with ⌘;, resized from its edge, remembered in this browser), the open artifact beside it, and the tab title "<Prototype> — <Artifact> — <studio name>". An unknown prototype is "Page not found"; an unknown artifact is too, with the prototype's navigation kept around it. A file type's page that crashes shows its error with "Copy error" (`AppFileBoundary`) and leaves the rest of the viewer working.
- `components/PrototypesHome.vue` is the module's Home block: the five newest prototypes by `created`, each opening its first artifact. It comes first locally and after what colleagues come for on the deployed site.
- `types/view/` is the view file type: `.vue` files, with the identity reader and the page that renders a view.

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

A preview document starts in the studio's color mode before it paints, and follows it while open without reloading, so a view keeps its state. The root element gets the `dark` class and a matching `color-scheme`. A system whose `colorModes` has no `dark` stays light (Endless Studios is light only).

In development each preview document has its own Vite server, started on its first request; the build emits each document under `_preview/` beside the app.
