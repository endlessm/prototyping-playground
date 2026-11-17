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
import { labContext } from '../experiments/context.ts'
import { saveExperiment } from '../experiments/save.ts'

const invalid = () =>
  Object.assign(new Error('Invalid save request.'), { status: 400 })

export default (async ({ root, contributorsFolder, method, body }) => {
  const request = body as Record<string, unknown> | undefined
  if (method !== 'POST' || !request || typeof request !== 'object')
    throw invalid()
  return saveExperiment(await labContext(root, contributorsFolder), {
    prototype: request.prototype,
    artifact: request.artifact,
    base: request.base,
    changes: request.changes,
  })
}) satisfies ModuleServerHandler
