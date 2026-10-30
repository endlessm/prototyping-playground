// The system commands: agents create, rename, archive, restore and delete
// design systems with `yarn studio`, seeing what would change before --yes.
// Applied changes hold a marker while they run, refresh the lockfile through
// yarn (a stand-in here, `STUDIO_YARN`) and roll back when a step fails.
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { BEN, tempStudio, type TempStudio } from './setup/temp-studio'

const ES = '8x5spen6xtvp96a9'
const PROTOTYPE = 'prt0000000000001'

let studio: TempStudio
beforeEach(() => {
  studio = tempStudio()
  // A stand-in for yarn: notes its arguments, fails when asked to.
  studio.write(
    'fake-yarn.mjs',
    [
      "import { appendFileSync } from 'node:fs'",
      "appendFileSync('yarn-calls.txt', process.argv.slice(2).join(' ') + String.fromCharCode(10))",
      'if (process.env.FAKE_YARN_FAIL) process.exit(1)',
      '',
    ].join('\n'),
  )
  studio.env.STUDIO_YARN = `${studio.root}/fake-yarn.mjs`
  studio.write('yarn.lock', '# the lockfile\n')
})
afterEach(() => {
  studio.remove()
})

const lastJson = (stdout: string) =>
  JSON.parse(stdout.trim().split('\n').at(-1)!) as Record<string, unknown>

function prototype(
  folder: string,
  meta: Record<string, unknown> = {},
): Record<string, unknown> {
  const value = {
    formatVersion: 1,
    title: 'Checkout',
    studioId: PROTOTYPE,
    ownerContributorId: BEN.id,
    systemId: ES,
    ...meta,
  }
  studio.write(
    `src/prototypes/${folder}/meta.json`,
    `${JSON.stringify(value, null, 2)}\n`,
  )
  return value
}

/** A second system, so Endless Studios can be archived or deleted. */
function harbor() {
  const made = studio.studio('create-system', 'harbor', '--yes')
  expect(made.status, made.output).toBe(0)
  return lastJson(made.stdout).studioId as string
}

describe('yarn studio create-system', () => {
  test('[SY-29] [CL-29] previews the scaffold and changes nothing', () => {
    const result = studio.studio('create-system', 'harbor', '--label', 'Harbor')
    expect(result.status, result.output).toBe(0)
    for (const file of [
      'system.ts',
      'app.ts',
      'package.json',
      'README.md',
      'AGENTS.md',
      'styles/theme.css',
      'components/.gitkeep',
      'context/.gitkeep',
      'skills/.gitkeep',
    ])
      expect(result.stdout).toContain(`Create src/systems/harbor/${file}`)
    expect(result.stdout).toContain('Register harbor in studio.config.json')
    expect(result.stdout).toContain('Nothing was changed.')
    expect(studio.exists('src/systems/harbor')).toBe(false)
    expect(studio.config().systems).toEqual(['endless-studios'])
  })

  test('[SY-28] [CL-29] [CL-28] creates an empty Vue system with a fresh permanent id, registered and installed', () => {
    const result = studio.studio(
      'create-system',
      'harbor',
      '--label',
      'Harbor Ops',
      '--yes',
    )
    expect(result.status, result.output).toBe(0)
    const { key, studioId } = lastJson(result.stdout)
    expect(key).toBe('harbor')
    expect(studioId).toMatch(/^[0-9a-hjkmnp-tv-z]{16}$/)
    expect(studioId).not.toBe(ES)
    const declaration = studio.read('src/systems/harbor/system.ts')
    expect(declaration).toContain("label: 'Harbor Ops'")
    expect(declaration).toContain("status: 'active'")
    expect(declaration).toContain("colorModes: ['light', 'dark']")
    expect(declaration).toContain(`studioId: '${studioId}'`)
    expect(declaration).not.toMatch(/react|shadcn/i)
    // An empty theme scope: no tokens yet.
    expect(studio.read('src/systems/harbor/styles/theme.css')).not.toMatch(
      /--[a-z]/,
    )
    expect(studio.json('src/systems/harbor/package.json')).toMatchObject({
      name: `@studio-system/${studioId}`,
      private: true,
    })
    expect(studio.read('src/systems/harbor/AGENTS.md')).toContain('context/')
    const config = studio.config()
    expect(config.systems).toEqual(['endless-studios', 'harbor'])
    expect(config.systemMaintainers).toMatchObject({ [studioId as string]: [] })
    // The default system and its prototypes are unchanged.
    expect(config.defaultSystem).toBe(studio.config().defaultSystem)
    expect(studio.read('yarn-calls.txt')).toContain('install')
    expect(studio.exists('.studio-system-operation')).toBe(false)
  })

  test('[SY-22] [CL-29] refuses a key that is taken, malformed or a module', () => {
    harbor()
    for (const [key, message] of [
      ['harbor', 'There’s already a system called “harbor”.'],
      ['Harbor!', 'lowercase letters'],
      ['systems', 'a module'],
    ] as const) {
      const result = studio.studio('create-system', key)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain(message)
    }
  })

  test('[CL-08] [CL-28] a failed step removes what it wrote and restores the configuration and lockfile', () => {
    const config = studio.read('studio.config.json')
    studio.env.FAKE_YARN_FAIL = '1'
    studio.write('yarn.lock', '# before\n')
    const result = studio.studio('create-system', 'harbor', '--yes')
    expect(result.status).toBe(1)
    expect(result.stderr).toMatch(/^Nothing was made\./)
    expect(studio.exists('src/systems/harbor')).toBe(false)
    expect(studio.read('studio.config.json')).toBe(config)
    expect(studio.read('yarn.lock')).toBe('# before\n')
    expect(studio.exists('.studio-system-operation')).toBe(false)
  })

  test('[SY-23] [CL-28] only one system change runs at a time', () => {
    studio.write(
      '.studio-system-operation',
      JSON.stringify({ pid: process.pid, started: Date.now() }),
    )
    const result = studio.studio('create-system', 'harbor', '--yes')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain(
      'Another system change is in progress. Try again when it finishes.',
    )
    expect(studio.exists('src/systems/harbor')).toBe(false)
  })

  test('[SY-61] only an Admin creates a system', () => {
    studio.identify(BEN)
    const result = studio.studio('create-system', 'harbor', '--yes')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Only an Admin')
    expect(studio.exists('src/systems/harbor')).toBe(false)
  })
})

const maintainedBy = (id: string, who: string[]) =>
  studio.setConfig({
    systemMaintainers: {
      ...(studio.config().systemMaintainers as object),
      [id]: who,
    },
  })

describe('yarn studio rename-system', () => {
  test('[SY-60] [CL-24] [SY-46] renames the name, folder, registration and references; the id and assignments stay', () => {
    const id = harbor()
    maintainedBy(id, [BEN.id])
    prototype('ben/checkout', { systemId: id })
    studio.write(
      'src/prototypes/ben/checkout/Notes.md',
      '---\nstudioId: dc00000000000001\n---\n\n[Guide](../../../systems/harbor/README.md)\n',
    )
    const preview = studio.studio(
      'rename-system',
      'harbor',
      '--label',
      'Harbor Ops',
    )
    expect(preview.status, preview.output).toBe(0)
    expect(preview.stdout).toContain(
      'Rename Harbor to Harbor Ops (harbor → harbor-ops)',
    )
    expect(preview.stdout).toContain('src/prototypes/ben/checkout')
    expect(preview.stdout).toContain('Nothing was changed.')
    expect(studio.exists('src/systems/harbor/system.ts')).toBe(true)

    const result = studio.studio(
      'rename-system',
      'harbor',
      '--label',
      'Harbor Ops',
      '--yes',
    )
    expect(result.status, result.output).toBe(0)
    expect(lastJson(result.stdout)).toMatchObject({
      key: 'harbor-ops',
      studioId: id,
    })
    expect(studio.exists('src/systems/harbor')).toBe(false)
    const declaration = studio.read('src/systems/harbor-ops/system.ts')
    expect(declaration).toContain("label: 'Harbor Ops'")
    expect(declaration).toContain(`studioId: '${id}'`)
    expect(declaration).not.toContain('renameReview')
    const config = studio.config()
    expect(config.systems).toEqual(['endless-studios', 'harbor-ops'])
    expect(config.systemMaintainers).toMatchObject({ [id]: [BEN.id] })
    expect(studio.read('src/prototypes/ben/checkout/Notes.md')).toContain(
      '../../../systems/harbor-ops/README.md',
    )
    expect(studio.json('src/prototypes/ben/checkout/meta.json').systemId).toBe(
      id,
    )
    expect(studio.read('yarn-calls.txt')).toContain('install')
  })

  test('[SY-61] [CL-24] Admins and the system’s maintainers rename it; others are refused', () => {
    const id = harbor()
    studio.identify(BEN)
    const refused = studio.studio(
      'rename-system',
      'harbor',
      '--label',
      'Dock',
      '--yes',
    )
    expect(refused.status).toBe(1)
    expect(refused.stderr).toContain('maintainer of the Harbor system')
    expect(studio.exists('src/systems/harbor')).toBe(true)

    maintainedBy(id, [BEN.id])
    const allowed = studio.studio(
      'rename-system',
      'harbor',
      '--label',
      'Dock',
      '--yes',
    )
    expect(allowed.status, allowed.output).toBe(0)
    expect(studio.exists('src/systems/dock/system.ts')).toBe(true)
  })

  test('[SY-46] a name another system uses is refused', () => {
    harbor()
    const result = studio.studio(
      'rename-system',
      'harbor',
      '--label',
      'Endless Studios',
    )
    expect(result.status).toBe(1)
    expect(result.stderr).toContain(
      'There’s already a system called “endless-studios”.',
    )
  })
})

describe('archiving and restoring a system', () => {
  test('[SY-60] [CL-25] [SY-51] archive keeps the files and archives its active prototypes', () => {
    const id = harbor()
    prototype('ben/checkout', { systemId: id })
    prototype('ben/old', {
      systemId: id,
      studioId: 'prt0000000000002',
      title: 'Old',
      status: 'archived',
    })
    const preview = studio.studio('archive-system', 'harbor')
    expect(preview.status, preview.output).toBe(0)
    expect(preview.stdout).toContain('2 associated prototype(s)')
    expect(preview.stdout).toContain('src/prototypes/ben/old (archived)')
    expect(preview.stdout).toContain('Nothing was changed.')

    const result = studio.studio('archive-system', 'harbor', '--yes')
    expect(result.status, result.output).toBe(0)
    expect(studio.read('src/systems/harbor/system.ts')).toContain(
      "status: 'archived'",
    )
    expect(studio.json('src/prototypes/ben/checkout/meta.json')).toMatchObject({
      status: 'archived',
      archivedBySystemId: id,
    })
    expect(
      studio.json('src/prototypes/ben/old/meta.json').archivedBySystemId,
    ).toBeUndefined()
  })

  test('[SY-50] [SY-61] the default system can’t be archived or deleted, and only Admins may', () => {
    for (const command of ['archive-system', 'delete-system']) {
      const result = studio.studio(command, 'endless-studios')
      expect(result.status).toBe(1)
      expect(result.stderr).toContain(
        'Set another system as the default before',
      )
    }
    harbor()
    studio.identify(BEN)
    const refused = studio.studio('archive-system', 'harbor', '--yes')
    expect(refused.status).toBe(1)
    expect(refused.stderr).toContain('Only an Admin')
  })

  test('[SY-60] [CL-26] [SY-54] restore brings the system back without its prototypes, and never changes the default', () => {
    const id = harbor()
    prototype('ben/checkout', { systemId: id })
    expect(studio.studio('archive-system', 'harbor', '--yes').status).toBe(0)
    const result = studio.studio('restore-system', 'harbor', '--yes')
    expect(result.status, result.output).toBe(0)
    expect(studio.read('src/systems/harbor/system.ts')).toContain(
      "status: 'active'",
    )
    const meta = studio.json('src/prototypes/ben/checkout/meta.json')
    expect(meta.status).toBe('archived')
    expect(meta.archivedBySystemId).toBeUndefined()
    expect(studio.config().defaultSystem).toBe(ES)
  })

  test('[SY-54] [CL-26] --restore-prototypes restores the prototypes archived with it', () => {
    const id = harbor()
    prototype('ben/checkout', { systemId: id })
    expect(studio.studio('archive-system', 'harbor', '--yes').status).toBe(0)
    const result = studio.studio(
      'restore-system',
      'harbor',
      '--restore-prototypes',
      '--yes',
    )
    expect(result.status, result.output).toBe(0)
    const meta = studio.json('src/prototypes/ben/checkout/meta.json')
    expect(meta.status).toBeUndefined()
    expect(meta.archivedBySystemId).toBeUndefined()
  })
})

describe('yarn studio delete-system', () => {
  test('[SY-60] [CL-27] [SY-58] deletes the files; prototypes keep theirs and wait for a rebuild', () => {
    const id = harbor()
    prototype('ben/checkout', { systemId: id })
    prototype('ben/copy', {
      studioId: 'prt0000000000002',
      title: 'Copy',
      systemId: ES,
      rebuild: { targetSystemId: id, sourcePrototypeId: PROTOTYPE },
    })
    const preview = studio.studio('delete-system', 'harbor')
    expect(preview.status, preview.output).toBe(0)
    expect(preview.stdout).toContain('Permanently deletes the system’s files.')
    expect(preview.stdout).toContain(
      'src/prototypes/ben/copy (pending rebuild)',
    )
    expect(studio.exists('src/systems/harbor')).toBe(true)

    const result = studio.studio('delete-system', 'harbor', '--yes')
    expect(result.status, result.output).toBe(0)
    expect(studio.exists('src/systems/harbor')).toBe(false)
    const config = studio.config()
    expect(config.systems).toEqual(['endless-studios'])
    expect(Object.keys(config.systemMaintainers as object)).not.toContain(id)
    expect(studio.json('src/prototypes/ben/checkout/meta.json')).toMatchObject({
      systemId: id,
      systemMissing: { systemId: id, label: 'Harbor' },
    })
    expect(
      studio.json('src/prototypes/ben/copy/meta.json').rebuild,
    ).toBeUndefined()
    expect(studio.read('yarn-calls.txt').trim().split('\n')).toHaveLength(2)
  })

  test('[CL-08] [CL-28] a failed lockfile refresh puts the system back', () => {
    const id = harbor()
    prototype('ben/checkout', { systemId: id })
    const config = studio.read('studio.config.json')
    studio.env.FAKE_YARN_FAIL = '1'
    const result = studio.studio('delete-system', 'harbor', '--yes')
    expect(result.status).toBe(1)
    expect(result.stderr).toMatch(/^Nothing was changed\./)
    expect(studio.exists('src/systems/harbor/system.ts')).toBe(true)
    expect(studio.read('studio.config.json')).toBe(config)
    expect(
      studio.json('src/prototypes/ben/checkout/meta.json').systemMissing,
    ).toBeUndefined()
    expect(studio.exists('.studio-system-operation')).toBe(false)
  })

  test('[CL-09] warns before --yes when the dev server holds the folder', () => {
    harbor()
    studio.env.STUDIO_RUNTIME_DIR = `${studio.root}/runtime`
    studio.write(
      'runtime/dev-server.json',
      JSON.stringify({
        root: studio.root,
        pid: process.pid,
        port: 4321,
        startedBy: 'ada',
      }),
    )
    const result = studio.studio('delete-system', 'harbor')
    expect(result.status, result.output).toBe(0)
    expect(result.stdout).toContain(
      'src/systems/harbor is in use by the dev server on port 4321',
    )
    expect(result.stdout).toContain('Nothing was changed.')
  })
})

describe('yarn studio remove <system>', () => {
  test('[CL-23] refuses while prototypes use it, unless --force', () => {
    const id = harbor()
    prototype('ben/checkout', { systemId: id })
    const used = studio.studio('remove', 'harbor', '--yes')
    expect(used.status).toBe(1)
    expect(used.stderr).toContain('1 prototype(s) use harbor')

    const forced = studio.studio('remove', 'harbor', '--force', '--yes')
    expect(forced.status, forced.output).toBe(0)
    expect(studio.exists('src/systems/harbor')).toBe(false)
    expect(studio.config().systems).toEqual(['endless-studios'])
  })

  test('[CL-23] refuses while a document links to it, unless --force', () => {
    harbor()
    studio.write(
      'src/prototypes/ben/checkout/Notes.md',
      '[Theme](../../../systems/harbor/styles/theme.css)\n',
    )
    const linked = studio.studio('remove', 'harbor')
    expect(linked.status).toBe(1)
    expect(linked.stderr).toContain('link to harbor')
  })

  test('[CL-23] refuses the only system and the default system', () => {
    const only = studio.studio('remove', 'endless-studios')
    expect(only.status).toBe(1)
    expect(only.stderr).toContain('the only design system')
    harbor()
    const fallback = studio.studio('remove', 'endless-studios')
    expect(fallback.status).toBe(1)
    expect(fallback.stderr).toContain('the default design system')
  })
})
