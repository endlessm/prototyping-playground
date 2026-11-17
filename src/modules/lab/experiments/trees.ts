// Each Lab experiment's Breakdown, read on Node for the Lab's build data:
// the tree of pieces read from the experiment's own file (as a component's
// is, `tooling/systems/breakdown.ts`), the preview document's ID of its
// instrumented copy and the version of the file the tree was read from, so
// Save can tell the file changed since. The deployed site leaves out
// archived prototypes' experiments, as its manifest does.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileAccess, versionOf } from '../../../../tooling/files/source.ts'
import {
  PROTOTYPES_FOLDER,
  treeFiles,
} from '../../../../tooling/manifest/build.ts'
import { experimentOf } from '../../../../tooling/manifest/experiments.ts'
import {
  fileTags,
  nuxtUiCatalog,
  readBreakdown,
  type BreakdownResult,
} from '../../../../tooling/systems/breakdown.ts'
import { experimentBreakdownId } from '../../../../tooling/systems/preview-ids.ts'
import {
  installedSystems,
  viewTypeIn,
  type ExperimentsContext,
} from './context.ts'
import { componentInstances, type ComponentInstance } from './instances.ts'

export interface ExperimentBreakdown {
  /** The tree read from the experiment's file, or why it can't be. */
  tree: BreakdownResult
  /** The preview document's ID of the file instrumented. */
  preview: string
  /** The version of the file the tree was read from. */
  version: string
  /**
   * The tags of the experiment's own file that are the Lab's component,
   * with the attributes written on them, for the dial panel's props.
   */
  instances: ComponentInstance[]
}

/** Every experiment's Breakdown, by the view's permanent ID. */
export async function experimentBreakdowns(
  options: Pick<
    ExperimentsContext,
    'root' | 'fileTypes' | 'prototypesFolder' | 'configFile' | 'systemsFolder'
  > & { dev: boolean },
) {
  const { root, dev } = options
  const view = viewTypeIn(options.fileTypes)
  const found: Record<string, ExperimentBreakdown> = {}
  if (!view) return found
  const prototypesFolder = options.prototypesFolder ?? PROTOTYPES_FOLDER
  const prototypesDir = path.resolve(root, prototypesFolder)
  const systems = await installedSystems(options)
  const access = fileAccess({ root, prototypesFolder, fileTypes: [] })
  for (const { dir, meta } of access.prototypes()) {
    if (!dev && meta.status === 'archived') continue
    const system = systems.find(({ id }) => id === meta.systemId)
    if (!system) continue
    for (const relative of treeFiles(dir)) {
      if (!view.extensions.includes(path.extname(relative).toLowerCase()))
        continue
      const file = path.join(dir, relative)
      let source: string
      try {
        source = readFileSync(file, 'utf8')
      } catch {
        continue
      }
      const marker = experimentOf(source, meta)
      if (!marker) continue
      let id: string | null
      try {
        id = view.identity.read(source)
      } catch {
        continue
      }
      if (!id) continue
      const tags = fileTags(source, file, {
        system,
        nuxtUi: nuxtUiCatalog(system, root),
        follow: () => false,
      }).tags
      found[id] = {
        tree: readBreakdown({
          file,
          system,
          root,
          name: path.basename(file, path.extname(file)),
          follow: [system.dir, prototypesDir],
        }),
        preview: experimentBreakdownId(id),
        version: versionOf(source),
        instances: tags ? componentInstances(tags, marker.component) : [],
      }
    }
  }
  return found
}
