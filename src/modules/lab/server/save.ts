// Saving a Breakdown's changes into a Lab experiment on the local dev
// server, at `<base>_studio/modules/lab/save`:
//
//   POST { prototype, artifact, base, changes }
//        each change written into the experiment's file, over the version
//        the page read → { version, saved, skipped }
//
// Who is asking comes from Git, as everywhere in the studio; refusals answer
// with the studio's own sentences and statuses (403 not allowed, 409 changed
// on disk). The deployed site has no handlers, so nothing is written there.
import type { ModuleServerHandler } from '../../../../tooling/modules/contract.ts'
import { identityFileTypes } from '../../../../tooling/identity/file-types.ts'
import { PROTOTYPES_FOLDER } from '../../../../tooling/manifest/build.ts'
import { loadRegistry } from '../../../../tooling/modules/registry.ts'
import { saveExperiment } from '../experiments/save.ts'

const invalid = () =>
  Object.assign(new Error('Invalid save request.'), { status: 400 })

export default (async ({ root, contributorsFolder, method, body }) => {
  const request = body as Record<string, unknown> | undefined
  if (method !== 'POST' || !request || typeof request !== 'object')
    throw invalid()
  const configFile = process.env.STUDIO_CONFIG || undefined
  const registry = await loadRegistry(root, {
    modulesFolder: process.env.STUDIO_MODULES || undefined,
    configFile,
  })
  return saveExperiment(
    {
      root,
      prototypesFolder: process.env.STUDIO_PROTOTYPES || PROTOTYPES_FOLDER,
      contributorsFolder,
      configFile,
      fileTypes: await identityFileTypes(registry.modules),
    },
    {
      prototype: request.prototype,
      artifact: request.artifact,
      base: request.base,
      changes: request.changes,
    },
  )
}) satisfies ModuleServerHandler
