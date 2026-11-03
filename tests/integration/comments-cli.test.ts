// `yarn comments` as an agent drives it: listing a prototype's open
// comments, showing one, replying and resolving as the agent of whoever Git
// resolves to, on thread files on disk. Thread files stay exactly as
// Prettier writes them, and someone unregistered is told to join.
import { readFileSync } from 'node:fs'
import { format, resolveConfig } from 'prettier'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
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
      author: { contributor: string; agent?: boolean }
      body: string
    }[]
  }>(`${FOLDER}/.comments/${id}.json`)

async function prettierStable(id: string) {
  const text = studio.read(`${FOLDER}/.comments/${id}.json`)
  const options = (await resolveConfig('package.json')) ?? {}
  expect(await format(text, { ...options, parser: 'json' })).toBe(text)
}

describe('yarn comments', () => {
  test('[CM-46] lists a prototype’s open comments with what they are pinned to, numbered across a view and its states', () => {
    const output = ok(FOLDER)
    expect(output).toContain(`Flows — ${FOLDER}`)
    expect(output).toContain('2 open comments')
    expect(output).toContain('#2 Button "Invite students" on Home · Member')
    expect(output).toContain('#3 Button "Invite students" on Home\n')
    expect(output).toContain(`ID: ${FIRST}  Artifact: ${MEMBER}`)
    expect(output).toContain('Path: main > button  Text: "Invite students"')
    expect(output).toContain('Ben Okafor: Make this bigger.')
    expect(output).toContain('yarn comments reply <id> "<text>"')
    // Resolved comments stay out of the list, but keep their number.
    expect(output).not.toContain('Old news.')
  })

  test('[CM-46] with no folder, lists the prototypes you own', () => {
    studio.identify(BEN)
    expect(ok()).toContain('Say who is invited.')
    studio.identify(ADA)
    expect(ok()).toBe('No open comments on your prototypes.\n')
  })

  test('[CM-49] shows a thread, and replies as the agent of whoever Git resolves to', async () => {
    expect(ok('show', SECOND)).toContain('Ben Okafor: Say who is invited.')
    expect(ok('reply', SECOND, 'Added the class name under the button.')).toBe(
      `Replied to comment ${SECOND}.\n`,
    )
    expect(stored(SECOND).messages.at(-1)).toMatchObject({
      author: { contributor: ADA.id, agent: true },
      body: 'Added the class name under the button.',
    })
    expect(ok('show', SECOND)).toContain(
      "Ada's agent (Agent): Added the class name under the button.",
    )
    await prettierStable(SECOND)
  })

  test('[CM-49] resolves with a last reply, and the thread leaves the list', async () => {
    ok('resolve', FIRST, '--reply', 'Made it the large size.')
    const thread = stored(FIRST)
    expect(thread.status).toBe('resolved')
    expect(thread.resolvedBy).toEqual({ contributor: ADA.id, agent: true })
    expect(thread.messages.at(-1)?.body).toBe('Made it the large size.')
    expect(ok(FOLDER)).toContain('1 open comment\n')
    await prettierStable(FIRST)
  })

  test('[CM-57] someone unregistered is told to join, and nothing changes', () => {
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
