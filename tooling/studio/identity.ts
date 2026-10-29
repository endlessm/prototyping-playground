// Permanent identities from the command line: the audit, which only reads,
// and `identify`, which gives the files of one of your prototypes the IDs
// they are missing.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { identityHint } from '../contributors/identity.ts'
import { permissionRefusal, refusalMessage } from '../contributors/roles.ts'
import { newStudioId } from '../contributors/studio-ids.ts'
import { auditIdentities, identitiesInUse } from '../identity/audit.ts'
import { fileTypeOf, identityFileTypes } from '../identity/file-types.ts'
import { studioModules } from './contributors.ts'
import { NOTHING_CHANGED, Refusal, say, type Flags } from './output.ts'
import { session } from './permissions.ts'
import { realFolder } from './status.ts'

/** Every installed module's file types, switched on or not. */
export async function installedFileTypes(root: string) {
  return identityFileTypes((await studioModules(root)).modules)
}

export async function identityAudit(
  root: string,
  args: string[],
  flags: Flags,
) {
  if (args.length)
    throw new Refusal('Usage: yarn studio identity-audit [--json]')
  const audit = auditIdentities(root, await installedFileTypes(root))
  if (audit.problems.length || audit.missing.length) process.exitCode = 1
  if (flags.json) {
    say(JSON.stringify(audit, null, 2))
    return
  }
  const count = (n: number, one: string, many: string) =>
    `${n} ${n === 1 ? one : many}`
  say(
    `${count(audit.resources.length, 'resource', 'resources')}; ${count(audit.missing.length, 'missing identity', 'missing identities')}.`,
  )
  for (const file of audit.missing) say(`  Missing: ${file}`)
  for (const problem of audit.problems) say(`  ${problem}`)
  if (audit.missing.length)
    say(
      'Give a prototype’s files their IDs with yarn studio identify src/prototypes/<contributor>/<prototype>.',
    )
}

const USAGE =
  'Usage: yarn studio identify src/prototypes/<contributor>/<prototype> [--yes] [--json]'

export async function identify(root: string, args: string[], flags: Flags) {
  if (args.length !== 1) throw new Refusal(USAGE)
  const folder = path
    .relative(root, path.resolve(root, args[0]!))
    .split(path.sep)
    .join('/')
  const match = /^src\/prototypes\/([a-z0-9][a-z0-9-]*)\/([^/]+)$/.exec(folder)
  const absolute = match && realFolder(root, folder)
  if (!match || !absolute || !existsSync(path.join(absolute, 'meta.json')))
    throw new Refusal(
      `Give an existing src/prototypes/<contributor>/<prototype> folder, without symbolic links. ${USAGE}`,
    )
  const owner = match[1]!
  const { contributors, key, identity, team } = session(root, flags)
  const refusal = permissionRefusal(
    team,
    contributors,
    key,
    { kind: 'prototype', owner },
    'edit',
  )
  if (refusal)
    throw new Refusal(
      refusalMessage(refusal, {
        email: identity.email,
        hint: identity.email ? identityHint(identity) : undefined,
      }),
    )

  const types = await installedFileTypes(root)
  const audit = auditIdentities(root, types)
  if (audit.problems.length)
    throw new Refusal(
      [
        'Fix these identity problems first; nothing was changed:',
        ...audit.problems.map((problem) => `  ${problem}`),
      ].join('\n'),
    )
  const metaFile = `${folder}/meta.json`
  const meta = JSON.parse(readFileSync(path.join(root, metaFile), 'utf8'))
  if (meta.systemId === undefined)
    throw new Refusal(
      `${metaFile} doesn't declare systemId. Set it to a registered system's studio ID, or null for no system; identify never chooses one.`,
    )
  const ownerId = contributors[owner]?.studioId
  if (!ownerId)
    throw new Refusal(`${owner} has no contributor profile with a studio ID.`)
  const missing = audit.missing.filter((file) => file.startsWith(`${folder}/`))

  if (!flags.yes) {
    if (flags.json) say(JSON.stringify({ folder, missing }, null, 2))
    else {
      say(
        missing.length === 1
          ? `1 file needs an identity in ${folder}.`
          : `${missing.length} files need an identity in ${folder}.`,
      )
      for (const file of missing) say(`  ${file}`)
      say(NOTHING_CHANGED)
    }
    return
  }

  const taken = identitiesInUse(audit)
  const assigned: { path: string; studioId: string }[] = []
  const writeMeta = (changes: Record<string, unknown>) => {
    const file = path.join(root, metaFile)
    const current = JSON.parse(readFileSync(file, 'utf8'))
    writeFileSync(
      file,
      `${JSON.stringify({ ...current, ...changes }, null, 2)}\n`,
    )
  }
  for (const file of missing) {
    const studioId = newStudioId(taken)
    taken.add(studioId)
    if (file === metaFile) writeMeta({ studioId })
    else {
      const absoluteFile = path.join(root, file)
      const type = fileTypeOf(types, file)!
      writeFileSync(
        absoluteFile,
        type.identity.write(readFileSync(absoluteFile, 'utf8'), studioId),
      )
    }
    assigned.push({ path: file, studioId })
  }
  // A prototype written by hand may not name its owner yet.
  if (meta.ownerContributorId === undefined)
    writeMeta({ ownerContributorId: ownerId })

  if (flags.json) {
    say(JSON.stringify({ folder, missing, assigned }, null, 2))
    return
  }
  if (!assigned.length) {
    say(`Nothing in ${folder} needed an identity.`)
    return
  }
  say(
    `Assigned ${assigned.length} ${assigned.length === 1 ? 'identity' : 'identities'} in ${folder}; existing identities were kept:`,
  )
  for (const { path: file, studioId } of assigned)
    say(`  ${file} → ${studioId}`)
}
