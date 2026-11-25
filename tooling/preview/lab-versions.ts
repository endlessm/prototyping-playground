// The Lab's versions on their stage: a version of an app component (a view
// holding a `@lab-version` marker, `../systems/app-versions.ts`) renders
// inside its component's frame, the system's component file, exactly as
// the original does, with only the frame's import of the original pointing
// at the version. The frame is loaded under an address of its own for each
// version, so the swap stays in that one preview entry and the rest of the
// app copy, the frame's sample data and layout fixes are untouched. The
// version is reached through a small component that also hands it the
// props it declares that the frame doesn't, so props a version adds can be
// tried from the Playground's dials. In development a version's draft
// (`../files/drafts-folder.ts`, `versionDraftsDir`) takes its place on the
// stage while there is one. Node only.
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'
import { appCopy, type AppFile } from '../systems/app-copy.ts'
import { genericAppComponents, presentedApps } from '../systems/catalog.ts'
import type { InstalledSystem } from '../systems/registry.ts'
import { posix } from '../manifest/build.ts'

/** A version's stage: whose frame, which import it swaps, for what. */
export interface VersionStage {
  /** The version's (view's) permanent ID. */
  artifact: string
  /** The version's file, absolute. */
  file: string
  /** The frame's import of the original, such as `~/components/App/X.vue`. */
  specifier: string
  /** The original's file, absolute. */
  original: string
  /**
   * An app component no page presents: its frame is the original alone,
   * so the version's stage mounts the version in a frame of its own.
   */
  generic?: boolean
}

/**
 * The system's app components by slug: the frame (the component file,
 * absolute), the copied app file it presents and that file, absolute. An
 * app component no page presents (`generic`) has the original as its frame,
 * as its playground does.
 */
export function appComponents(system: InstalledSystem) {
  const found = new Map<
    string,
    { frame: string; app: AppFile; original: string; generic?: true }
  >()
  const copy = appCopy(system)
  if (!copy) return found
  const dir = path.join(system.dir, 'components')
  const documented = presentedApps(system, copy)
  for (const { component, app } of documented) {
    const { source } = component.files
    if (app && source)
      found.set(component.slug, {
        frame: path.join(dir, source),
        app,
        original: path.join(system.dir, copy.folder, app.path),
      })
  }
  for (const { slug, app } of genericAppComponents(system, copy, documented)) {
    const original = path.join(system.dir, copy.folder, app.path)
    found.set(slug, { frame: original, app, original, generic: true })
  }
  return found
}

const WRAPPER = '\0studio-lab-version:'
const FOLDER = 'lab-versions'

interface Drafts {
  dir: string
  draftOf: (file: string) => string | null
  originOf: (file: string) => string | null
}

/**
 * The stages of one preview document's versions. `frameOf` gives the
 * address a version's frame loads under (inside the document's work
 * folder `dir`), remembering the version; the plugin answers it.
 */
export function versionStages(dir: string, drafts: Drafts | null) {
  /** By the frame's own address for the version. */
  const stages = new Map<string, VersionStage & { frame: string }>()
  const clean = (id: string) => {
    const bare = id.split('?')[0]!
    return bare.startsWith('/@fs/') ? bare.slice(5) : bare
  }
  const stageAt = (id: string) => stages.get(posix(clean(id)))
  const byArtifact = (artifact: string) =>
    [...stages.values()].find((stage) => stage.artifact === artifact)
  /** The file the version's stage shows: its draft while it has one. */
  const shownFile = (stage: VersionStage) => {
    const draft = drafts?.draftOf(stage.file)
    return draft && existsSync(draft) ? draft : stage.file
  }

  let server: ViteDevServer | undefined
  /** Loads the version's stand-in again, as when its file was renamed. */
  const reloadWrapper = (artifact: string) => {
    const module = server?.moduleGraph.getModuleById(`${WRAPPER}${artifact}`)
    if (module) void server!.reloadModule(module)
  }

  function frameOf(stage: VersionStage, frame: string) {
    const address = posix(
      path.join(dir, FOLDER, stage.artifact, path.basename(frame)),
    )
    const before = stages.get(address)
    stages.set(address, { ...stage, frame })
    if (before && before.file !== stage.file) reloadWrapper(stage.artifact)
    return address
  }

  const plugin: Plugin = {
    name: 'studio-preview-lab-versions',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      // The frame for a version, and its blocks (`?vue&type=style…`).
      if (stageAt(source)) {
        const query = source.indexOf('?')
        return posix(clean(source)) + (query < 0 ? '' : source.slice(query))
      }
      if (source.startsWith(WRAPPER)) return source
      if (!importer) return
      const stage = stageAt(importer)
      if (stage) {
        // The one import that changes: its `~/` specifier, the original's
        // path once the system's alias has turned it into one, or a path
        // relative to the frame.
        if (
          source === stage.specifier ||
          posix(path.resolve(path.dirname(stage.frame), clean(source))) ===
            posix(stage.original)
        )
          return `${WRAPPER}${stage.artifact}`
        // The frame's own relative imports, from where the frame is.
        if (source.startsWith('.'))
          return this.resolve(source, stage.frame, {
            ...options,
            skipSelf: true,
          })
        return
      }
      // A draft's relative imports, from the version it stands in for.
      const origin = drafts?.originOf(clean(importer))
      if (origin && source.startsWith('.'))
        return this.resolve(source, origin, { ...options, skipSelf: true })
    },
    load(id) {
      if (id.startsWith(WRAPPER)) {
        const stage = byArtifact(id.slice(WRAPPER.length))
        if (!stage) return
        return wrapper(posix(shownFile(stage)))
      }
      if (id.includes('?')) return
      const stage = stageAt(id)
      if (!stage) return
      // The original alone: a frame that only renders it, so the swap
      // below gives the version the Playground's props unchanged.
      if (stage.generic) return genericFrame(posix(stage.original))
      return readFileSync(stage.frame, 'utf8')
    },
    configureServer(dev) {
      server = dev
      // A version's frame is a copy under its own address, so Vite never
      // ties it to the frame's file: an edit to the frame reloads each copy.
      const frameChanged = (file: string) => {
        const changed = posix(path.resolve(file))
        for (const [address, stage] of stages)
          if (posix(path.resolve(stage.frame)) === changed && !stage.generic) {
            const module = dev.moduleGraph.getModuleById(address)
            if (module) void dev.reloadModule(module)
          }
      }
      dev.watcher.on('change', frameChanged)
      dev.httpServer?.once('close', () =>
        dev.watcher.off('change', frameChanged),
      )
      if (!drafts) return
      dev.watcher.add(drafts.dir)
      // A draft appearing or going away switches the stage to it or back.
      const switched = (file: string) => {
        const origin = drafts.originOf(path.resolve(file))
        if (!origin) return
        for (const stage of stages.values())
          if (path.resolve(stage.file) === origin) {
            const module = dev.moduleGraph.getModuleById(
              `${WRAPPER}${stage.artifact}`,
            )
            if (module) void dev.reloadModule(module)
          }
      }
      dev.watcher.on('add', switched)
      dev.watcher.on('unlink', switched)
      dev.httpServer?.once('close', () => {
        dev.watcher.off('add', switched)
        dev.watcher.off('unlink', switched)
      })
    },
  }

  return { frameOf, shownFile, plugin }
}

// The frame of a version of an app component no page presents: the
// original, which the swap turns into the version, with every prop and
// listener the Playground gives the frame falling through to it.
const genericFrame = (original: string) => `<script setup>
import Original from ${JSON.stringify(original)}
</script>

<template>
  <Original />
</template>
`

// Stands in for the original in the frame: renders the version with what
// the frame gives it, plus the props the version declares that the
// Playground sent (`PLAYGROUND_PROPS`), which reach the frame only.
const wrapper = (
  file: string,
) => `import { defineComponent, h, inject } from 'vue'
import { PLAYGROUND_PROPS } from '#studio/examples'
import Version from ${JSON.stringify(file)}

const declared = (component) => {
  const props = component.props
  if (Array.isArray(props)) return props
  return props && typeof props === 'object' ? Object.keys(props) : []
}

export default defineComponent({
  name: 'LabVersion',
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    const sent = inject(PLAYGROUND_PROPS, null)
    return () => {
      const own = {}
      if (sent)
        for (const name of declared(Version))
          if (name in sent) own[name] = sent[name]
      return h(Version, { ...own, ...attrs }, slots)
    }
  },
})
`
