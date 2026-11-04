// `yarn comments` as an agent drives it: listing a prototype's open
// comments, showing one, replying and resolving as the agent of whoever Git
// resolves to, on thread files on disk, and the rules the page and the
// command share. Thread files stay exactly as
// Prettier writes them, and someone unregistered is told to join.
import { mkdirSync, readFileSync, renameSync } from 'node:fs'
import path from 'node:path'
import { format, resolveConfig } from 'prettier'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import handler from '../../src/modules/comments/server/threads'
import { ADA, BEN, tempStudio, type TempStudio } from './setup/temp-studio'

const FOLDER = 'src/prototypes/ben/flows'
const PROTOTYPE = 'f1ws000000000001'
const HOME = 'h0me000000000001'
const MEMBER = 'st8a000000000001'
const FIRST = 'c0mm000000000001'
const SECOND = 'c0mm000000000002'
const DONE = 'c0mm000000000003'

const HOME_VIEW = `<!-- @studio-id ${HOME} -->
<!-- @studio-state ${MEMBER} Member -->
<script setup lang="ts">
defineProps<{ name?: string }>()
</script>

<script lang="ts">
export const states = [{ title: 'Member', props: { name: 'Ana' } }]
</script>

<template>
  <button type="button">Invite students</button>
</template>
`

const thread = (
  id: string,
  artifact: string,
  createdAt: string,
  body: string,
  status: 'open' | 'resolved' = 'open',
) =>
  `${JSON.stringify(
    {
      formatVersion: 1,
      id,
      artifact,
      artifactTitle: artifact === MEMBER ? 'Home · Member' : 'Home',
      anchor: {
        kind: 'button',
        label: 'Button "Invite students"',
        at: { x: 0.5, y: 0.5 },
        selector: '[data-testid="invite"]',
        tag: 'button',
        path: 'main > button',
        text: 'Invite students',
        box: { left: 8, top: 8, width: 120, height: 32, viewport: 1280 },
      },
      status,
      messages: [
        {
          id: `m${id.slice(1)}`,
          author: { contributor: BEN.id },
          body,
          createdAt,
        },
      ],
    },
    null,
    2,
  )}\n`

let studio: TempStudio
beforeEach(() => {
  studio = tempStudio()
  studio.withModule('prototypes')
  studio.withModule('comments')
  studio.write(
    `${FOLDER}/meta.json`,
    `${JSON.stringify({
      formatVersion: 1,
      title: 'Flows',
      studioId: PROTOTYPE,
      ownerContributorId: BEN.id,
      systemId: null,
    })}\n`,
  )
  studio.write(`${FOLDER}/Home.vue`, HOME_VIEW)
  // The state's comment came first, so it is 1 across the whole view.
  studio.write(
    `${FOLDER}/.comments/${FIRST}.json`,
    thread(FIRST, MEMBER, '2026-11-01T10:00:00.000Z', 'Make this bigger.'),
  )
  studio.write(
    `${FOLDER}/.comments/${SECOND}.json`,
    thread(SECOND, HOME, '2026-11-02T10:00:00.000Z', 'Say who is invited.'),
  )
  studio.write(
    `${FOLDER}/.comments/${DONE}.json`,
    thread(DONE, HOME, '2026-10-30T10:00:00.000Z', 'Old news.', 'resolved'),
  )
})
afterEach(() => {
  studio.remove()
})

const comments = (...args: string[]) =>
  studio.node('src/modules/comments/cli.ts', ...args)
/** What the page asks the dev server's handler, as the contributor `me`. */
const page = async (me: string | null, body: Record<string, unknown>) =>
  handler({
    root: studio.root,
    contributorsFolder: path.join(studio.root, 'contributors'),
    me,
    method: 'POST',
    body,
  })
const onHome = {
  prototype: PROTOTYPE,
  artifact: HOME,
  artifactTitle: 'Home',
  anchor: { kind: 'artifact' },
}
const ok = (...args: string[]) => {
  const result = comments(...args)
  expect(result.stderr).toBe('')
  expect(result.status).toBe(0)
  return result.stdout
}
const stored = (id: string) =>
  studio.json<{
    status: string
    resolvedBy?: { contributor: string; agent?: boolean }
    messages: {
      id: string
      author: { contributor: string; agent?: boolean }
      body: string
      editedAt?: string
    }[]
  }>(`${FOLDER}/.comments/${id}.json`)

async function prettierStable(id: string) {
  const text = studio.read(`${FOLDER}/.comments/${id}.json`)
  const options = (await resolveConfig('package.json')) ?? {}
  expect(await format(text, { ...options, parser: 'json' })).toBe(text)
}

const OTHER = 'h0me000000000002'
const OTHER_VIEW = `<!-- @studio-id ${OTHER} -->
<template>
  <p>Remember the deadline</p>
</template>
`
/** A thread file written as the page would have left it. */
function seed(
  id: string,
  fields: { artifact: string; artifactTitle: string; anchor: object },
  folder = FOLDER,
) {
  studio.write(
    `${folder}/.comments/${id}.json`,
    `${JSON.stringify(
      {
        formatVersion: 1,
        id,
        ...fields,
        status: 'open',
        messages: [
          {
            id: `m${id.slice(1)}`,
            author: { contributor: ADA.id },
            body: `About ${fields.artifactTitle}.`,
            createdAt: '2026-11-03T10:00:00.000Z',
          },
        ],
      },
      null,
      2,
    )}\n`,
  )
}

describe('yarn comments', () => {
  test('[CM-46] [CM-47] [CM-48] lists a prototype’s open comments as agent text: each file, its address, and every target, numbered across a view and its states', () => {
    expect(ok(FOLDER)).toBe(`# Prototype "Flows"

Folder: ${FOLDER}

## 2 open comments on View "Home"

File: ${FOLDER}/Home.vue
Address: /prototypes/${PROTOTYPE}/artifacts/${HOME}

### 2. Button "Invite students" · ${FIRST}
State: Member
Path: main > button
- Ben Okafor: Make this bigger.

### 3. Button "Invite students" · ${SECOND}
Path: main > button
- Ben Okafor: Say who is invited.

Reply or resolve with \`yarn comments reply <id> "…"\` and \`yarn comments resolve <id>\`.
`)
  })

  test('[CM-47] a quoted comment names its quote, and a whole-file comment its file', () => {
    studio.write(`${FOLDER}/Other.vue`, OTHER_VIEW)
    seed('c0mm000000000004', {
      artifact: OTHER,
      artifactTitle: 'Other',
      anchor: {
        kind: 'paragraph',
        label: 'Paragraph "Remember the deadline"',
        path: 'main > p',
        quote: 'the deadline',
      },
    })
    seed('c0mm000000000005', {
      artifact: OTHER,
      artifactTitle: 'Other',
      anchor: { kind: 'artifact' },
    })
    const output = ok(FOLDER)
    expect(output).toContain(`## 2 open comments on View "Other"

File: ${FOLDER}/Other.vue
Address: /prototypes/${PROTOTYPE}/artifacts/${OTHER}

### 1. Paragraph "Remember the deadline" · c0mm000000000004
Path: main > p
Quote: "the deadline"
- Ada Lovelace: About Other.

### 2. The whole view · c0mm000000000005
- Ada Lovelace: About Other.`)
  })

  test('[CM-63] comments on a file removed since are listed with their stored title and anchor', () => {
    seed('c0mm000000000006', {
      artifact: 'g0ne000000000001',
      artifactTitle: 'Old board',
      anchor: {
        kind: 'button',
        label: 'Button "Share"',
        path: 'main > .toolbar > button',
      },
    })
    expect(ok(FOLDER)).toContain(`## 1 open comment on "Old board"

File removed

### 1. Button "Share" · c0mm000000000006
Path: main > .toolbar > button
- Ada Lovelace: About Old board.`)
  })

  test('[CM-62] [CM-58] comments stay on a file that is renamed and moved, in a prototype whose folder is renamed', () => {
    const moved = 'src/prototypes/ben/sign-up'
    renameSync(path.join(studio.root, FOLDER), path.join(studio.root, moved))
    mkdirSync(path.join(studio.root, moved, 'flows'))
    renameSync(
      path.join(studio.root, moved, 'Home.vue'),
      path.join(studio.root, moved, 'flows/Start.vue'),
    )
    const output = ok(moved)
    expect(output).toContain(`## 2 open comments on View "Start"

File: ${moved}/flows/Start.vue
Address: /prototypes/${PROTOTYPE}/artifacts/${HOME}

### 2. Button "Invite students" · ${FIRST}
State: Member`)
    expect(output).toContain(`### 3. Button "Invite students" · ${SECOND}`)
    expect(output).not.toContain('File removed')
  })

  test('[CM-46] an address names one file, a view with its states, or the whole prototype', () => {
    studio.write(`${FOLDER}/Other.vue`, OTHER_VIEW)
    seed('c0mm000000000004', {
      artifact: OTHER,
      artifactTitle: 'Other',
      anchor: { kind: 'artifact' },
    })
    const home = ok(`/prototypes/${PROTOTYPE}/artifacts/${HOME}`)
    expect(home).toContain('## 2 open comments on View "Home"')
    expect(home).not.toContain('About Other.')
    // A named state's address, as copied from the browser, is its view's.
    expect(
      ok(
        `http://localhost:3000/prototypes/${PROTOTYPE}/artifacts/${MEMBER}?x=1`,
      ),
    ).toBe(home)
    const other = ok(`/prototypes/${PROTOTYPE}/artifacts/${OTHER}`)
    expect(other).toContain('## 1 open comment on View "Other"')
    expect(other).not.toContain('Make this bigger.')
    const whole = ok(`/prototypes/${PROTOTYPE}`)
    expect(whole).toContain('About Other.')
    expect(whole).toContain('Make this bigger.')

    const unknown = comments(
      `/prototypes/${PROTOTYPE}/artifacts/n0pe000000000001`,
    )
    expect(unknown.status).toBe(1)
    expect(unknown.stderr).toContain(
      `“Flows” has no file n0pe000000000001, and no comments on one.`,
    )
  })

  test('[CM-46] --resolved lists the resolved comments instead', () => {
    const output = ok(FOLDER, '--resolved')
    expect(output).toContain(`## 1 resolved comment on View "Home"`)
    expect(output).toContain(`### 1. Button "Invite students" · ${DONE}`)
    expect(output).toContain('- Ben Okafor: Old news.')
    expect(output).not.toContain('Make this bigger.')
    expect(output).toContain('`yarn comments reopen <id>`')
  })

  test('[CM-48] --json gives the stored threads with their file, address and number', () => {
    seed('c0mm000000000006', {
      artifact: 'g0ne000000000001',
      artifactTitle: 'Old board',
      anchor: { kind: 'artifact' },
    })
    const threads = JSON.parse(ok(FOLDER, '--json')) as Record<
      string,
      unknown
    >[]
    expect(threads.map(({ id }) => id)).toEqual([
      FIRST,
      SECOND,
      'c0mm000000000006',
    ])
    expect(threads[0]).toMatchObject({
      id: FIRST,
      number: 2,
      file: `${FOLDER}/Home.vue`,
      address: `/prototypes/${PROTOTYPE}/artifacts/${MEMBER}`,
      artifact: MEMBER,
      status: 'open',
      anchor: { label: 'Button "Invite students"' },
      messages: [expect.objectContaining({ body: 'Make this bigger.' })],
    })
    expect(threads[2]).toMatchObject({ number: 1, file: null })
    expect(
      (JSON.parse(ok(FOLDER, '--json', '--resolved')) as { id: string }[]).map(
        ({ id }) => id,
      ),
    ).toEqual([DONE])
  })

  test('[CM-46] with no argument, lists only the prototypes you own', () => {
    const MINE = 'src/prototypes/ada/sketch'
    studio.write(
      `${MINE}/meta.json`,
      `${JSON.stringify({
        formatVersion: 1,
        title: 'Sketch',
        studioId: 'sk3t000000000001',
        ownerContributorId: ADA.id,
        systemId: null,
      })}\n`,
    )
    studio.identify(BEN)
    expect(ok()).toContain('Say who is invited.')
    studio.identify(ADA)
    expect(ok()).toBe('No open comments on your prototypes.\n')
    seed(
      'c0mm000000000007',
      {
        artifact: 'g0ne000000000002',
        artifactTitle: 'Gone',
        anchor: { kind: 'artifact' },
      },
      MINE,
    )
    const mine = ok()
    expect(mine).toContain('# Prototype "Sketch"')
    expect(mine).not.toContain('Flows')
  })

  test('[CM-49] shows a thread, and replies as the agent of whoever Git resolves to', async () => {
    expect(ok('show', SECOND)).toContain(`## Comment 3 on View "Home"

File: ${FOLDER}/Home.vue
Address: /prototypes/${PROTOTYPE}/artifacts/${HOME}

### 3. Button "Invite students" · ${SECOND}
Path: main > button
- Ben Okafor: Say who is invited.`)
    expect(ok('reply', SECOND, 'Added the class name under the button.')).toBe(
      `Replied to comment ${SECOND}.\n`,
    )
    expect(stored(SECOND).messages.at(-1)).toMatchObject({
      author: { contributor: ADA.id, agent: true },
      body: 'Added the class name under the button.',
    })
    expect(ok('show', SECOND)).toContain(
      "- Ada's agent: Added the class name under the button.",
    )
    await prettierStable(SECOND)
  })

  test('[CM-49] resolves with a last reply, and the thread leaves the list', async () => {
    ok('resolve', FIRST, '--reply', 'Made it the large size.')
    const thread = stored(FIRST)
    expect(thread.status).toBe('resolved')
    expect(thread.resolvedBy).toEqual({ contributor: ADA.id, agent: true })
    expect(thread.messages.at(-1)?.body).toBe('Made it the large size.')
    expect(ok(FOLDER)).toContain('## 1 open comment on View "Home"')
    await prettierStable(FIRST)
  })

  test('[CM-50] reopens a resolved comment, which comes back to the list', async () => {
    expect(ok('reopen', DONE)).toBe(`Reopened comment ${DONE}.\n`)
    const thread = stored(DONE)
    expect(thread.status).toBe('open')
    expect(thread.resolvedBy).toBeUndefined()
    expect(ok(FOLDER)).toContain('Old news.')
    await prettierStable(DONE)
  })

  test('[CM-57] someone unregistered is told to join, and nothing changes', async () => {
    studio.identify({ name: 'Nobody', email: 'nobody@elsewhere.example' })
    const before = studio.read(`${FOLDER}/.comments/${FIRST}.json`)
    const result = comments('reply', FIRST, 'Hello')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain(
      "Only contributors can comment, and your Git identity (nobody@elsewhere.example) doesn't match a contributor profile. Join the studio with `yarn studio join`, then try again.",
    )
    expect(studio.read(`${FOLDER}/.comments/${FIRST}.json`)).toBe(before)
    // Reading needs no registration.
    expect(comments(FOLDER).status).toBe(0)
    // The page is told the same, so it can say so in place of its fields.
    expect(
      await page(null, { action: 'access', prototype: PROTOTYPE }),
    ).toMatchObject({
      refusal: expect.stringContaining(
        "doesn't match a contributor profile. Join the studio with `yarn studio join`, then try again.",
      ),
      join: true,
      author: null,
    })
    await expect(
      page(null, { action: 'reopen', thread: DONE }),
    ).rejects.toThrow('Only contributors can comment')
  })

  test('[CM-61] an archived prototype’s comments are read-only, for the command and the page alike', async () => {
    const meta = studio.json(`${FOLDER}/meta.json`)
    studio.write(
      `${FOLDER}/meta.json`,
      `${JSON.stringify({ ...meta, status: 'archived' })}\n`,
    )
    const before = studio.read(`${FOLDER}/.comments/${DONE}.json`)
    const sentence =
      '“Flows” is archived, so its comments are read-only. Restore it to comment.'
    for (const args of [
      ['reply', FIRST, 'Hello'],
      ['resolve', FIRST],
      ['reopen', DONE],
    ]) {
      const result = comments(...args)
      expect(result.status).toBe(1)
      expect(result.stderr.trim()).toBe(sentence)
    }
    expect(studio.read(`${FOLDER}/.comments/${DONE}.json`)).toBe(before)
    await expect(
      page('ada', { action: 'create', ...onHome, body: 'Hello' }),
    ).rejects.toThrow(sentence)
    expect(
      await page('ada', { action: 'access', prototype: PROTOTYPE }),
    ).toEqual(expect.objectContaining({ refusal: sentence }))
    // Reading still works.
    expect(ok(FOLDER)).toContain('Make this bigger.')
  })

  test('[CM-51] [CM-54] anyone registered may resolve someone else’s comment, but only a message’s author edits or deletes it', async () => {
    // Ada resolves and reopens Ben's comment, on Ben's prototype.
    ok('resolve', SECOND)
    ok('reopen', SECOND)
    ok('reply', SECOND, 'Added the class name.')
    const [first, agentReply] = stored(SECOND).messages
    await expect(
      page('ada', {
        action: 'edit',
        thread: SECOND,
        message: first!.id,
        body: 'Say nothing.',
      }),
    ).rejects.toMatchObject({
      status: 403,
      message:
        'Only its author can edit a message. Reply to add to it instead.',
    })
    await expect(
      page('ben', {
        action: 'delete-message',
        thread: SECOND,
        message: agentReply!.id,
      }),
    ).rejects.toThrow('Only its author can delete a message.')
    // Ben's agent may not change Ben's own words either.
    expect(stored(SECOND).messages[0]!.body).toBe('Say who is invited.')

    // The authors may: Ben his message, Ada her agent's reply.
    await page('ben', {
      action: 'edit',
      thread: SECOND,
      message: first!.id,
      body: 'Say which class is invited.',
    })
    await page('ada', {
      action: 'delete-message',
      thread: SECOND,
      message: agentReply!.id,
    })
    const edited = stored(SECOND)
    expect(edited.messages).toHaveLength(1)
    expect(edited.messages[0]!.body).toBe('Say which class is invited.')
    expect(edited.messages[0]!.editedAt).toEqual(expect.any(String))
    await prettierStable(SECOND)
    await expect(
      page('ben', {
        action: 'delete-message',
        thread: SECOND,
        message: first!.id,
      }),
    ).rejects.toThrow(
      'The first message is the comment itself. Edit it, or delete the whole comment instead.',
    )
  })

  test('[CM-38] a comment is deleted by its author or an Admin, and nobody else', async () => {
    const refusal =
      'Only the comment’s author or an Admin can delete it. Resolve it instead when it’s done.'
    // Ada is an Admin here; Ben isn't.
    const mine = await page('ada', {
      action: 'create',
      ...onHome,
      body: 'Mine.',
    })
    const id = (mine as { id: string }).id
    await expect(page('ben', { action: 'delete', thread: id })).rejects.toThrow(
      refusal,
    )
    expect(studio.exists(`${FOLDER}/.comments/${id}.json`)).toBe(true)
    await page('ben', { action: 'delete', thread: SECOND })
    expect(studio.exists(`${FOLDER}/.comments/${SECOND}.json`)).toBe(false)
    await page('ada', { action: 'delete', thread: FIRST })
    expect(studio.exists(`${FOLDER}/.comments/${FIRST}.json`)).toBe(false)
    // Without the Admin role, Ada can't delete Ben's.
    studio.setConfig({ admins: [BEN.id] })
    await expect(
      page('ada', { action: 'delete', thread: DONE }),
    ).rejects.toThrow(refusal)
    expect(
      await page('ada', { action: 'access', prototype: PROTOTYPE }),
    ).toEqual({
      refusal: null,
      join: false,
      author: { contributor: ADA.id },
      admin: false,
    })
  })

  test('[CM-51] an unknown comment ID says how to find one', () => {
    const result = comments('resolve', 'c0mm00000000zzzz')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('There is no comment c0mm00000000zzzz.')
    expect(
      readFileSync(`${studio.root}/${FOLDER}/meta.json`, 'utf8'),
    ).toContain(PROTOTYPE)
  })
})
