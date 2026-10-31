import type { ModuleServerHandler } from '../../../../tooling/modules/contract.ts'
import { claimWelcome } from '../claim.ts'

// POST `{ "action": "claim" }`: whether Home opens the welcome for whoever
// is working, recorded on their profile. Nobody can claim it for anyone
// else: the dev server resolves who is asking.
export default (({ contributorsFolder, me, method, body }) => {
  const request = body as Record<string, unknown> | undefined
  if (
    method !== 'POST' ||
    !request ||
    typeof request !== 'object' ||
    request.action !== 'claim' ||
    Object.keys(request).length !== 1
  )
    throw Object.assign(new Error('Invalid welcome request.'), { status: 400 })
  return claimWelcome(contributorsFolder, me)
}) satisfies ModuleServerHandler
