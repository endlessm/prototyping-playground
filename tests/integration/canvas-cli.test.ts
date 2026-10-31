// `yarn canvas` as an agent drives it: the canvas tools on a canvas file,
// with arguments inline, from a file or piped, guidance when files have no
// identity yet, rights checks, and titles as navigation shows them.
// Carried over from the React studio's cli and states integration tests.
import { renameSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { artifactTitle } from '../../tooling/manifest/titles'
import { ADA, BEN, tempStudio, type TempStudio } from './setup/temp-studio'

const FOLDER = 'src/prototypes/ada/demo'
const BOARD = `${FOLDER}/board.excalidraw`
const PROTOTYPE = 'dem0000000000001'
const at = (id: string) => `/prototypes/${PROTOTYPE}/artifacts/${id}`

const view = (id: string | null, text: string) =>
  `${id ? `<!-- @studio-id ${id} -->\n` : ''}<template>\n  <p>${text}</p>\n</template>\n`
const HOME = `<!-- @studio-id h0me000000000001 -->
<!-- @studio-state st8a000000000001 Member -->
<!-- @studio-state st8b000000000001 New user -->
<script setup lang="ts">
defineProps<{ name?: string }>()
</script>

<script lang="ts">
export const states = [
  { title: 'Member', props: { name: 'Ana' } },
  { title: 'New user', props: { name: '' } },
]
</script>

<template>
  <p>{{ name ? 'Welcome back, ' + name : 'Welcome' }}</p>
</template>
`
const EMPTY_BOARD = `${JSON.stringify(
  {
    type: 'excalidraw',
    version: 2,
    studioVersion: 1,
    studioId: 'b0ard00000000001',
    elements: [],
    appState: { viewBackgroundColor: '#ffffff', gridSize: 20 },
    files: {},
  },
  null,
  2,
)}\n`

let studio: TempStudio
beforeEach(() => {
  studio = tempStudio()
  studio.withModule('prototypes')
  studio.withModule('canvas')
  studio.withModule('document')
  studio.write(
    `${FOLDER}/meta.json`,
    `${JSON.stringify({
      formatVersion: 1,
      title: 'Demo',
      studioId: PROTOTYPE,
      ownerContributorId: ADA.id,
      systemId: null,
    })}\n`,
  )
  studio.write(`${FOLDER}/Main.vue`, view('ma1n000000000001', 'Main'))
  studio.write(`${FOLDER}/Home.vue`, HOME)
  studio.write(
    `${FOLDER}/notes.md`,
    '---\nstudioId: n0tes00000000001\n---\n\n# Notes\n',
  )
  studio.write(BOARD, EMPTY_BOARD)
})
afterEach(() => {
  studio.remove()
})

const canvas = (...args: string[]) =>
  studio.node('src/modules/canvas/cli.ts', ...args)
const ok = (...args: string[]) => {
  const result = canvas(BOARD, ...args)
  expect(result.status, result.stderr).toBe(0)
  return JSON.parse(result.stdout)
}
const stored = () => JSON.parse(studio.read(BOARD))

describe('yarn canvas', () => {
  test('[CV-144] [CL-164] runs a tool on a canvas file, prints JSON and writes the change to the file', () => {
    const made = ok(
      'create',
      JSON.stringify({ type: 'text', text: 'Hello', x: 0, y: 0 }),
    )
    expect(made).toMatchObject({ ok: true, created: [expect.any(String)] })
    const file = stored()
    expect(file.elements).toHaveLength(1)
    expect(file.elements[0]).toMatchObject({
      id: made.created[0],
      text: 'Hello',
    })
  })

  test('[CV-145] arguments inline, from --json-file (with or without =, with a byte-order mark) and standard input read the same; twice is refused', () => {
    ok('create', JSON.stringify({ type: 'note', text: 'one', x: 0, y: 0 }))
    studio.write('args.json', `\uFEFF${JSON.stringify({ scope: 'all' })}`)
    const described = ok('describe', '{"scope":"all"}')
    expect(ok('describe', '--json-file', 'args.json')).toEqual(described)
    expect(ok('describe', '--json-file=args.json')).toEqual(described)
    const piped = studio.pipe(
      '{"scope":"all"}',
      'src/modules/canvas/cli.ts',
      BOARD,
      'describe',
      '-',
    )
    expect(piped.status, piped.stderr).toBe(0)
    expect(JSON.parse(piped.stdout)).toEqual(described)
    const twice = canvas(BOARD, 'describe', '{}', '--json-file', 'args.json')
    expect(twice.status).toBe(1)
    expect(twice.stderr).toMatch(/Give the arguments once/)
  })

  test('[CV-146] invalid JSON reports where it goes wrong; on Windows inline JSON suggests --json-file or -', () => {
    const inline = canvas(BOARD, 'describe', '{scope:"all"}')
    expect(inline.status).toBe(1)
    expect(inline.stderr).toMatch(
      /the arguments aren't valid JSON: .*position 1/,
    )
    if (process.platform === 'win32')
      expect(inline.stderr).toMatch(/--json-file <path>, or pipe it with -/)
    studio.write('args.json', '{\n  "scope": }')
    const file = canvas(BOARD, 'describe', '--json-file', 'args.json')
    expect(file.status).toBe(1)
    expect(file.stderr).toMatch(
      /args\.json isn't valid JSON: [\s\S]*position 13, line 2 column 12/,
    )
  })

  test('[CV-147] help (or no arguments) prints usage and the tools; help <tool> explains one', () => {
    for (const args of [[], ['help']]) {
      const result = canvas(...args)
      expect(result.status).toBe(0)
      const printed = JSON.parse(result.stdout)
      expect(printed.usage[0]).toMatch(/^yarn canvas <file\.excalidraw> <tool>/)
      expect(
        printed.tools.map((tool: { name: string }) => tool.name),
      ).toContain('states')
    }
    const one = JSON.parse(canvas('help', 'states').stdout)
    expect(one.name).toBe('states')
    expect(one.usage).toBeUndefined()
  })

  test('[CV-148] refuses a file that isn’t a canvas, is missing, is outside a prototype, isn’t JSON, has no elements or is newer', () => {
    const refused = (file: string, message: RegExp) => {
      const result = canvas(file, 'describe')
      expect(result.status).toBe(1)
      expect(result.stderr).toMatch(message)
      expect(result.stderr).not.toMatch(/at file:|\n\s+at /)
    }
    refused(
      `${FOLDER}/Main.vue`,
      /isn't a canvas\. Canvases are \.excalidraw files/,
    )
    refused(
      `${FOLDER}/gone.excalidraw`,
      /doesn't exist\. Make a canvas with \+ → New canvas/,
    )
    studio.write('loose.excalidraw', EMPTY_BOARD)
    refused('loose.excalidraw', /isn't in a prototype/)
    studio.write(`${FOLDER}/broken.excalidraw`, '{ "elements": [')
    refused(
      `${FOLDER}/broken.excalidraw`,
      /broken\.excalidraw isn't valid JSON/,
    )
    studio.write(`${FOLDER}/flat.excalidraw`, '{ "type": "excalidraw" }')
    refused(
      `${FOLDER}/flat.excalidraw`,
      /isn't a canvas: .*no list of elements/,
    )
    studio.write(
      `${FOLDER}/newer.excalidraw`,
      EMPTY_BOARD.replace('"studioVersion": 1', '"studioVersion": 99'),
    )
    refused(
      `${FOLDER}/newer.excalidraw`,
      /written by a newer version of the studio.*Update the studio/,
    )
  })

  test('[CV-150] [CV-151] files without an identity name the fix; --identify runs it, reports on stderr and continues', () => {
    studio.write(`${FOLDER}/Later.vue`, view(null, 'Later'))
    const before = studio.read(BOARD)
    const stale = canvas(BOARD, 'artifacts')
    expect(stale.status).toBe(1)
    expect(stale.stderr).toMatch(/These files have no identity yet: Later\.vue/)
    expect(stale.stderr).toContain(`Run: yarn studio identify ${FOLDER} --yes`)
    expect(stale.stderr).toMatch(/--identify/)
    expect(stale.stderr).not.toMatch(/at file:|Error:/)
    expect(studio.read(BOARD)).toBe(before)

    const main = studio.read(`${FOLDER}/Main.vue`)
    const fixed = canvas(BOARD, 'artifacts', '--identify')
    expect(fixed.status, fixed.stderr).toBe(0)
    expect(fixed.stderr).toMatch(/Running: yarn studio identify/)
    expect(fixed.stderr).toMatch(/Later\.vue → [0-9a-hjkmnp-tv-z]{16}/)
    const listed = JSON.parse(fixed.stdout).artifacts
    expect(listed.map((item: { artifact: string }) => item.artifact)).toContain(
      'Later.vue',
    )
    expect(studio.read(`${FOLDER}/Main.vue`)).toBe(main)
  })

  test('[CV-150] a prototype the manifest leaves out says why', () => {
    studio.write(
      `${FOLDER}/meta.json`,
      `${JSON.stringify({
        formatVersion: 1,
        title: 'Demo',
        studioId: PROTOTYPE,
        ownerContributorId: ADA.id,
        systemId: 'n0system00000001',
      })}\n`,
    )
    const result = canvas(BOARD, 'artifacts')
    expect(result.status).toBe(1)
    expect(result.stderr).toMatch(
      /isn't in the studio's manifest[\s\S]*n0system00000001 is not installed/,
    )
  })

  test('[CV-152] changing tools need the owner or an Admin and an active prototype; reading tools need no rights and never write', () => {
    const before = studio.read(BOARD)
    studio.identify(BEN)
    for (const tool of ['describe', 'artifacts'])
      expect(canvas(BOARD, tool).status).toBe(0)
    expect(canvas(BOARD, 'help').status).toBe(0)
    expect(studio.read(BOARD)).toBe(before)
    const refused = canvas(
      BOARD,
      'create',
      JSON.stringify({ type: 'text', text: 'x' }),
    )
    expect(refused.status).toBe(1)
    expect(refused.stderr).toContain(
      'Only the prototype owner or an Admin can change this canvas.',
    )
    expect(studio.read(BOARD)).toBe(before)

    studio.identify({})
    const nobody = canvas(
      BOARD,
      'create',
      JSON.stringify({ type: 'text', text: 'x' }),
    )
    expect(nobody.status).toBe(1)
    expect(nobody.stderr).toMatch(/doesn't match a contributor profile/)

    studio.identify(ADA)
    const meta = studio.json(`${FOLDER}/meta.json`)
    studio.write(
      `${FOLDER}/meta.json`,
      JSON.stringify({ ...meta, status: 'archived' }),
    )
    const archived = canvas(
      BOARD,
      'create',
      JSON.stringify({ type: 'text', text: 'x' }),
    )
    expect(archived.status).toBe(1)
    expect(archived.stderr).toContain(
      'Restore this prototype before changing its canvas.',
    )
    expect(canvas(BOARD, 'describe').status).toBe(0)
    expect(studio.read(BOARD)).toBe(before)
  })

  test('[CV-153] the live-only tools are refused on the file, naming the file tools', () => {
    for (const tool of ['context', 'point', 'screenshot', 'persist']) {
      const result = canvas(BOARD, tool, '{}')
      expect(result.status).toBe(1)
      expect(result.stderr).toMatch(
        /here\. Tools: describe, artifacts, create, states, update, move, delete, help/,
      )
    }
  })

  test('[CV-154] the write keeps the canvas identity and grid, writes the stable format and leaves no temporary file', () => {
    ok(
      'create',
      JSON.stringify({ type: 'note', text: 'hi', x: 0.123456, y: 0 }),
    )
    const file = stored()
    expect(file).toMatchObject({
      type: 'excalidraw',
      studioVersion: 1,
      studioId: 'b0ard00000000001',
      appState: { gridSize: 20 },
      files: {},
    })
    expect(file.elements[0].x).toBe(0.12)
    expect(file.elements[0]).not.toHaveProperty('isDeleted')
    expect(studio.exists(`${BOARD}.tmp`)).toBe(false)
    // Writing it again unchanged gives the same text.
    const text = studio.read(BOARD)
    ok('move', JSON.stringify({ id: file.elements[0].id, dx: 0, dy: 0 }))
    expect(studio.read(BOARD).replace(/"version(Nonce)?": \d+/g, '')).toBe(
      text.replace(/"version(Nonce)?": \d+/g, ''),
    )
  })

  test('[CV-155] artifact titles in results match navigation', () => {
    for (const name of ['Home - new user', 'checkout-step_two', 'ação rápida'])
      studio.write(`${FOLDER}/flows/${name}.vue`, view(null, name))
    const listed = ok('artifacts', '--identify').artifacts as {
      artifact: string
      title: string
    }[]
    const title = (file: string) =>
      listed.find((item) => item.artifact === file)?.title
    // The titles navigation shows (`tooling/manifest/titles.ts`).
    expect(title('flows/Home - new user.vue')).toBe('Home - New user')
    expect(title('flows/checkout-step_two.vue')).toBe('Checkout Step Two')
    for (const name of ['Home - new user', 'checkout-step_two', 'ação rápida'])
      expect(title(`flows/${name}.vue`)).toBe(artifactTitle(name))
    expect(title('Main.vue')).toBe('Main')
  })

  test('[CV-114] the same tools as in the browser: create, update, move and delete through the file', () => {
    const { refs } = ok(
      'create',
      JSON.stringify({
        elements: [
          { type: 'artifact', artifact: 'Main.vue', x: 0, y: 0, ref: 'main' },
          {
            type: 'artifact',
            artifact: 'notes',
            rightOf: '@main',
            ref: 'notes',
          },
          { type: 'arrow', from: '@main', to: '@notes', text: 'reads' },
        ],
      }),
    )
    expect(
      stored()
        .elements.filter((el: { type: string }) => el.type === 'embeddable')
        .map((el: { link: string }) => el.link),
    ).toEqual([at('ma1n000000000001'), at('n0tes00000000001')])
    ok('update', JSON.stringify({ id: refs.notes, artifact: 'Home.vue' }))
    ok('move', JSON.stringify({ id: refs.main, dx: 0, dy: 120 }))
    ok('delete', JSON.stringify({ id: refs.notes }))
    const left = stored().elements
    expect(left.map((el: { type: string }) => el.type)).toEqual(['embeddable'])
    expect(left[0]).toMatchObject({ y: 120, link: at('ma1n000000000001') })
    const described = ok('describe')
    expect(described.elements[0].artifact).toEqual({
      title: 'Main',
      type: 'View',
    })
  })

  test('[CV-129] states places every state of a view, titled and linked by identity, and the links survive a rename', () => {
    expect(
      ok('artifacts').artifacts.find(
        (item: { artifact: string }) => item.artifact === 'Home.vue',
      ).states,
    ).toEqual(['Member', 'New user'])
    ok(
      'create',
      JSON.stringify({ type: 'text', text: 'Home', fontSize: 28, x: 0, y: 0 }),
    )
    const placed = ok('states', JSON.stringify({ artifact: 'Home.vue' }))
    expect(placed.warnings).toBeUndefined()
    const links = [at('st8a000000000001'), at('st8b000000000001')]
    expect(
      placed.states.map((state: { title: string; link: string }) => [
        state.title,
        state.link,
      ]),
    ).toEqual([
      ['Member', links[0]],
      ['New user', links[1]],
    ])
    const elements = stored().elements
    expect(
      elements
        .filter((el: { type: string }) => el.type === 'embeddable')
        .map((el: { link: string }) => el.link),
    ).toEqual(links)
    expect(
      elements
        .filter((el: { type: string }) => el.type === 'text')
        .map((el: { text: string }) => el.text),
    ).toEqual(['Home', 'Member', 'New user'])
    expect(
      ok('states', JSON.stringify({ artifact: 'Home.vue' })).warnings,
    ).toBeUndefined()

    // Renaming the view keeps every item linked to its state.
    renameSync(
      path.join(studio.root, FOLDER, 'Home.vue'),
      path.join(studio.root, FOLDER, 'Welcome.vue'),
    )
    const states = ok('describe')
      .elements.filter((el: { kind: string }) => el.kind === 'artifact')
      .slice(0, 2)
      .map(
        (el: { link: string; artifact: { title: string; state: string } }) => [
          el.link,
          el.artifact.title,
          el.artifact.state,
        ],
      )
    expect(states).toEqual([
      [links[0], 'Welcome', 'Member'],
      [links[1], 'Welcome', 'New user'],
    ])

    const plain = canvas(
      BOARD,
      'states',
      JSON.stringify({ artifact: 'Main.vue' }),
    )
    expect(plain.status).toBe(1)
    expect(plain.stderr).toMatch(/declares no states/)
    const one = canvas(BOARD, 'states', JSON.stringify({ artifact: links[0] }))
    expect(one.status).toBe(1)
    expect(one.stderr).toMatch(/is one state \("Member"\)/)
  })
})
