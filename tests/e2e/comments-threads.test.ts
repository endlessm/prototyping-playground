// A thread's whole life in the browser, and who may do what: commenting on
// a colleague's prototype, authors with their names, pictures and agent
// badge, editing and deleting your own messages, deleting a thread (yours,
// not Ben's: Ada is no Admin in the checkout's configuration), Resolved by
// and Reopen, Copy link, and an archived prototype read-only with the
// service's reason. Rules are the service's: one test asks the dev server
// to edit Ben's message and gets its refusal. The studio runs as Ada on a
// disposable copy of tests/fixtures/comments inside the checkout.
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import type { Locator, Page } from 'playwright'
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { useBrowser } from './setup/browser'
import { startDevServer, type RunningStudio } from './setup/studio'

mkdirSync('.e2e', { recursive: true })
const content = mkdtempSync(path.join('.e2e', 'comment-threads-'))
cpSync('tests/fixtures/comments', content, { recursive: true })
const env = {
  STUDIO_PROTOTYPES: content.split(path.sep).join('/'),
  STUDIO_CONTRIBUTORS: 'tests/fixtures/contributors',
  GIT_CONFIG_COUNT: '2',
  GIT_CONFIG_KEY_0: 'user.name',
  GIT_CONFIG_VALUE_0: 'Ada Lovelace',
  GIT_CONFIG_KEY_1: 'user.email',
  GIT_CONFIG_VALUE_1: 'ada@endless.example',
  STUDIO_GITHUB: '',
}

const ADA = 'ada0000000000001'
const BEN = 'ben0000000000002'
const PROTOTYPES = {
  // Ben's prototype, with a view.
  notes: {
    id: 'b3nf000000000c01',
    view: 'b3nh000000000c01',
    folder: path.join(content, 'ben', 'notes'),
    text: 'Ben’s notes',
  },
  // Ada's archived prototype.
  shelved: {
    id: 'a4cv000000000c01',
    view: 'a4cb000000000c01',
    folder: path.join(content, 'ada', 'shelved'),
    text: 'An old idea',
  },
  // Ada's prototype whose system was deleted: its view waits for a rebuild,
  // so the page offers no surface.
  orphan: {
    id: 'a0rf000000000c01',
    view: 'a0rv000000000c01',
    folder: path.join(content, 'ada', 'orphan'),
    text: 'Waiting for a system',
  },
}
type Prototype = (typeof PROTOTYPES)[keyof typeof PROTOTYPES]
const threadsOf = (prototype: Prototype) =>
  path.join(prototype.folder, '.comments')

const address = (studio: RunningStudio, prototype: Prototype) =>
  `${studio.url}prototypes/${prototype.id}/artifacts/${prototype.view}`
const view = (page: Page) =>
  page.locator('iframe[data-preview-frame]').contentFrame()
const toolbar = (page: Page) =>
  page.getByRole('toolbar', { name: 'Comment tools' })
const commentButton = (page: Page) =>
  toolbar(page).getByRole('button', { name: 'Comment', exact: true })
const allComments = (page: Page) =>
  toolbar(page).getByRole('button', { name: /^All comments/ })
const list = (page: Page) =>
  page.getByRole('complementary', { name: 'Comments' })
const thread = (page: Page, number: number) =>
  page.getByRole('dialog', { name: `Comment ${number}` })
const pin = (page: Page, number: number) =>
  page.getByRole('button', { name: new RegExp(`^Comment ${number} by `) })
const message = (popover: Locator, text: string) =>
  popover.getByRole('listitem').filter({ hasText: text })
const toast = (page: Page, text: string) =>
  page.getByText(text, { exact: true }).filter({ visible: true })
const visible = (locator: Locator) =>
  expect.poll(() => locator.isVisible(), { timeout: 20_000 }).toBe(true)
const gone = (locator: Locator) =>
  expect.poll(() => locator.count(), { timeout: 20_000 }).toBe(0)

async function open(page: Page, studio: RunningStudio, prototype: Prototype) {
  await page.goto(address(studio, prototype))
  await expect
    .poll(
      () =>
        page
          .locator('[data-preview-session]')
          .getAttribute('data-preview-state'),
      { timeout: 120_000 },
    )
    .toBe('ready')
  await expect
    .poll(() => view(page).getByText(prototype.text).isVisible(), {
      timeout: 60_000,
    })
    .toBe(true)
  await visible(toolbar(page))
}

type Stored = {
  id: string
  status: string
  resolvedBy?: { contributor: string }
  messages: {
    id: string
    body: string
    editedAt?: string
    author: { contributor: string; agent?: boolean }
  }[]
}
function stored(prototype: Prototype): Stored[] {
  const folder = threadsOf(prototype)
  if (!existsSync(folder)) return []
  return readdirSync(folder)
    .filter((name) => name.endsWith('.json'))
    .map((name) => JSON.parse(readFileSync(path.join(folder, name), 'utf8')))
}

const BUTTON = {
  kind: 'button',
  label: 'Button "Share notes"',
  at: { x: 0.5, y: 0.5 },
  selector: '[data-testid="share"]',
  tag: 'button',
  path: 'main > button',
  text: 'Share notes',
}
let seeded = 0
/** Writes a thread file as an earlier session, or a pull, would leave it. */
function seed(
  prototype: Prototype,
  messages: {
    by: string
    body: string
    agent?: boolean
  }[],
  { status = 'open', anchor = BUTTON as Record<string, unknown> } = {},
) {
  mkdirSync(threadsOf(prototype), { recursive: true })
  seeded++
  const id = `5eed${String(seeded).padStart(12, '0')}`
  const time = (second: number) =>
    new Date(Date.UTC(2026, 10, 3, 10, seeded, second)).toISOString()
  const thread = {
    formatVersion: 1,
    id,
    artifact: prototype.view,
    artifactTitle: 'Home',
    anchor,
    status,
    ...(status === 'resolved'
      ? { resolvedBy: { contributor: BEN }, resolvedAt: time(59) }
      : {}),
    messages: messages.map(({ by, body, agent }, index) => ({
      id: `${index}${id.slice(1)}`,
      author: agent ? { contributor: by, agent: true } : { contributor: by },
      body,
      createdAt: time(index),
    })),
  }
  writeFileSync(
    path.join(threadsOf(prototype), `${id}.json`),
    `${JSON.stringify(thread, null, 2)}\n`,
  )
  return id
}

describe('on the dev server', () => {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await startDevServer(env)
  })
  afterAll(async () => {
    await studio?.stop()
    rmSync(content, { recursive: true, force: true })
  })
  beforeEach(() => {
    for (const prototype of Object.values(PROTOTYPES))
      rmSync(threadsOf(prototype), { recursive: true, force: true })
  })

  test('[CM-54] [CM-32] Ada comments on Ben’s prototype, and each message shows its author’s name, picture and time', async () => {
    seed(PROTOTYPES.notes, [{ by: BEN, body: 'Is sharing too hidden?' }])
    const page = await newPage()
    await open(page, studio, PROTOTYPES.notes)
    await pin(page, 1).click()
    const popover = thread(page, 1)
    await visible(popover)
    const bens = message(popover, 'Is sharing too hidden?')
    await visible(bens.getByText('Ben Okafor', { exact: true }))
    // His GitHub picture, or his initials where it can't load.
    expect(
      await bens
        .locator('img[src*="github.com/benok"], :text-is("BO")')
        .count(),
    ).toBeGreaterThan(0)
    await visible(bens.getByText(/ ago$|^now$|^yesterday$/))

    await popover
      .getByRole('textbox', { name: 'Reply' })
      .fill('A little. Move it up.')
    await page.keyboard.press('Enter')
    const adas = message(popover, 'A little. Move it up.')
    await visible(adas.getByText('Ada Lovelace', { exact: true }))
    await expect
      .poll(() => stored(PROTOTYPES.notes)[0]?.messages.at(-1)?.author)
      .toEqual({ contributor: ADA })

    // A new comment of her own on his prototype.
    await popover.getByRole('button', { name: 'Close' }).click()
    await commentButton(page).click()
    // The button carries Ben's pin; the heading is free.
    await view(page).getByRole('heading', { name: 'Ben’s notes' }).click()
    const composer = page.getByRole('dialog', { name: 'New comment' })
    await visible(composer)
    await page.keyboard.type('Rename it “Send notes”.')
    await page.keyboard.press('Enter')
    await expect.poll(() => stored(PROTOTYPES.notes).length).toBe(2)
  })

  test('[CM-17] a page with no surface still lists its comments and takes whole-view ones, with Comment resting', async () => {
    seed(PROTOTYPES.orphan, [{ by: BEN, body: 'Which system next?' }], {
      anchor: { kind: 'artifact' },
    })
    const page = await newPage()
    await page.goto(address(studio, PROTOTYPES.orphan))
    await visible(page.getByText('Rebuild needed', { exact: true }))
    await visible(toolbar(page))
    expect(await commentButton(page).isDisabled()).toBe(true)
    await allComments(page).click()
    await visible(list(page).getByText('Which system next?'))
    await list(page)
      .getByRole('button', { name: 'Comment on the whole view' })
      .click()
    await page.keyboard.type('Harbor, probably.')
    await page.keyboard.press('Enter')
    await expect
      .poll(() =>
        stored(PROTOTYPES.orphan).some(
          (thread) => thread.messages[0]?.body === 'Harbor, probably.',
        ),
      )
      .toBe(true)
  })

  test('[CM-33] an agent’s message shows as “<first name>’s agent” with an Agent badge', async () => {
    seed(PROTOTYPES.notes, [
      { by: BEN, body: 'Make the button say what it shares.' },
      { by: ADA, agent: true, body: 'Renamed it to “Share notes”.' },
    ])
    const page = await newPage()
    await open(page, studio, PROTOTYPES.notes)
    await pin(page, 1).click()
    const agents = message(thread(page, 1), 'Renamed it to “Share notes”.')
    await visible(agents.getByText('Ada’s agent', { exact: true }))
    await visible(agents.getByText('Agent', { exact: true }))
    // Her agent's words are its own: Ada isn't offered Edit or Delete.
    expect(
      await agents.getByRole('button', { name: 'Message actions' }).count(),
    ).toBe(0)
  })

  test('[CM-37] Ada edits and deletes her own messages, and is offered neither on Ben’s', async () => {
    seed(PROTOTYPES.notes, [
      { by: BEN, body: 'Is sharing too hidden?' },
      { by: ADA, body: 'Yes, moev it up.' },
      { by: ADA, body: 'Oops, wrong thread.' },
    ])
    const page = await newPage()
    await open(page, studio, PROTOTYPES.notes)
    await pin(page, 1).click()
    const popover = thread(page, 1)
    await visible(popover)
    expect(
      await message(popover, 'Is sharing too hidden?')
        .getByRole('button', { name: 'Message actions' })
        .count(),
    ).toBe(0)

    await message(popover, 'Yes, moev it up.')
      .getByRole('button', { name: 'Message actions' })
      .click()
    await page.getByRole('menuitem', { name: 'Edit' }).click()
    const field = popover.getByRole('textbox', { name: 'Edit message' })
    await visible(field)
    await field.fill('Yes, move it up.')
    await page.keyboard.press('Enter')
    await visible(message(popover, 'Yes, move it up.').getByText('Edited'))
    await expect
      .poll(() => stored(PROTOTYPES.notes)[0]?.messages[1]?.body)
      .toBe('Yes, move it up.')
    expect(stored(PROTOTYPES.notes)[0]?.messages[1]?.editedAt).toEqual(
      expect.any(String),
    )

    await message(popover, 'Oops, wrong thread.')
      .getByRole('button', { name: 'Message actions' })
      .click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    await gone(message(popover, 'Oops, wrong thread.'))
    await expect
      .poll(() => stored(PROTOTYPES.notes)[0]?.messages.length)
      .toBe(2)
  })

  test('[CM-51] the service refuses what the page doesn’t offer: editing Ben’s message', async () => {
    const id = seed(PROTOTYPES.notes, [
      { by: BEN, body: 'Is sharing too hidden?' },
    ])
    const page = await newPage()
    await page.goto(studio.url)
    const answer = await page.evaluate(
      async ([url, thread, message]) => {
        const response = await fetch(url!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'edit',
            thread,
            message,
            body: 'Not his words.',
          }),
        })
        return { status: response.status, body: await response.json() }
      },
      [`${studio.url}_studio/modules/comments/threads`, id, `0${id.slice(1)}`],
    )
    expect(answer).toEqual({
      status: 403,
      body: {
        error:
          'Only its author can edit a message. Reply to add to it instead.',
      },
    })
    expect(stored(PROTOTYPES.notes)[0]?.messages[0]?.body).toBe(
      'Is sharing too hidden?',
    )
  })

  test('[CM-38] Ada deletes her own comment after confirming, and Ben’s offers no Delete', async () => {
    seed(PROTOTYPES.notes, [{ by: BEN, body: 'Ben’s comment.' }])
    const mine = seed(PROTOTYPES.notes, [{ by: ADA, body: 'Ada’s comment.' }], {
      anchor: { kind: 'artifact' },
    })
    const page = await newPage()
    await open(page, studio, PROTOTYPES.notes)

    await pin(page, 1).click()
    await thread(page, 1).getByRole('button', { name: 'More' }).click()
    await visible(page.getByRole('menuitem', { name: 'Copy link' }))
    expect(
      await page.getByRole('menuitem', { name: 'Delete comment' }).count(),
    ).toBe(0)
    await page.keyboard.press('Escape')

    await allComments(page).click()
    await list(page)
      .getByRole('listitem')
      .filter({ hasText: 'Ada’s comment.' })
      .getByRole('button')
      .click()
    const popover = thread(page, 2)
    await visible(popover)
    await popover.getByRole('button', { name: 'More' }).click()
    await page.getByRole('menuitem', { name: 'Delete comment' }).click()
    const confirm = page.getByRole('dialog', { name: 'Delete comment 2?' })
    await visible(confirm)
    await confirm.getByRole('button', { name: 'Delete comment' }).click()
    await gone(popover)
    await visible(toast(page, 'Comment deleted'))
    await expect
      .poll(() => stored(PROTOTYPES.notes).map(({ id }) => id))
      .not.toContain(mine)
    await gone(list(page).getByRole('listitem').filter({ hasText: 'Ada’s' }))
  })

  test('[CM-34] [CM-35] [CM-36] a resolved thread says who resolved it; Reopen and the toast’s Undo open it again', async () => {
    seed(PROTOTYPES.notes, [{ by: BEN, body: 'Fixed already?' }], {
      status: 'resolved',
    })
    seed(PROTOTYPES.notes, [{ by: BEN, body: 'Still open.' }])
    const page = await newPage()
    await open(page, studio, PROTOTYPES.notes)

    await allComments(page).click()
    await list(page)
      .getByRole('tab', { name: /^Resolved/ })
      .click()
    await list(page)
      .getByRole('listitem')
      .filter({ hasText: 'Fixed already?' })
      .getByRole('button')
      .click()
    const resolved = thread(page, 1)
    await visible(resolved.getByText('Resolved by Ben Okafor'))
    await resolved.getByRole('button', { name: 'Reopen' }).click()
    await gone(resolved.getByText('Resolved by Ben Okafor'))
    await expect
      .poll(() => stored(PROTOTYPES.notes).map(({ status }) => status))
      .toEqual(['open', 'open'])
    // The list follows it to the Open tab.
    await expect
      .poll(() =>
        list(page)
          .getByRole('tab', { name: /^Open/ })
          .getAttribute('aria-selected'),
      )
      .toBe('true')

    await resolved.getByRole('button', { name: 'Resolve' }).click()
    await visible(toast(page, 'Comment resolved'))
    await expect
      .poll(() => stored(PROTOTYPES.notes)[0]?.resolvedBy)
      .toEqual({ contributor: ADA })
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect.poll(() => stored(PROTOTYPES.notes)[0]?.status).toBe('open')
  })

  test('[CM-39] Copy link copies the address that opens the thread', async () => {
    const id = seed(PROTOTYPES.notes, [{ by: BEN, body: 'Link me.' }])
    const page = await newPage()
    await page
      .context()
      .grantPermissions(['clipboard-read', 'clipboard-write'], {
        origin: studio.url,
      })
    await open(page, studio, PROTOTYPES.notes)
    await pin(page, 1).click()
    await thread(page, 1).getByRole('button', { name: 'More' }).click()
    await page.getByRole('menuitem', { name: 'Copy link' }).click()
    await visible(toast(page, 'Link copied'))
    const link = await page.evaluate(() => navigator.clipboard.readText())
    expect(link).toBe(`${address(studio, PROTOTYPES.notes)}?comment=${id}`)

    const other = await newPage()
    await other.goto(link)
    await visible(thread(other, 1).getByText('Link me.'))
  })

  test('[CM-61] an archived prototype’s comments can be read, with the reason in place of every field', async () => {
    seed(PROTOTYPES.shelved, [{ by: ADA, body: 'Before we shelved it.' }], {
      anchor: {
        ...BUTTON,
        label: 'Button "Start"',
        selector: '[data-testid="start"]',
        text: 'Start',
      },
    })
    const reason =
      '“Shelved” is archived, so its comments are read-only. Restore it to comment.'
    const page = await newPage()
    await open(page, studio, PROTOTYPES.shelved)
    await gone(commentButton(page))
    await toolbar(page).getByRole('button', { name: 'Read-only' }).click()
    await visible(page.getByText(reason).first())
    await page.keyboard.press('Escape')

    await pin(page, 1).click()
    const popover = thread(page, 1)
    await visible(popover.getByText('Before we shelved it.'))
    await visible(popover.getByText(reason))
    expect(await popover.getByRole('textbox', { name: 'Reply' }).count()).toBe(
      0,
    )
    expect(await popover.getByRole('button', { name: 'Resolve' }).count()).toBe(
      0,
    )
    expect(
      await popover.getByRole('button', { name: 'Message actions' }).count(),
    ).toBe(0)

    await allComments(page).click()
    await visible(list(page).getByText(reason))
    expect(
      await list(page)
        .getByRole('button', { name: 'Comment on the whole view' })
        .count(),
    ).toBe(0)
  })
})
