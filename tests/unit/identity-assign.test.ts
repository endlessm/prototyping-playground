// While the dev server runs, new artifacts in your own prototypes get their
// permanent identity. The watcher here stands in for Vite's.
import { EventEmitter } from 'node:events'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { identity as view } from '../../src/modules/prototypes/types/view/identity'
import { auditIdentities } from '../../tooling/identity/audit'
import { identityLock, watchNewArtifacts } from '../../tooling/identity/assign'

const types = [{ id: 'view', extensions: ['.vue'], identity: view }]
const TEMPLATE = '<template>\n  <p>Hi</p>\n</template>\n'
const HME = 'hme0000000000001'

let root: string
beforeEach(() => {
  root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'assign-')))
  fs.cpSync('tests/fixtures/contributors', path.join(root, 'contributors'), {
    recursive: true,
  })
  for (const [owner, id] of [
    ['ada', 'dem0000000000001'],
    ['ben', 'dem0000000000002'],
  ] as const)
    write(
      `src/prototypes/${owner}/demo/meta.json`,
      JSON.stringify({ title: 'Demo', studioId: id, systemId: null }),
    )
})
afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true })
})

function at(file: string) {
  return path.join(root, file)
}
function write(file: string, text: string) {
  fs.mkdirSync(path.dirname(at(file)), { recursive: true })
  fs.writeFileSync(at(file), text)
}
const idOf = (file: string) => view.read(fs.readFileSync(at(file), 'utf8'))

/** A dev server run by `contributor`, with its log. */
function serve(contributor: string | null = 'ada') {
  const watcher = new EventEmitter()
  const log: [string, string][] = []
  watchNewArtifacts(watcher, {
    root,
    types: () => types,
    contributor: () => contributor,
    logger: {
      info: (message) => log.push(['info', message]),
      warn: (message) => log.push(['warn', message]),
    },
    lockTimeout: 100,
  })
  return {
    log,
    add: (file: string, text: string) => {
      write(file, text)
      watcher.emit('add', at(file))
    },
    change: (file: string, text: string) => {
      write(file, text)
      watcher.emit('change', at(file))
    },
  }
}

describe('a view created while the dev server runs', () => {
  test('[CL-52] gets an ID in your own prototype, written as a leading comment', () => {
    const { add, log } = serve()
    add('src/prototypes/ada/demo/flows/Start.vue', TEMPLATE)
    const id = idOf('src/prototypes/ada/demo/flows/Start.vue')
    expect(id).toMatch(/^[0-9a-hjkmnp-tv-z]{16}$/)
    expect(
      fs.readFileSync(at('src/prototypes/ada/demo/flows/Start.vue'), 'utf8'),
    ).toBe(`<!-- @studio-id ${id} -->\n${TEMPLATE}`)
    expect(log).toEqual([
      [
        'info',
        `Assigned identity ${id} to src/prototypes/ada/demo/flows/Start.vue`,
      ],
    ])
    expect(auditIdentities(root, types).problems).toEqual([])
  })

  test('[CL-52] is left alone in someone else’s prototype, or with nobody recognised', () => {
    serve().add('src/prototypes/ben/demo/Start.vue', TEMPLATE)
    serve(null).add('src/prototypes/ada/demo/Other.vue', TEMPLATE)
    expect(idOf('src/prototypes/ben/demo/Start.vue')).toBeNull()
    expect(idOf('src/prototypes/ada/demo/Other.vue')).toBeNull()
  })

  test('[CL-52] never has its existing ID rewritten', () => {
    const copy = `<!-- @studio-id ${HME} -->\n${TEMPLATE}`
    serve().add('src/prototypes/ada/demo/Copy.vue', copy)
    expect(
      fs.readFileSync(at('src/prototypes/ada/demo/Copy.vue'), 'utf8'),
    ).toBe(copy)
  })

  test('[CL-52] waits for a new empty file to get content', () => {
    const { add, change } = serve()
    add('src/prototypes/ada/demo/Start.vue', '')
    expect(
      fs.readFileSync(at('src/prototypes/ada/demo/Start.vue'), 'utf8'),
    ).toBe('')
    change('src/prototypes/ada/demo/Start.vue', TEMPLATE)
    expect(idOf('src/prototypes/ada/demo/Start.vue')).not.toBeNull()
  })

  test('[CL-52] skips helpers, other file types and files outside prototypes', () => {
    const { add } = serve()
    add('src/prototypes/ada/demo/_parts/Card.vue', TEMPLATE)
    add('src/prototypes/ada/demo/notes.txt', 'hi')
    add('src/modules/x/Page.vue', TEMPLATE)
    expect(idOf('src/prototypes/ada/demo/_parts/Card.vue')).toBeNull()
    expect(
      fs.readFileSync(at('src/prototypes/ada/demo/notes.txt'), 'utf8'),
    ).toBe('hi')
    expect(idOf('src/modules/x/Page.vue')).toBeNull()
  })

  test('[CL-52] pauses while the studio has identity problems, and says how to continue', () => {
    write(
      'src/prototypes/ada/demo/A.vue',
      `<!-- @studio-id ${HME} -->\n${TEMPLATE}`,
    )
    write(
      'src/prototypes/ada/demo/B.vue',
      `<!-- @studio-id ${HME} -->\n${TEMPLATE}`,
    )
    const { add, log } = serve()
    add('src/prototypes/ada/demo/Start.vue', TEMPLATE)
    expect(idOf('src/prototypes/ada/demo/Start.vue')).toBeNull()
    expect(log[0]![0]).toBe('warn')
    expect(log[0]![1]).toContain(
      'src/prototypes/ada/demo/Start.vue was not given an identity',
    )
    expect(log[0]![1]).toContain('is already used by')
    expect(log[0]![1]).toContain(
      'yarn studio identify src/prototypes/ada/demo --yes',
    )
  })

  test('[CL-52] is assigned by only one dev server at a time', () => {
    const release = identityLock(root)
    try {
      const { add, change, log } = serve()
      add('src/prototypes/ada/demo/Start.vue', TEMPLATE)
      expect(idOf('src/prototypes/ada/demo/Start.vue')).toBeNull()
      expect(log[0]![1]).toContain('another dev server is assigning identities')
      release()
      // The next change tries again.
      change('src/prototypes/ada/demo/Start.vue', TEMPLATE)
      expect(idOf('src/prototypes/ada/demo/Start.vue')).not.toBeNull()
    } finally {
      release()
    }
  })

  test('[CL-52] a second dev server finds the ID already written', () => {
    const first = serve()
    const second = serve()
    first.add('src/prototypes/ada/demo/Start.vue', TEMPLATE)
    const id = idOf('src/prototypes/ada/demo/Start.vue')
    second.add(
      'src/prototypes/ada/demo/Start.vue',
      fs.readFileSync(at('src/prototypes/ada/demo/Start.vue'), 'utf8'),
    )
    expect(idOf('src/prototypes/ada/demo/Start.vue')).toBe(id)
    expect(second.log).toEqual([])
  })
})
