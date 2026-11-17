// The Lab's experiments on the local dev server, at
// `<base>_studio/modules/lab/experiments`:
//
//   POST { action: "create", system, component, name, changes? }
//        a new experiment of the component in your prototype for it,
//        made the first time → { prototype, artifact }
//   POST { action: "duplicate", experiment, name, changes? }
//        anyone's experiment copied into your own → { prototype, artifact }
//
// With a Breakdown's `changes` (Save as experiment, Save as my experiment),
// they are written into the new experiment, which answers `saved` and
// `skipped` as Save does (`save.ts`).
//
// Who is asking comes from Git, as everywhere in the studio; refusals answer
// with the studio's own sentences and statuses. The deployed site has no
// handlers, so nothing is written there.
import type { ModuleServerHandler } from '../../../../tooling/modules/contract.ts'
import { identityFileTypes } from '../../../../tooling/identity/file-types.ts'
import { PROTOTYPES_FOLDER } from '../../../../tooling/manifest/build.ts'
import { loadRegistry } from '../../../../tooling/modules/registry.ts'
import {
  createExperiment,
  duplicateExperiment,
  type ExperimentsContext,
} from '../experiments/service.ts'

const invalid = () =>
  Object.assign(new Error('Invalid experiment request.'), { status: 400 })

export default (async ({ root, contributorsFolder, method, body }) => {
  const request = body as Record<string, unknown> | undefined
  if (method !== 'POST' || !request || typeof request !== 'object')
    throw invalid()
  const configFile = process.env.STUDIO_CONFIG || undefined
  const registry = await loadRegistry(root, {
    modulesFolder: process.env.STUDIO_MODULES || undefined,
    configFile,
  })
  const context: ExperimentsContext = {
    root,
    prototypesFolder: process.env.STUDIO_PROTOTYPES || PROTOTYPES_FOLDER,
    contributorsFolder,
    configFile,
    // Every module's, turned off or not, so no identity is handed out twice.
    fileTypes: await identityFileTypes(registry.modules),
  }
  switch (request.action) {
    case 'create':
      return createExperiment(
        context,
        {
          system: request.system,
          component: request.component,
          name: request.name,
        },
        request.changes,
      )
    case 'duplicate':
      return duplicateExperiment(
        context,
        {
          experiment: request.experiment,
          name: request.name,
        },
        request.changes,
      )
    default:
      throw invalid()
  }
}) satisfies ModuleServerHandler
