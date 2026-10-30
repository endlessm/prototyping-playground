// `yarn studio delete-prototype src/prototypes/<contributor>/<prototype>`:
// previews what deleting the prototype would break or lose, and with --yes
// removes its folder for good. The owner or an Admin only.
import { existsSync } from 'node:fs'
import path from 'node:path'
import { identityHint } from '../contributors/identity.ts'
import { permissionRefusal, refusalMessage } from '../contributors/roles.ts'
import {
  deleteFolder,
  deletionPreview,
  HeldFolder,
  planDeletion,
} from '../files/deletion.ts'
import { PROTOTYPES_FOLDER } from '../manifest/build.ts'
import { NOTHING_CHANGED, Refusal, say, type Flags } from './output.ts'
import { session } from './permissions.ts'
import { realFolder } from './status.ts'

const USAGE =
  'Usage: yarn studio delete-prototype src/prototypes/<contributor>/<prototype> [--yes] [--json] [--as <key>]'

export function deletePrototype(root: string, args: string[], flags: Flags) {
  if (args.length !== 1) throw new Refusal(USAGE)
  const folder = path
    .relative(root, path.resolve(root, args[0]!.replace(/[\\/]+$/, '')))
    .split(path.sep)
    .join('/')
  const match = /^src\/prototypes\/([a-z0-9][a-z0-9-]*)\/([^/]+)$/.exec(folder)
  const absolute = match && realFolder(root, folder)
  if (!match || !absolute || !existsSync(path.join(absolute, 'meta.json')))
    throw new Refusal(
      `Give an existing src/prototypes/<contributor>/<prototype> folder, without symbolic links. ${USAGE}`,
    )
  const { contributors, key, identity, team } = session(root, flags)
  const refusal = permissionRefusal(
    team,
    contributors,
    key,
    { kind: 'prototype', owner: match[1]! },
    'manage',
  )
  if (refusal)
    throw new Refusal(
      refusalMessage(refusal, {
        email: identity.email,
        hint: identity.email ? identityHint(identity) : undefined,
      }),
    )

  const dir = path.join(root, folder)
  const plan = planDeletion(root, path.join(root, PROTOTYPES_FOLDER), dir)
  if (!flags.yes) {
    if (flags.json) say(JSON.stringify(plan, null, 2))
    else
      for (const line of [...deletionPreview(plan), NOTHING_CHANGED]) say(line)
    return
  }
  try {
    deleteFolder(root, dir)
  } catch (error) {
    if (error instanceof HeldFolder) throw new Refusal(error.message)
    throw error
  }
  const linking = plan.incoming.length + plan.breaking.length
  if (flags.json) {
    say(
      JSON.stringify(
        { deleted: plan.folder, prototypeId: plan.prototypeId, linking },
        null,
        2,
      ),
    )
    return
  }
  say(`Deleted ${plan.folder}.`)
  if (linking)
    say(
      `${linking} ${linking === 1 ? 'file' : 'files'} in other prototypes still ${linking === 1 ? 'links' : 'link'} to it; update them.`,
    )
  say('A running studio updates by itself.')
}
