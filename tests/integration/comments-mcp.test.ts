// The comments MCP server as an agent drives it: the same agent text as
// `yarn comments`, the threads waiting on the agent (sent to it by a person,
// open, a person wrote last), and watch_comments handing each one over once, coming back when a
// person writes again, the way Agentation's watch mode works. Runs the
// server over stdio in a studio copy inside the checkout, so its packages
// resolve, as Ada.
import { Client } from '@modelcontextprotocol/client'
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import handler from '../../src/modules/comments/server/threads'
import { ADA, BEN, tempStudio, type TempStudio } from './setup/temp-studio'

const FOLDER = 'src/prototypes/ben/flows'
const PROTOTYPE = 'f1ws000000000001'
const HOME = 'h0me000000000001'
const FIRST = 'c0mm000000000001'
const SECOND = 'c0mm000000000002'
const DONE = 'c0mm000000000003'
const LATER = 'c0mm000000000004'
const KEPT = 'c0mm000000000005'

const VIEW = `<!-- @studio-id ${HOME} -->
<template>
  <button type="button">Invite students</button>
</template>
`

const thread = (
  id: string,
  createdAt: string,
  body: string,
  status: 'open' | 'resolved' = 'open',
  sent = true,
) =>
  `${JSON.stringify(
    {
      formatVersion: 1,
      id,
      artifact: HOME,
      artifactTitle: 'Home',
      anchor: { kind: 'artifact' },
      status,
      ...(sent && {
        sentToAgent: {
          by: { contributor: BEN.id },
          at: createdAt,
        },
      }),
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
let client: Client
beforeEach(async () => {
  studio = tempStudio({ inside: true })
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
  studio.write(`${FOLDER}/Home.vue`, VIEW)
  studio.write(
    `${FOLDER}/.comments/${FIRST}.json`,
    thread(FIRST, '2026-11-01T10:00:00.000Z', 'Make this bigger.'),
  )
  studio.write(
    `${FOLDER}/.comments/${SECOND}.json`,
    thread(SECOND, '2026-11-02T10:00:00.000Z', 'Say who is invited.'),
  )
  studio.write(
    `${FOLDER}/.comments/${DONE}.json`,
    thread(DONE, '2026-10-30T10:00:00.000Z', 'Old news.', 'resolved'),
  )
  // Posted without sending: for people, not the agent.
  studio.write(
    `${FOLDER}/.comments/${KEPT}.json`,
    thread(KEPT, '2026-11-02T11:00:00.000Z', 'A note for Ben.', 'open', false),
  )
  client = new Client({ name: 'comments-test', version: '1.0.0' })
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [`${studio.root}/src/modules/comments/mcp.ts`],
      cwd: studio.root,
      env: {
        PATH: process.env.PATH ?? '',
        SYSTEMROOT: process.env.SYSTEMROOT ?? '',
        GIT_CONFIG_COUNT: '2',
        GIT_CONFIG_KEY_0: 'user.name',
        GIT_CONFIG_VALUE_0: ADA.name,
        GIT_CONFIG_KEY_1: 'user.email',
        GIT_CONFIG_VALUE_1: ADA.email,
        STUDIO_GITHUB: '',
      },
    }),
  )
})
afterEach(async () => {
  await client.close()
  studio.remove()
})

async function call(name: string, args: Record<string, unknown> = {}) {
  const result = await client.callTool({ name, arguments: args })
  const [first] = result.content as { type: string; text: string }[]
  return { text: first?.text ?? '', error: Boolean(result.isError) }
}

describe('the comments MCP server', () => {
  test('[CM-72] offers the comment tools, and lists comments as the command does', async () => {
    const { tools } = await client.listTools()
    expect(tools.map(({ name }) => name).sort()).toEqual([
      'list_comments',
      'reopen_comment',
      'reply_to_comment',
      'resolve_comment',
      'show_comment',
      'watch_comments',
    ])
    const open = await call('list_comments', { scope: FOLDER })
    expect(open.text).toContain('# Prototype "Flows"')
    expect(open.text).toContain(
      `Address: /prototypes/${PROTOTYPE}/artifacts/${HOME}`,
    )
    expect(open.text).toContain('- Ben Okafor: Make this bigger.')
    expect(open.text).not.toContain('Old news.')

    const resolved = await call('list_comments', {
      scope: FOLDER,
      status: 'resolved',
    })
    expect(resolved.text).toContain('Old news.')
  })

  test('[CM-73] a comment waits on the agent until it replies, and again once a person writes', async () => {
    await call('reply_to_comment', { id: FIRST, text: 'Made it 20% bigger.' })
    const waiting = await call('list_comments', {
      scope: FOLDER,
      awaiting: true,
    })
    expect(waiting.text).toContain('Say who is invited.')
    expect(waiting.text).not.toContain('Make this bigger.')

    // Ben answers the agent: the thread waits on it again.
    const file = `${FOLDER}/.comments/${FIRST}.json`
    const stored = JSON.parse(studio.read(file))
    stored.messages.push({
      id: 'm0mm00000000000x',
      author: { contributor: BEN.id },
      body: 'Still too small.',
      createdAt: '2026-11-03T10:00:00.000Z',
    })
    studio.write(file, `${JSON.stringify(stored, null, 2)}\n`)
    expect(
      (await call('list_comments', { scope: FOLDER, awaiting: true })).text,
    ).toContain('Still too small.')
  })

  test('[CM-75] only comments a person sent wait on the agent, and sending can be undone', async () => {
    const awaiting = () =>
      call('list_comments', { scope: FOLDER, awaiting: true })
    expect((await call('list_comments', { scope: FOLDER })).text).toContain(
      'A note for Ben.',
    )
    expect((await awaiting()).text).not.toContain('A note for Ben.')

    // Ada sends it from the page.
    const page = (send: boolean) =>
      handler({
        root: studio.root,
        contributorsFolder: path.join(studio.root, 'contributors'),
        me: ADA.key,
        method: 'POST',
        body: { action: 'send', thread: KEPT, send },
      })
    expect(await page(true)).toMatchObject({
      sentToAgent: { by: { contributor: ADA.id } },
    })
    expect((await awaiting()).text).toContain('A note for Ben.')

    await page(false)
    expect(
      JSON.parse(studio.read(`${FOLDER}/.comments/${KEPT}.json`)),
    ).not.toHaveProperty('sentToAgent')
    expect((await awaiting()).text).not.toContain('A note for Ben.')
  })

  test('[CM-74] watch_comments hands over what waits at once, then waits for the next comment', async () => {
    const first = await call('watch_comments', {
      scope: FOLDER,
      batchWindowSeconds: 0,
    })
    expect(first.text).toContain('Make this bigger.')
    expect(first.text).toContain('Say who is invited.')
    expect(first.text).not.toContain('A note for Ben.')

    // Nothing new: it times out and says to call again.
    const quiet = await call('watch_comments', {
      scope: FOLDER,
      timeoutSeconds: 2,
      batchWindowSeconds: 0,
    })
    expect(quiet.text).toContain('No comments waiting on you')

    // A comment posted while it waits comes back alone.
    const watching = call('watch_comments', {
      scope: FOLDER,
      timeoutSeconds: 20,
      batchWindowSeconds: 0,
    })
    await new Promise((done) => setTimeout(done, 1500))
    studio.write(
      `${FOLDER}/.comments/${LATER}.json`,
      thread(LATER, '2026-11-04T10:00:00.000Z', 'Add a cancel link.'),
    )
    const next = await watching
    expect(next.text).toContain('Add a cancel link.')
    expect(next.text).not.toContain('Make this bigger.')
  }, 30_000)

  test('[CM-72] a refusal comes back as a tool error with its sentence', async () => {
    const unknown = await call('show_comment', { id: 'zzzz000000000000' })
    expect(unknown.error).toBe(true)
    expect(unknown.text).toMatch(/comment/i)
  })
})
