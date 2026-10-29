// `yarn new "Prototype Name"` (`yarn studio new`): creates a prototype in
// your own space right away, with the studio's default system unless
// `--system <folder name or ID>` or `--no-system` says otherwise, and prints
// where it is and the address to open.
import { createPrototype } from '../files/prototypes.ts'
import { FileServiceError } from '../files/source.ts'
import { installedFileTypes } from './identity.ts'
import { Refusal, say, type Flags } from './output.ts'
import { session } from './permissions.ts'

const USAGE = 'Usage: yarn new "Prototype Name" [--system <id> | --no-system]'

export async function newPrototype(root: string, args: string[], flags: Flags) {
  const title = args.join(' ')
  if (!title.trim()) throw new Refusal(USAGE)
  if (flags.system !== undefined && flags['no-system'])
    throw new Refusal('Use --system or --no-system, not both.')
  const system = flags['no-system']
    ? null
    : typeof flags.system === 'string'
      ? flags.system
      : undefined
  const { key, identity } = session(root, flags)
  const fileTypes = await installedFileTypes(root)
  let created
  try {
    created = createPrototype(
      {
        root,
        fileTypes,
        identify: () => ({ key, email: identity.email }),
      },
      { title, ...(system === undefined ? {} : { system }) },
    )
  } catch (error) {
    if (error instanceof FileServiceError) throw new Refusal(error.message)
    throw error
  }
  say(`Created ${created.folder}/`)
  say(`Open it with yarn dev, at /prototypes/${created.id}`)
}
