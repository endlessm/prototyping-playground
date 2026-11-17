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
import { readExperiment } from '../../../../tooling/manifest/experiments.ts'
import type { IdentityFileType } from '../../../../tooling/identity/file-types.ts'
import {
  CONFIG_FILE,
  readConfig,
} from '../../../../tooling/modules/registry.ts'
import {
  readBreakdown,
  type BreakdownResult,
} from '../../../../tooling/systems/breakdown.ts'
import { experimentBreakdownId } from '../../../../tooling/systems/preview-ids.ts'
import {
  loadSystems,
  systemsFolder,
} from '../../../../tooling/systems/registry.ts'

export interface ExperimentBreakdown {
  /** The tree read from the experiment's file, or why it can't be. */
  tree: BreakdownResult
  /** The preview document's ID of the file instrumented. */
  preview: string
  /** The version of the file the tree was read from. */
  version: string
}

/** Every experiment's Breakdown, by the view's permanent ID. */
export async function experimentBreakdowns(options: {
  root: string
  dev: boolean
  /** The installed file types; the view type reads permanent IDs. */
  fileTypes: IdentityFileType[]
  prototypesFolder?: string
  configFile?: string
  systemsFolder?: string
}) {
  const { root, dev } = options
  const view = options.fileTypes.find(({ id }) => id === 'view')
  const found: Record<string, ExperimentBreakdown> = {}
  if (!view) return found
  const prototypesFolder = options.prototypesFolder ?? PROTOTYPES_FOLDER
  const prototypesDir = path.resolve(root, prototypesFolder)
  const { systems } = await loadSystems(
    root,
    readConfig(path.resolve(root, options.configFile ?? CONFIG_FILE)),
    options.systemsFolder ?? systemsFolder(),
  )
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
      if (readExperiment(source)?.systemId !== system.id) continue
      let id: string | null
      try {
        id = view.identity.read(source)
      } catch {
        continue
      }
      if (!id) continue
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
      }
    }
  }
  return found
}
