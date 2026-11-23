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
import type { Plugin } from 'vite'
import { appCopy, appFile, type AppFile } from '../systems/app-copy.ts'
import { frontmatter } from '../systems/catalog.ts'
import { discoverComponents } from '../systems/components.ts'
import type { InstalledSystem } from '../systems/registry.ts'
import { posix, treeFiles } from '../manifest/build.ts'

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
}

/**
 * The system's app components by slug: the frame (the component file,
 * absolute), the copied app file it presents and that file, absolute.
 */
export function appComponents(system: InstalledSystem) {
  const found = new Map<
    string,
    { frame: string; app: AppFile; original: string }
  >()
  const copy = appCopy(system)
  if (!copy) return found
  const dir = path.join(system.dir, 'components')
  if (!existsSync(dir)) return found
  for (const component of discoverComponents(treeFiles(dir))) {
    const { doc, source } = component.files
    if (!doc || !source) continue
    let declared: unknown
    try {
      declared = frontmatter(readFileSync(path.join(dir, doc), 'utf8'))?.app
    } catch {
      continue
    }
    const app = appFile(system, copy, declared)
    if (app && 'file' in app)
      found.set(component.slug, {
        frame: path.join(dir, source),
        app: app.file,
        original: path.join(system.dir, copy.folder, app.file.path),
      })
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

  function frameOf(stage: VersionStage, frame: string) {
    const address = posix(
      path.join(dir, FOLDER, stage.artifact, path.basename(frame)),
    )
    stages.set(address, { ...stage, frame })
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
        // The one import that changes, before or after the system's `~/`
        // alias has turned it into the original's path.
        if (
          source === stage.specifier ||
          posix(path.resolve(clean(source))) === posix(stage.original)
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
      if (stage) return readFileSync(stage.frame, 'utf8')
    },
    configureServer(server) {
      if (!drafts) return
      server.watcher.add(drafts.dir)
      // A draft appearing or going away switches the stage to it or back.
      const switched = (file: string) => {
        const origin = drafts.originOf(path.resolve(file))
        if (!origin) return
        for (const stage of stages.values())
          if (path.resolve(stage.file) === origin) {
            const module = server.moduleGraph.getModuleById(
              `${WRAPPER}${stage.artifact}`,
            )
            if (module) void server.reloadModule(module)
          }
      }
      server.watcher.on('add', switched)
      server.watcher.on('unlink', switched)
      server.httpServer?.once('close', () => {
        server.watcher.off('add', switched)
        server.watcher.off('unlink', switched)
      })
    },
  }

  return { frameOf, shownFile, plugin }
}

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
