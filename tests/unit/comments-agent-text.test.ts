// The agent text: what Copy for agent puts on the clipboard and what
// `yarn comments` prints, from one formatter. The expected text is the
// Comments prototype's "What the agent gets", written by hand.
import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { agentText } from '../../src/modules/comments/agentText'
import comments from '../../src/modules/comments/module'
import type {
  Anchor,
  Author,
  CommentThread,
} from '../../src/modules/comments/threads'

const ADA = 'ada0000000000001'
const BERNARDO = 'brn0000000000001'
const NAMES: Record<string, string> = {
  [ADA]: 'Ada Lovelace',
  [BERNARDO]: 'Bernardo Campos',
}
const name = (contributor: string) => NAMES[contributor]

const VIEW = 'm6fsmtjn97wj16ke'
let minute = 0
function thread(
  id: string,
  anchor: Anchor,
  messages: [Author, string][],
  extra: Partial<CommentThread> = {},
): CommentThread {
  minute++
  return {
    formatVersion: 1,
    id,
    artifact: VIEW,
    artifactTitle: '1 View',
    anchor,
    status: 'open',
    messages: messages.map(([author, body], index) => ({
      id: `${index}${id.slice(1)}`,
      author,
      body,
      createdAt: `2026-11-03T10:${String(minute).padStart(2, '0')}:0${index}.000Z`,
    })),
    ...extra,
  }
}

const invite = thread(
  'c7k2m9qd4tw1xb3e',
  {
    kind: 'button',
    label: 'Button "Invite students"',
    path: 'main > .heading > .actions > button.btn.primary',
  },
  [
    [
      { contributor: ADA },
      'Should this open the class link right away? In the interviews, teachers looked for the link before anything else.',
    ],
    [
      { contributor: BERNARDO },
      'Agreed. Let’s try opening the link dialog first.',
    ],
  ],
)
const help = thread(
  'h3vq8n2rzk6pye0a',
  {
    kind: 'card',
    label: 'Card "Need help"',
    path: 'main > section.stats > article.stat.warn',
  },
  [
    [
      { contributor: BERNARDO },
      'Make this card clickable: it should filter the table to the two students who need help.',
    ],
    [
      { contributor: BERNARDO, agent: true },
      'Done in 1 View.vue: the card now filters the table to Leo and Tomás. Resolve this when you’ve checked it.',
    ],
  ],
)
const done = thread(
  'r9d0000000000003',
  { kind: 'heading', label: 'Heading "Class"', path: 'main > h1' },
  [[{ contributor: ADA }, 'Rename the class.']],
  {
    status: 'resolved',
    resolvedBy: { contributor: BERNARDO, agent: true },
    resolvedAt: '2026-11-03T12:00:00.000Z',
  },
)
const upcoming = thread(
  'w5tj1c0mx9gr2dfs',
  {
    kind: 'card',
    label: 'Card "Upcoming sessions"',
    path: 'main > section.sessions',
  },
  [[{ contributor: BERNARDO }, 'Move upcoming sessions above the table.']],
)
const numbers = new Map([
  [invite.id, 1],
  [help.id, 2],
  [done.id, 3],
  [upcoming.id, 4],
])
const view = {
  type: 'view',
  title: '1 View',
  file: 'src/prototypes/bernardo/comments/1 View.vue',
  address: '/prototypes/j64q52s6xfvb7503/artifacts/m6fsmtjn97wj16ke',
  numbers,
}

describe('the agent text', () => {
  test('[CM-45] [CM-47] [CM-48] names the file, its address and each open thread’s target, messages and ID, with the page’s “Target not found”', () => {
    expect(
      agentText(
        [
          {
            ...view,
            threads: [upcoming, help, invite],
            missing: new Set([upcoming.id]),
          },
        ],
        { name },
      ),
    ).toBe(`## 3 open comments on View "1 View"

File: src/prototypes/bernardo/comments/1 View.vue
Address: /prototypes/j64q52s6xfvb7503/artifacts/m6fsmtjn97wj16ke

### 1. Button "Invite students" · c7k2m9qd4tw1xb3e
Path: main > .heading > .actions > button.btn.primary
- Ada Lovelace: Should this open the class link right away? In the interviews, teachers looked for the link before anything else.
- Bernardo Campos: Agreed. Let’s try opening the link dialog first.

### 2. Card "Need help" · h3vq8n2rzk6pye0a
Path: main > section.stats > article.stat.warn
- Bernardo Campos: Make this card clickable: it should filter the table to the two students who need help.
- Bernardo's agent: Done in 1 View.vue: the card now filters the table to Leo and Tomás. Resolve this when you’ve checked it.

### 4. Card "Upcoming sessions" · w5tj1c0mx9gr2dfs
Target not found: it was removed or changed since.
- Bernardo Campos: Move upcoming sessions above the table.

Reply or resolve with \`yarn comments reply <id> "…"\` and \`yarn comments resolve <id>\`.
`)
  })

  test('[CM-47] a quote, a named state and a whole-file comment each name their target', () => {
    const quoted = thread(
      'q0000000000000a1',
      {
        kind: 'paragraph',
        label: 'Paragraph "Remember the deadline"',
        path: 'main > p',
        quote: 'the deadline',
      },
      [[{ contributor: ADA }, 'Which deadline?\nThere are two.']],
      { artifact: 'st0000000000000a' },
    )
    const whole = thread('w0000000000000a1', { kind: 'artifact' }, [
      [{ contributor: 'nobody0000000001' }, 'Too busy overall.'],
    ])
    const text = agentText(
      [
        {
          ...view,
          threads: [quoted, whole],
          numbers: new Map([
            [quoted.id, 1],
            [whole.id, 2],
          ]),
          states: { st0000000000000a: 'Member' },
        },
      ],
      { name },
    )
    expect(text)
      .toContain(`### 1. Paragraph "Remember the deadline" · q0000000000000a1
State: Member
Path: main > p
Quote: "the deadline"
- Ada Lovelace: Which deadline?
  There are two.`)
    expect(text).toContain(`### 2. The whole view · w0000000000000a1
- Someone: Too busy overall.`)
    expect(text).toMatch(/^## 2 open comments on View "1 View"/)
  })

  test('[CM-63] a file removed since keeps its stored title and anchor, and says so', () => {
    const text = agentText(
      [
        {
          type: null,
          title: 'Old board',
          file: null,
          address: '/prototypes/j64q52s6xfvb7503/artifacts/0ld0000000000001',
          threads: [invite],
          numbers,
        },
      ],
      { name },
    )
    expect(text).toMatch(
      /^## 1 open comment on "Old board"\n\nFile removed\n\n### 1\. Button "Invite students"/,
    )
    expect(text).toContain(
      'Path: main > .heading > .actions > button.btn.primary',
    )
    expect(text).not.toContain('Address:')
  })

  test('[CM-46] resolved threads say who resolved them and how to reopen, and prototypes head their files', () => {
    const text = agentText(
      [
        {
          ...view,
          threads: [done],
          prototype: {
            title: 'Comments',
            folder: 'src/prototypes/bernardo/comments',
          },
        },
      ],
      { name, status: 'resolved' },
    )
    expect(text).toBe(`# Prototype "Comments"

Folder: src/prototypes/bernardo/comments

## 1 resolved comment on View "1 View"

File: src/prototypes/bernardo/comments/1 View.vue
Address: /prototypes/j64q52s6xfvb7503/artifacts/m6fsmtjn97wj16ke

### 3. Heading "Class" · r9d0000000000003
Path: main > h1
- Ada Lovelace: Rename the class.
Resolved by Bernardo's agent.

Reopen with \`yarn comments reopen <id>\`, or reply with \`yarn comments reply <id> "…"\`.
`)
  })

  test('[CM-49] one thread, as `yarn comments show` prints it', () => {
    expect(
      agentText([{ ...view, threads: [help] }], { name, one: true }),
    ).toMatch(/^## Comment 2 on View "1 View"\n\nFile: /)
  })

  test('[CM-47] a document names the heading, the quote and the embed; a diagram the Mermaid ID', () => {
    const quoted = thread(
      'd0c0000000000001',
      {
        kind: 'text',
        label: 'Text in "Goals"',
        quote: 'the class link',
        prefix: 'Teachers expect ',
        suffix: ' before they',
        block: 'paragraph',
        heading: 'Goals',
        headingId: 'goals',
        index: 0,
        text: 'Teachers expect the class link before they invite anyone.',
      },
      [[{ contributor: ADA }, 'Three of five, or all five?']],
    )
    const embed = thread(
      'd0c0000000000002',
      {
        kind: 'embed',
        label: 'Embed "Home screen"',
        block: 'embed',
        heading: 'Screens',
        headingId: 'screens',
        index: 0,
        text: 'Home screen',
        embed: './Home.vue',
      },
      [[{ contributor: ADA }, 'This screen misses the menu.']],
    )
    const document = agentText(
      [
        {
          type: 'document',
          title: 'Brief',
          file: 'src/prototypes/ada/notes/Brief.md',
          address: '/prototypes/d0c5000000000001/artifacts/d0c5000000000002',
          threads: [quoted, embed],
          numbers: new Map([
            [quoted.id, 1],
            [embed.id, 2],
          ]),
          missing: new Set([embed.id]),
        },
      ],
      { name },
    )
    expect(document).toContain(`### 1. Text in "Goals" · d0c0000000000001
Heading: Goals
Quote: "the class link"
- Ada Lovelace: Three of five, or all five?`)
    // Gone: its stored place would mislead.
    expect(document).toContain(`### 2. Embed "Home screen" · d0c0000000000002
Target not found: it was removed or changed since.
- Ada Lovelace: This screen misses the menu.`)

    const step = thread(
      'd1a0000000000001',
      {
        kind: 'step',
        label: 'Step "Under 18?"',
        mermaid: 'age',
      },
      [[{ contributor: ADA }, 'Where does the consent email go?']],
    )
    const arrow = thread(
      'd1a0000000000002',
      {
        kind: 'arrow',
        label: 'Arrow "Sign in" → "Under 18?"',
        mermaid: 'start --> age',
      },
      [[{ contributor: ADA }, 'Dashed, maybe?']],
    )
    const diagram = agentText(
      [
        {
          type: 'diagram',
          title: 'Sign-in',
          file: 'src/prototypes/ada/flows/Sign-in.mermaid',
          address: '/prototypes/d1a6000000000001/artifacts/d1a6000000000002',
          threads: [step, arrow],
          numbers: new Map([
            [step.id, 1],
            [arrow.id, 2],
          ]),
        },
      ],
      { name },
    )
    expect(diagram).toContain(`### 1. Step "Under 18?" · d1a0000000000001
Mermaid ID: age
- Ada Lovelace: Where does the consent email go?`)
    expect(diagram)
      .toContain(`### 2. Arrow "Sign in" → "Under 18?" · d1a0000000000002
Mermaid ID: start --> age
`)
  })

  test('[CM-47] a canvas names the Excalidraw ID, the linked artifact and an empty spot’s point', () => {
    const note = thread(
      'c4n0000000000001',
      {
        kind: 'note',
        label: 'Sticky note "Ask eng about the empty state"',
        at: { x: 0.5, y: 0.5 },
        element: 'note',
        text: 'Ask eng about the empty state',
      },
      [[{ contributor: ADA }, 'Who answers this?']],
    )
    const item = thread(
      'c4n0000000000002',
      {
        kind: 'item',
        label: 'Item "Board"',
        at: { x: 0.5, y: 0.5 },
        element: 'item',
        item: '/prototypes/rvw0000000000c01/artifacts/b0ard0000000c001',
        text: 'Board',
      },
      [[{ contributor: ADA }, 'Too busy']],
    )
    const spot = thread(
      'c4n0000000000003',
      {
        kind: 'spot',
        label: 'Empty spot',
        at: { x: 0, y: 0 },
        point: { x: 700, y: 150.5 },
      },
      [[{ contributor: ADA }, 'A legend here']],
    )
    const canvas = agentText(
      [
        {
          type: 'canvas',
          title: 'Board',
          file: 'src/prototypes/ada/review/Board.excalidraw',
          address: '/prototypes/rvw0000000000c01/artifacts/rvwc000000000c01',
          threads: [note, item, spot],
          numbers: new Map([
            [note.id, 1],
            [item.id, 2],
            [spot.id, 3],
          ]),
          missing: new Set([item.id]),
        },
      ],
      { name },
    )
    expect(canvas)
      .toContain(`### 1. Sticky note "Ask eng about the empty state" · c4n0000000000001
Excalidraw ID: note
- Ada Lovelace: Who answers this?`)
    // Gone: neither its ID nor its link would find it.
    expect(canvas).toContain(`### 2. Item "Board" · c4n0000000000002
Target not found: it was removed or changed since.
- Ada Lovelace: Too busy`)
    expect(canvas).toContain(`### 3. Empty spot · c4n0000000000003
Canvas point: x 700, y 150.5
- Ada Lovelace: A legend here`)
    const found = agentText(
      [
        {
          type: 'canvas',
          title: 'Board',
          file: 'src/prototypes/ada/review/Board.excalidraw',
          address: '/prototypes/rvw0000000000c01/artifacts/rvwc000000000c01',
          threads: [item],
          numbers: new Map([[item.id, 2]]),
        },
      ],
      { name },
    )
    expect(found).toContain(`### 2. Item "Board" · c4n0000000000002
Excalidraw ID: item
Linked artifact: /prototypes/rvw0000000000c01/artifacts/b0ard0000000c001
- Ada Lovelace: Too busy`)
  })

  test('nothing to list is no text', () => {
    expect(agentText([{ ...view, threads: [] }], { name })).toBe('')
  })
})

describe('the address-comments skill', () => {
  test('[CM-53] the Comments module carries it and AGENTS.md routes to it: list first, reply with what changed, resolve only when asked, never change people’s messages', () => {
    expect(comments.skills).toEqual([
      expect.objectContaining({ path: 'skills/address-comments/' }),
    ])
    const skill = readFileSync(
      'src/modules/comments/skills/address-comments/SKILL.md',
      'utf8',
    )
    expect(skill).toMatch(/^---\r?\nname: address-comments\r?\ndescription: /)
    for (const topic of [
      'yarn comments',
      '--resolved',
      '--json',
      'yarn comments show <id>',
      'yarn comments reply <id>',
      'what you changed and where',
      'only when the person asks',
      'leave editing and deleting messages to their authors',
      'Target not found',
      'File removed',
    ])
      expect(skill).toContain(topic)
    expect(readFileSync('AGENTS.md', 'utf8')).toContain(
      'When the person asks to read, answer or resolve comments on a prototype, read [Comments: address-comments](src/modules/comments/skills/address-comments/SKILL.md).',
    )
  })
})
