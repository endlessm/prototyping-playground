// The canvas tools (`src/modules/canvas/tools/`), the one set the open
// canvas and `yarn canvas` both run: pure, elements in and elements out.
// Carried over from the React studio's tools.test.ts.
import { describe, expect, test } from 'vitest'
import type { ManifestArtifact } from '../../tooling/manifest/build'
import { lineWidth, wrapText } from '../../src/modules/canvas/tools/elements'
import { toolContext } from '../../src/modules/canvas/tools/context'
import {
  help,
  run,
  ToolError,
  type El,
} from '../../src/modules/canvas/tools/tools'

const PROTOTYPE = 'pr0t000000000001'
const BASE = `/prototypes/${PROTOTYPE}`
const at = (id: string) => `${BASE}/artifacts/${id}`
const FOLDER = 'src/prototypes/ada/demo'

const MAIN: ManifestArtifact = {
  id: 'v1ew000000000001',
  title: 'Main',
  path: 'lofi/Main',
  file: `${FOLDER}/lofi/Main.vue`,
  type: 'view',
}
const NOTES: ManifestArtifact = {
  id: 'd0c0000000000001',
  title: 'Notes',
  path: 'notes',
  file: `${FOLDER}/notes.md`,
  type: 'document',
}
const HOME: ManifestArtifact = {
  id: 'h0me000000000001',
  title: 'Home',
  path: 'Home',
  file: `${FOLDER}/Home.vue`,
  type: 'view',
  states: [
    { id: 'st8a000000000001', title: 'Member' },
    {
      id: 'st8b000000000001',
      title: 'New user, with no programs yet and a long title',
    },
  ],
}

const contextOf = (artifacts: ManifestArtifact[]) =>
  toolContext({
    prototype: { id: PROTOTYPE, folder: FOLDER },
    artifacts: () => artifacts,
    typeOf: (type) =>
      type === 'view'
        ? { label: 'View', preview: true }
        : type === 'document'
          ? { label: 'Document', preview: false }
          : undefined,
  })
const ctx = contextOf([MAIN, NOTES])

// Runs tools in turn on one scene, as a caller would.
function session(context = ctx) {
  let scene: El[] = []
  return {
    get scene() {
      return scene
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    call(tool: string, args: unknown): any {
      const out = run(scene, tool, args, context)
      scene = out.elements
      return out.result
    },
    live: () => scene.filter((el) => !el.isDeleted),
  }
}

const LONG =
  'A long note. This one has a lot more to say, because the agent was asked to explain a whole flow in a single sticky note, with reasons, edge cases, and a question at the end that nobody has answered yet. Does it fit?'

describe('help', () => {
  test('[CV-115] lists the tools, marks the live-only ones, explains one, and lists element types for create', () => {
    const { tools } = help() as { tools: { name: string; needs?: string }[] }
    expect(tools.map((tool) => tool.name)).toEqual([
      'context',
      'describe',
      'artifacts',
      'create',
      'states',
      'update',
      'move',
      'delete',
      'point',
      'screenshot',
      'persist',
      'help',
    ])
    for (const live of ['context', 'point', 'screenshot', 'persist'])
      expect(tools.find((tool) => tool.name === live)!.needs).toBe(
        'the open canvas in a browser',
      )
    expect(tools.find((tool) => tool.name === 'states')!.needs).toBeUndefined()
    const move = help('move') as { summary: string; args: object }
    expect(move.summary).toMatch(/dx and dy/)
    expect(Object.keys(move.args)).toEqual(['id', 'dx', 'dy', 'x', 'y'])
    const create = help('create') as { types: Record<string, unknown> }
    expect(Object.keys(create.types)).toEqual([
      'text',
      'note',
      'rectangle',
      'arrow',
      'artifact',
      'section',
    ])
    expect(() => help('nope')).toThrow(/no tool "nope"/)
    expect(run([], 'help', 'states', ctx).result).toEqual(help('states'))
  })

  test('[CV-153] the live-only tools are refused on the file, with the list of file tools', () => {
    for (const tool of ['context', 'point', 'screenshot', 'persist'])
      expect(() => run([], tool, {}, ctx)).toThrow(
        /no tool ".*" here.*describe, artifacts, create, states, update, move, delete, help/,
      )
  })
})

describe('artifacts and describe', () => {
  test('[CV-117] artifacts lists this prototype’s artifacts by source path, title, type, preview or card, and states', () => {
    const { artifacts } = run(
      [],
      'artifacts',
      {},
      contextOf([MAIN, NOTES, HOME]),
    ).result as { artifacts: El[] }
    expect(artifacts).toEqual([
      {
        artifact: 'lofi/Main.vue',
        title: 'Main',
        type: 'View',
        shownAs: 'live preview',
      },
      {
        artifact: 'notes.md',
        title: 'Notes',
        type: 'Document',
        shownAs: 'card',
      },
      {
        artifact: 'Home.vue',
        title: 'Home',
        type: 'View',
        shownAs: 'live preview',
        states: ['Member', 'New user, with no programs yet and a long title'],
      },
    ])
  })

  test('[CV-116] describe reads kinds, places, sizes, text, colors, styles, sections, arrows, artifacts and bounds; ids limits it', () => {
    const s = session()
    const { refs } = s.call('create', {
      elements: [
        { type: 'artifact', artifact: 'lofi/Main', x: 0, y: 0, ref: 'main' },
        { type: 'note', text: 'Check', color: 'pink', rightOf: '@main' },
        {
          type: 'rectangle',
          text: 'Not built',
          strokeStyle: 'dashed',
          rounded: true,
          opacity: 60,
          strokeWidth: 1,
          color: 'gray',
          x: 0,
          y: 600,
          ref: 'box',
        },
        { type: 'arrow', from: '@main', to: '@box' },
        { type: 'section', name: 'Flow', children: ['@box'], ref: 'flow' },
      ],
    })
    s.call('update', { id: refs.box, locked: true })
    const d = s.call('describe', {})
    expect(d.elements.map((e: El) => e.kind)).toEqual([
      'artifact',
      'note',
      'shape',
      'arrow',
      'section',
    ])
    const [view, note, shape, arrow] = d.elements
    expect(view).toMatchObject({
      x: 0,
      y: 0,
      width: 480,
      height: 338,
      link: at(MAIN.id),
      artifact: { title: 'Main', type: 'View' },
    })
    expect(note).toMatchObject({ text: 'Check', color: 'pink' })
    expect(shape).toMatchObject({
      shape: 'rectangle',
      text: 'Not built',
      strokeStyle: 'dashed',
      strokeWidth: 1,
      rounded: true,
      opacity: 60,
      stroke: '#868e96',
      background: '#dee2e6',
      section: refs.flow,
      locked: true,
    })
    expect(arrow).toMatchObject({ from: refs.main, to: refs.box })
    expect(d.sections).toEqual([{ id: refs.flow, name: 'Flow' }])
    expect(d.bounds).toMatchObject({
      x: expect.any(Number),
      width: expect.any(Number),
    })
    // `ids` limits it to some elements, and what is in them.
    const only = s.call('describe', { ids: [refs.flow] })
    expect(only.elements.map((e: El) => e.id)).toEqual([refs.box, refs.flow])
  })
})

describe('create', () => {
  test('[CV-118] makes a list of elements or a single one, at most 200 per call', () => {
    const s = session()
    expect(
      s.call('create', { type: 'text', text: 'One' }).created,
    ).toHaveLength(1)
    expect(
      s.call('create', {
        elements: [
          { type: 'text', text: 'Two', x: 0, y: 200 },
          { type: 'text', text: 'Three', x: 0, y: 300 },
        ],
      }).created,
    ).toHaveLength(2)
    const many = Array.from({ length: 201 }, (_, i) => ({
      type: 'text',
      text: `${i}`,
    }))
    expect(() => s.call('create', { elements: many })).toThrow(
      /at most 200 elements per call/,
    )
    expect(() => s.call('create', {})).toThrow(/create needs \{ elements/)
  })

  test('[CV-119] text keeps its lines, wraps long lines at 560 or to a width, sizes 20 by default, measured erring wide', () => {
    const s = session()
    s.call('create', {
      elements: [
        { type: 'text', text: LONG },
        {
          type: 'text',
          text: 'A paragraph that should wrap at three hundred wide and no wider than that.',
          width: 300,
        },
        { type: 'text', text: 'Short one\nSecond line' },
        { type: 'text', text: 'Heading', fontSize: 28 },
      ],
    })
    const [long, narrow, short, heading] = s.live()
    expect(long.text).toContain('\n')
    expect(long.width).toBeLessThanOrEqual(560)
    expect(long.originalText).toBe(LONG)
    expect(narrow.width).toBe(300)
    for (const line of narrow.text.split('\n'))
      expect(lineWidth(line, 20)).toBeLessThanOrEqual(300)
    expect(short.text).toBe('Short one\nSecond line')
    expect(short.autoResize).not.toBe(false)
    expect(short.fontSize).toBe(20)
    expect(heading.fontSize).toBe(28)
    // Nunito's widths, a little wide: "Heading" at 28 is about 104 px wide.
    expect(heading.width).toBeGreaterThan(100)
    expect(heading.width).toBeLessThan(115)
    for (const width of [120, 180, 300])
      for (const line of wrapText(
        `${LONG} Supercalifragilisticexpialidocious_and_more_words_without_spaces`,
        width,
        20,
      ).split('\n'))
        expect(lineWidth(line, 20)).toBeLessThanOrEqual(width)
  })

  test('[CV-120] a note is a sticky note in four colors, 200 square, taller to fit its text and says so', () => {
    const s = session()
    s.call('create', {
      elements: [
        { type: 'note', text: 'Short' },
        { type: 'note', text: LONG, color: 'blue' },
      ],
    })
    const [short, long] = s.live().filter((el) => el.type === 'rectangle')
    expect([short.width, short.height]).toEqual([200, 200])
    expect(short.backgroundColor).toBe('#ffec99')
    expect(long.height).toBeGreaterThan(200)
    const label = s
      .live()
      .find((el) => el.type === 'text' && el.containerId === long.id)!
    expect(label.y + label.height).toBeLessThanOrEqual(long.y + long.height)
    const asked = s.call('create', {
      elements: [{ type: 'note', text: LONG, height: 120 }],
    })
    expect(asked.warnings.join(' ')).toMatch(/made \d+ tall, not 120/)
    expect(() =>
      s.call('create', { type: 'note', text: 'x', color: 'violet' }),
    ).toThrow(/a note's color must be one of yellow, pink, blue, green/)
  })

  test('[CV-121] rectangles, ellipses and diamonds take a centered label; a rectangle grows to fit it', () => {
    const s = session()
    const out = s.call('create', {
      elements: [
        {
          type: 'rectangle',
          text: 'A labelled box with a long label that needs to wrap inside the shape and make the box taller',
          width: 240,
          height: 80,
          x: 0,
          y: 0,
        },
        {
          type: 'ellipse',
          text: 'An ellipse with far too much text to fit inside it comfortably at all',
          width: 120,
          height: 60,
          x: 600,
          y: 0,
        },
        { type: 'diamond', text: 'Yes?', x: 1200, y: 0 },
      ],
    })
    const [box, ellipse] = s.live().filter((el) => el.type !== 'text')
    const label = s.live().find((el) => el.containerId === box.id)!
    expect(box.height).toBeGreaterThan(80)
    expect(label.y).toBeGreaterThanOrEqual(box.y)
    expect(label.y + label.height).toBeLessThanOrEqual(box.y + box.height)
    expect(Math.abs(label.x + label.width / 2 - (box.x + 120))).toBeLessThan(1)
    expect(ellipse.height).toBe(60)
    expect(out.warnings.join(' ')).toMatch(/made \d+ tall, not 80/)
    expect(out.warnings.join(' ')).toMatch(/may not fit inside its ellipse/)
  })

  test('[CV-122] arrows join two elements and stay attached; lines take a start and dx/dy or points; labels and heads', () => {
    const s = session()
    const { refs } = s.call('create', {
      elements: [
        { type: 'rectangle', text: 'A', x: 0, y: 0, ref: 'a' },
        { type: 'rectangle', text: 'B', x: 400, y: 0, ref: 'b' },
        { type: 'arrow', from: '@a', to: '@b', text: 'then', ref: 'arrow' },
        {
          type: 'arrow',
          x: 0,
          y: 400,
          dx: 100,
          dy: 50,
          head: 'dot',
          startHead: 'bar',
        },
        {
          type: 'line',
          x: 0,
          y: 600,
          points: [
            [100, 0],
            [100, 100],
          ],
        },
      ],
    })
    const arrow = s.live().find((e) => e.id === refs.arrow)!
    expect(arrow.startBinding.elementId).toBe(refs.a)
    expect(arrow.endBinding.elementId).toBe(refs.b)
    expect(
      s
        .live()
        .find((e) => e.id === refs.a)!
        .boundElements.some((b: El) => b.id === arrow.id),
    ).toBe(true)
    expect(arrow.points[1]).toEqual([200, 0])
    expect(s.live().find((e) => e.containerId === arrow.id)!.text).toBe('then')
    const [, free, line] = s
      .live()
      .filter((e) => e.type === 'arrow' || e.type === 'line')
    expect(free.points[1]).toEqual([100, 50])
    expect([free.startArrowhead, free.endArrowhead]).toEqual(['bar', 'dot'])
    expect(line.points).toEqual([
      [0, 0],
      [100, 0],
      [100, 100],
    ])
    s.call('move', { id: refs.b, dx: 0, dy: 300 })
    const after = s.live().find((e) => e.id === arrow.id)!
    expect(after.points[1][1]).toBeGreaterThan(0)
    expect(after.version).toBeGreaterThan(arrow.version)
    expect(() => s.call('create', { type: 'arrow', from: '@a' })).toThrow(
      /needs both `from` and `to`/,
    )
    expect(() =>
      s.call('create', { type: 'arrow', x: 0, y: 0, head: 'star' }),
    ).toThrow(/head must be one of "arrow", "triangle", "dot", "bar", "none"/)
  })

  test('[CV-123] an artifact by source path is stored as its permanent link, 480×338 as a preview, 480×88 as a card', () => {
    const s = session()
    s.call('create', {
      elements: [
        { type: 'artifact', artifact: './lofi/Main.vue', x: 0, y: 0 },
        { type: 'artifact', artifact: 'notes', x: 600, y: 0 },
        { type: 'artifact', artifact: at(MAIN.id), x: 1200, y: 0 },
      ],
    })
    const [view, card, byLink] = s.live()
    expect(view).toMatchObject({
      type: 'embeddable',
      link: at(MAIN.id),
      width: 480,
      height: 338,
    })
    expect(card).toMatchObject({ link: at(NOTES.id), width: 480, height: 88 })
    expect(byLink.link).toBe(at(MAIN.id))
    expect(() =>
      s.call('create', { type: 'artifact', artifact: 'nope' }),
    ).toThrow(
      /no artifact "nope" in this prototype.*lofi\/Main\.vue.*`artifacts` tool/,
    )
    const twins = contextOf([
      MAIN,
      { ...NOTES, path: 'lofi/Main', file: `${FOLDER}/lofi/Main.md` },
    ])
    expect(() =>
      run([], 'create', { type: 'artifact', artifact: 'lofi/Main' }, twins),
    ).toThrow(/ambiguous.*lofi\/Main\.vue, lofi\/Main\.md/)
    expect(
      run([], 'create', { type: 'artifact', artifact: 'lofi/Main.md' }, twins)
        .elements[0]!.link,
    ).toBe(at(NOTES.id))
  })

  test('[CV-124] a section wraps its children with padding, or is sized and grows to hold what goes in', () => {
    const s = session()
    const { refs } = s.call('create', {
      elements: [
        { type: 'note', text: 'one', x: 0, y: 0, ref: 'n1' },
        { type: 'note', text: 'two', x: 300, y: 0, ref: 'n2' },
        { type: 'section', name: 'Pair', children: ['@n1', '@n2'], ref: 's' },
        { type: 'frame', name: 'Empty', x: 0, y: 3000, ref: 'empty' },
      ],
    })
    const frame = s.live().find((e) => e.id === refs.s)!
    expect(frame.type).toBe('frame')
    expect(frame.width).toBeGreaterThanOrEqual(500 + 120)
    expect(frame.height).toBeGreaterThanOrEqual(200 + 120)
    expect(s.live().find((e) => e.id === refs.empty)).toMatchObject({
      width: 1200,
      height: 600,
    })
    const small = s.call('create', {
      elements: [
        {
          type: 'section',
          name: 'Small',
          width: 300,
          height: 100,
          x: 0,
          y: 2000,
          ref: 'small',
        },
        { type: 'artifact', artifact: 'lofi/Main', section: '@small' },
      ],
    })
    const grown = s.live().find((e) => e.id === small.refs.small)!
    expect(grown.height).toBeGreaterThanOrEqual(338 + 120)
    expect(s.live().filter((e) => e.frameId === grown.id)).toHaveLength(1)
  })

  test('[CV-125] placement: x/y, below (left-aligned), rightOf (centered), section, or below everything; align', () => {
    const s = session()
    const { refs } = s.call('create', {
      elements: [
        { type: 'artifact', artifact: 'lofi/Main', x: 0, y: 0, ref: 'view' },
        { type: 'artifact', artifact: 'notes', rightOf: '@view', ref: 'card' },
        {
          type: 'artifact',
          artifact: 'notes',
          rightOf: '@view',
          align: 'start',
          ref: 'top',
        },
        {
          type: 'note',
          text: 'under',
          below: '@card',
          align: 'center',
          ref: 'under',
        },
        { type: 'note', text: 'left', below: '@view', ref: 'left' },
        { type: 'arrow', from: '@view', to: '@card' },
      ],
    })
    const el = (ref: string) => s.live().find((e) => e.id === refs[ref])!
    expect(el('card').y).toBe((338 - 88) / 2)
    expect(el('card').x).toBe(480 + 80)
    expect(el('top').y).toBe(0)
    expect(el('under').x).toBe(el('card').x + (480 - 200) / 2)
    expect(el('left')).toMatchObject({ x: 0, y: 338 + 24 })
    expect(s.live().find((e) => e.type === 'arrow')!.points[1][1]).toBe(0)
    const { created } = s.call('create', { type: 'text', text: 'Last' })
    const last = s.live().find((e) => e.id === created[0])!
    expect(last.y).toBeGreaterThan(el('left').y + el('left').height)
    expect(() =>
      s.call('create', {
        type: 'note',
        text: 'x',
        below: '@card',
        align: 'left',
      }),
    ).toThrow(/align must be/)
  })

  test('[CV-126] style options: color, stroke, background, strokeWidth, strokeStyle, opacity, rounded', () => {
    const s = session()
    const { created } = s.call('create', {
      elements: [
        { type: 'rectangle', color: 'blue', x: 0, y: 0 },
        {
          type: 'rectangle',
          stroke: '#123456',
          background: 'none',
          strokeWidth: 4,
          strokeStyle: 'dotted',
          opacity: 140,
          rounded: true,
          x: 400,
          y: 0,
        },
      ],
    })
    const [blue, custom] = created.map((id: string) =>
      s.live().find((e) => e.id === id),
    )
    expect(blue).toMatchObject({
      strokeColor: '#1971c2',
      backgroundColor: '#a5d8ff',
      fillStyle: 'solid',
    })
    expect(custom).toMatchObject({
      strokeColor: '#123456',
      backgroundColor: 'transparent',
      strokeWidth: 4,
      strokeStyle: 'dotted',
      opacity: 100,
      roundness: { type: 3 },
    })
    expect(() =>
      s.call('create', { type: 'rectangle', color: 'chartreuse' }),
    ).toThrow(/isn't a color.*blue/)
    expect(() =>
      s.call('create', { type: 'rectangle', strokeStyle: 'wavy' }),
    ).toThrow(/strokeStyle must be "solid", "dashed", or "dotted"/)
  })

  test('[CV-127] ref names a new element for @name later in the call; the result returns created ids and refs', () => {
    const s = session()
    const out = s.call('create', {
      elements: [
        { type: 'rectangle', text: 'A', x: 0, y: 0, ref: 'a' },
        { type: 'note', text: 'about A', below: '@a', ref: 'b' },
      ],
    })
    expect(out.ok).toBe(true)
    expect(out.created).toHaveLength(2)
    expect(out.refs).toEqual({ a: out.created[0], b: out.created[1] })
    expect(() =>
      s.call('create', { type: 'note', text: 'x', below: '@nope' }),
    ).toThrow(/below: no element @nope/)
  })

  test('[CV-128] create warns when a new element lands on another', () => {
    const s = session()
    expect(
      s.call('create', { type: 'note', text: 'a', x: 0, y: 0 }).warnings,
    ).toBeUndefined()
    const second = s.call('create', {
      elements: [
        { type: 'note', text: 'b', x: 50, y: 50 },
        { type: 'note', text: 'c', x: 900, y: 0 },
      ],
    })
    expect(second.warnings).toHaveLength(1)
    expect(second.warnings[0]).toMatch(/overlaps/)
  })
})

describe('states', () => {
  const withStates = contextOf([MAIN, HOME])

  test('[CV-129] places every state of a view side by side under its title, linked to each state’s permanent address', () => {
    const heading = run(
      [],
      'create',
      { type: 'text', text: 'Home', x: 0, y: 0 },
      withStates,
    )
    const placed = run(
      heading.elements,
      'states',
      { artifact: 'Home.vue' },
      withStates,
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = placed.result as any
    expect(result.warnings).toBeUndefined()
    expect(result.view).toBe('Home')
    expect(result.states.map((s: El) => [s.title, s.link])).toEqual(
      HOME.states!.map((state) => [state.title, at(state.id)]),
    )
    const byId = (id: string) => placed.elements.find((el) => el.id === id)!
    const [member, newUser] = result.states.map((s: El) => ({
      title: byId(s.titleId),
      embed: byId(s.id),
    }))
    expect(member.embed).toMatchObject({ width: 480, height: 338 })
    expect(member.embed.y).toBe(newUser.embed.y)
    expect(newUser.embed.x).toBeGreaterThanOrEqual(
      member.embed.x + member.embed.width,
    )
    expect(member.title.y).toBeGreaterThan(heading.elements[0]!.y)
    // Titles wrap to the width; embeds line up under the tallest.
    expect(newUser.title.text).toContain('\n')
    expect(member.embed.y).toBeGreaterThanOrEqual(
      newUser.title.y + newUser.title.height,
    )
    expect(member.title.fontSize).toBe(24)
    expect(result.bounds).toMatchObject({ x: 0, width: 480 * 2 + 80 })

    const described = run(placed.elements, 'describe', {}, withStates)
      .result as {
      elements: El[]
    }
    expect(
      described.elements
        .filter((el) => el.kind === 'artifact')
        .map((el) => [el.artifact.title, el.artifact.state]),
    ).toEqual([
      ['Home', 'Member'],
      ['Home', HOME.states![1]!.title],
    ])

    const sized = run(
      [],
      'states',
      { artifact: 'Home', x: 10, y: 20, width: 300, height: 200, fontSize: 16 },
      withStates,
    )
    const embed = sized.elements.find((el) => el.type === 'embeddable')!
    expect(embed).toMatchObject({ x: 10, width: 300, height: 200 })
    const beside = run(
      placed.elements,
      'states',
      { artifact: 'Home.vue', rightOf: member.title.id },
      withStates,
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((beside.result as any).warnings?.length).toBeGreaterThan(0)
    const under = run(
      placed.elements,
      'states',
      { artifact: 'Home.vue', below: member.embed.id },
      withStates,
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((under.result as any).bounds.y).toBe(member.embed.y + 338 + 80)
  })

  test('[CV-129] refuses a single state, a view without states and unknown options', () => {
    expect(() =>
      run([], 'states', { artifact: 'lofi/Main' }, withStates),
    ).toThrow(/declares no states/)
    expect(() =>
      run([], 'states', { artifact: at('st8a000000000001') }, withStates),
    ).toThrow(/is one state \("Member"\)/)
    expect(() => run([], 'states', {}, withStates)).toThrow(/states needs/)
    expect(() =>
      run([], 'states', { artifact: 'Home', gap: 2 }, withStates),
    ).toThrow(/doesn't take gap/)
  })
})

describe('update, move and delete', () => {
  test('[CV-130] update changes only what is given; labels follow their shape; notes keep their colors and grow', () => {
    const s = session()
    const { refs } = s.call('create', {
      elements: [
        {
          type: 'rectangle',
          text: 'Payment',
          color: 'blue',
          ref: 'p',
          x: 0,
          y: 0,
        },
        { type: 'note', text: 'Short', ref: 'n', x: 600, y: 0 },
        { type: 'ellipse', ref: 'e', x: 0, y: 600 },
        { type: 'artifact', artifact: 'lofi/Main', ref: 'view', x: 1200, y: 0 },
        { type: 'section', name: 'Old', x: 0, y: 2000, ref: 's' },
        { type: 'rectangle', ref: 'q', x: 600, y: 600 },
        { type: 'arrow', from: '@p', to: '@e', ref: 'arrow' },
      ],
    })
    s.call('update', {
      id: refs.p,
      text: 'Payment (card)',
      color: 'violet',
      width: 300,
    })
    const shape = s.live().find((e) => e.id === refs.p)!
    const label = s.live().find((e) => e.containerId === refs.p)!
    expect(label.originalText).toBe('Payment (card)')
    expect(label.strokeColor).toBe(shape.strokeColor)
    expect(shape.width).toBe(300)
    expect(Math.abs(label.x + label.width / 2 - (shape.x + 150))).toBeLessThan(
      1,
    )

    s.call('update', { id: refs.n, text: LONG, color: 'green' })
    const note = s.live().find((e) => e.id === refs.n)!
    expect(note.height).toBeGreaterThan(200)
    expect(note.backgroundColor).toBe('#b2f2bb')
    expect(() => s.call('update', { id: refs.n, color: 'violet' })).toThrow(
      /a note's color must be one of/,
    )

    // A shape without a label gets one.
    s.call('update', { id: refs.e, text: 'New label' })
    expect(s.live().find((e) => e.containerId === refs.e)!.text).toBe(
      'New label',
    )
    s.call('update', { id: refs.s, name: 'New' })
    expect(s.live().find((e) => e.id === refs.s)!.name).toBe('New')
    s.call('update', { id: refs.view, artifact: 'notes.md' })
    expect(s.live().find((e) => e.id === refs.view)!.link).toBe(at(NOTES.id))
    s.call('update', { id: refs.arrow, to: refs.q })
    expect(
      s.live().find((e) => e.id === refs.arrow)!.endBinding.elementId,
    ).toBe(refs.q)
    s.call('update', { ids: [refs.p, refs.q], locked: true })
    expect(
      s
        .live()
        .filter((e) => e.locked)
        .map((e) => e.id),
    ).toEqual([refs.p, refs.q])

    expect(() => s.call('update', { id: refs.p, bogus: 1 })).toThrow(
      /can't change bogus/,
    )
    expect(() => s.call('update', { id: refs.p })).toThrow(
      /needs something to change/,
    )
    expect(() => s.call('update', { id: refs.p, name: 'x' })).toThrow(
      /name is a section's title/,
    )
    expect(() => s.call('update', { id: refs.p, from: refs.q })).toThrow(
      /from and to apply to arrows/,
    )
  })

  test('[CV-131] move by dx/dy (several) or to x/y (one); a section takes its contents, a shape its label, arrows follow', () => {
    const s = session()
    const { refs } = s.call('create', {
      elements: [
        { type: 'rectangle', text: 'A', x: 0, y: 0, ref: 'a' },
        { type: 'rectangle', text: 'B', x: 400, y: 0, ref: 'b' },
        { type: 'arrow', from: '@a', to: '@b', ref: 'arrow' },
        { type: 'section', name: 'Both', children: ['@a'], ref: 's' },
      ],
    })
    s.call('move', { id: refs.s, dy: 1000 })
    expect(s.live().find((e) => e.id === refs.a)!.y).toBe(1000)
    const label = s.live().find((e) => e.containerId === refs.a)!
    expect(label.y).toBeGreaterThan(1000)
    expect(s.live().find((e) => e.id === refs.arrow)!.points[1][1]).not.toBe(0)
    s.call('move', { id: refs.b, x: 10, y: 20 })
    expect(s.live().find((e) => e.id === refs.b)).toMatchObject({
      x: 10,
      y: 20,
    })
    s.call('move', { ids: [refs.a, refs.b], dx: 5, dy: 0 })
    expect(s.live().find((e) => e.id === refs.b)!.x).toBe(15)
    expect(() => s.call('move', { ids: [refs.a, refs.b], x: 0, y: 0 })).toThrow(
      /x and y place one element/,
    )
    expect(() => s.call('move', { id: refs.a })).toThrow(
      /move needs dx and dy, or x and y/,
    )
  })

  test('[CV-132] delete takes labels and attached arrows, cleans references, and keeps a section’s contents unless asked', () => {
    const s = session()
    const { refs } = s.call('create', {
      elements: [
        { type: 'rectangle', text: 'A', x: 0, y: 0, ref: 'a' },
        { type: 'rectangle', text: 'B', x: 400, y: 0, ref: 'b' },
        { type: 'arrow', from: '@a', to: '@b', text: 'then' },
        { type: 'note', text: 'kept', x: 0, y: 600, ref: 'kept' },
        { type: 'section', name: 'S', children: ['@kept'], ref: 's' },
        { type: 'note', text: 'gone', x: 0, y: 1600, ref: 'gone' },
        { type: 'section', name: 'T', children: ['@gone'], ref: 't' },
      ],
    })
    s.call('delete', { id: refs.a })
    expect(
      s
        .live()
        .filter((e) => e.y < 500)
        .map((e) => e.type)
        .sort(),
    ).toEqual(['rectangle', 'text'])
    expect(
      s
        .live()
        .find((e) => e.id === refs.b)!
        .boundElements.filter((b: El) => b.type === 'arrow'),
    ).toEqual([])
    s.call('delete', { id: refs.s })
    expect(s.live().find((e) => e.id === refs.kept)!.frameId).toBeNull()
    s.call('delete', { id: refs.t, withContents: true })
    expect(s.live().find((e) => e.id === refs.gone)).toBeUndefined()
  })
})

describe('mistakes', () => {
  test('[CV-133] errors name the element, the field and what is allowed; sizes and text have limits', () => {
    const s = session()
    expect(() =>
      s.call('create', {
        elements: [
          { type: 'text', text: 'fine' },
          { type: 'note', text: 'x', width: 5 },
        ],
      }),
    ).toThrow(/^elements\[1\] \(note\): width must be between 20 and 4000$/)
    expect(() =>
      s.call('create', { type: 'text', text: 'x', width: 99999 }),
    ).toThrow(/between 20 and 4000/)
    expect(() =>
      s.call('create', { type: 'text', text: 'x'.repeat(4001) }),
    ).toThrow(/text is longer than 4000 characters/)
    expect(() => s.call('create', { type: 'blob' })).toThrow(
      /unknown type "blob". Types: note, text/,
    )
    expect(() => s.call('update', { id: 'nope', text: 'x' })).toThrow(
      /no element nope/,
    )
    expect(() => s.call('nope', {})).toThrow(ToolError)
    expect(() => s.call('nope', {})).toThrow(/no tool "nope"/)
  })

  test('[CV-134] artifacts from another prototype are refused; artifacts lists only this one', () => {
    const s = session()
    const other = '/prototypes/0ther00000000001/artifacts/v1ew000000000001'
    expect(() =>
      s.call('create', { type: 'artifact', artifact: other }),
    ).toThrow(
      /is in another prototype.*Copy the view into this prototype first/,
    )
    expect(() =>
      s.call('create', {
        type: 'artifact',
        artifact: `http://127.0.0.1:3000/studio${other}`,
      }),
    ).toThrow(/another prototype/)
    const { refs } = s.call('create', {
      elements: [{ type: 'artifact', artifact: 'lofi/Main', ref: 'main' }],
    })
    expect(() => s.call('update', { id: refs.main, artifact: other })).toThrow(
      /another prototype/,
    )
    expect(
      s.call('artifacts', {}).artifacts.map((item: El) => item.artifact),
    ).toEqual(['lofi/Main.vue', 'notes.md'])
    expect(() =>
      s.call('create', { type: 'artifact', artifact: '../other/Main.vue' }),
    ).toThrow(/no artifact "..\/other\/Main.vue" in this prototype/)
  })
})
