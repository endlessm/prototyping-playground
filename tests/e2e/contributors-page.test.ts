import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { Page } from 'playwright'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { useBrowser } from './setup/browser'
import { startDevServer, type RunningStudio } from './setup/studio'

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-roles-'))
const config = path.join(work, 'studio.config.json')
const people = path.join(work, 'contributors')
fs.cpSync('tests/fixtures/contributors', people, { recursive: true })
const initial = JSON.parse(fs.readFileSync('studio.config.json', 'utf8'))
initial.admins = ['ada0000000000001']
initial.systemMaintainers = { archived: ['ada0000000000001'] }
fs.writeFileSync(config, JSON.stringify(initial))
const newPage = useBrowser()
let studio: RunningStudio
// Ticket 28 owns this service. Exercise the page against its published wire
// contract without duplicating configure validation in the Contributors tests.
async function permissionsContract(page: Page, role: string | null = 'admin') {
  let submitted: unknown
  await page.route('**/_studio/settings', async (route) => {
    if (route.request().method() === 'POST') {
      submitted = route.request().postDataJSON()
      await route.fulfill({ json: { saved: true, instance: 'test' } })
    } else
      await route.fulfill({
        json: {
          revision: 'revision',
          role,
          config: initial,
          systems: [
            { key: 'Active', studioId: 'active0000000001', status: 'active' },
            { key: 'Archived', studioId: 'archived', status: 'archived' },
          ],
        },
      })
  })
  return () => submitted
}
beforeAll(async () => {
  studio = await startDevServer({
    STUDIO_CONFIG: config,
    STUDIO_CONTRIBUTORS: people,
    GIT_CONFIG_COUNT: '2',
    GIT_CONFIG_KEY_0: 'user.name',
    GIT_CONFIG_VALUE_0: 'Ada Lovelace',
    GIT_CONFIG_KEY_1: 'user.email',
    GIT_CONFIG_VALUE_1: 'ada@endless.example',
    STUDIO_GITHUB: '',
  })
})
afterAll(async () => {
  await studio?.stop()
  fs.rmSync(work, { recursive: true, force: true })
})

test('[SH-123] [SH-124] [SH-125] [SH-126] [SH-127] list, access levels, grants, discard and save', async () => {
  const page = await newPage()
  const submitted = await permissionsContract(page)
  await page.goto(`${studio.url}contributors`)
  const ada = page.getByRole('region', { name: 'Ada Lovelace' })
  const ben = page.getByRole('region', { name: 'Ben Okafor' })
  await expect.poll(() => ada.isVisible(), { timeout: 60_000 }).toBe(true)
  expect(await ada.getByText('You', { exact: true }).isVisible()).toBe(true)
  expect(
    await ada
      .getByRole('checkbox', { name: 'Admin', exact: true })
      .isDisabled(),
  ).toBe(true)
  fs.mkdirSync('.scratch', { recursive: true })
  await page.screenshot({
    path: '.scratch/29-contributors.png',
    fullPage: true,
  })
  await ben.getByRole('checkbox', { name: 'Active maintainer' }).check()
  await ada.getByRole('link', { name: 'Ada Lovelace' }).click()
  await expect.poll(() => page.getByRole('dialog').isVisible()).toBe(true)
  await page.getByRole('button', { name: 'Keep editing' }).click()
  expect(
    await ben.getByRole('checkbox', { name: 'Active maintainer' }).isChecked(),
  ).toBe(true)
  expect(
    await ben.getByRole('checkbox', { name: 'Archived maintainer' }).count(),
  ).toBe(0)
  expect(
    await page
      .getByText(
        'Repository access is managed separately through your Git provider.',
      )
      .isVisible(),
  ).toBe(true)
  await ben.getByRole('checkbox', { name: 'Admin', exact: true }).check()
  await page.getByRole('button', { name: 'Discard', exact: true }).click()
  expect(
    await ben.getByRole('checkbox', { name: 'Admin', exact: true }).isChecked(),
  ).toBe(false)
  await ben.getByRole('checkbox', { name: 'Admin', exact: true }).check()
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect
    .poll(() => page.getByText('Permissions saved', { exact: true }).count())
    .toBeGreaterThan(0)
  expect(submitted()).toMatchObject({
    revision: 'revision',
    changes: {
      admins: ['ada0000000000001', 'ben0000000000002'],
      systemMaintainers: { archived: ['ada0000000000001'] },
    },
  })
})
test('[SH-127] edit a profile without changing its permanent identity', async () => {
  const page = await newPage()
  await permissionsContract(page)
  await page.goto(`${studio.url}contributors`)
  const ben = page.getByRole('region', { name: 'Ben Okafor' })
  await expect.poll(() => ben.isVisible(), { timeout: 60_000 }).toBe(true)
  await ben.getByRole('button', { name: 'Edit profile' }).click()
  const dialog = page.getByRole('dialog')
  await dialog
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('Benjamin')
  await dialog.getByRole('button', { name: 'Save changes' }).click()
  await expect
    .poll(() =>
      page.getByRole('link', { name: 'Benjamin', exact: true }).isVisible(),
    )
    .toBe(true)
  expect(
    JSON.parse(fs.readFileSync(path.join(people, 'ben.json'), 'utf8')).studioId,
  ).toBe('ben0000000000002')
})

test('[SH-127] conflicting profile and permission saves keep the draft and offer reload', async () => {
  const page = await newPage()
  await permissionsContract(page)
  await page.goto(`${studio.url}contributors`)
  const ada = page.getByRole('region', { name: 'Ada Lovelace' })
  await expect.poll(() => ada.isVisible(), { timeout: 60_000 }).toBe(true)
  await ada.getByRole('button', { name: 'Edit profile' }).click()
  const file = path.join(people, 'ada.json')
  const original = fs.readFileSync(file, 'utf8')
  fs.writeFileSync(file, original + ' ')
  await page
    .getByRole('dialog')
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('Do not overwrite')
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Save changes' })
    .click()
  await expect
    .poll(() => page.getByText(/The profile changed on disk/).isVisible())
    .toBe(true)
  expect(fs.readFileSync(file, 'utf8')).toBe(original + ' ')
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Close', exact: true })
    .click()
  const ben = page.getByRole('region', { name: 'Benjamin' })
  await ben.getByRole('checkbox', { name: 'Admin', exact: true }).check()
  await page.route('**/_studio/settings', (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({
          status: 409,
          json: { error: 'Settings changed elsewhere.' },
        })
      : route.fallback(),
  )
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect
    .poll(() =>
      page.getByRole('button', { name: 'Reload permissions' }).isVisible(),
    )
    .toBe(true)
  expect(
    await ben.getByRole('checkbox', { name: 'Admin', exact: true }).isChecked(),
  ).toBe(true)
})

test('[SH-126] non-Admins can inspect permissions with an explanation', async () => {
  const page = await newPage()
  await permissionsContract(page, 'contributor')
  await page.goto(`${studio.url}contributors`)
  await expect
    .poll(
      () =>
        page
          .getByText('You can view permissions. An Admin can change them.')
          .isVisible(),
      { timeout: 60_000 },
    )
    .toBe(true)
  expect(
    await page
      .getByRole('button', { name: 'Save changes', exact: true })
      .count(),
  ).toBe(0)
  for (const checkbox of await page.getByRole('checkbox').all())
    expect(await checkbox.isDisabled()).toBe(true)
})

test('[SH-126] unregistered readers are told how to register', async () => {
  const page = await newPage()
  await permissionsContract(page, null)
  await page.route('**/_studio/people', (route) =>
    route.fulfill({
      json: {
        role: null,
        people: [
          {
            key: 'ada',
            studioId: 'ada0000000000001',
            name: 'Ada Lovelace',
            github: 'ada-l',
            you: false,
          },
        ],
      },
    }),
  )
  await page.goto(`${studio.url}contributors`)
  await expect
    .poll(
      () =>
        page
          .getByText('Ask your agent to register you with yarn studio join.')
          .isVisible(),
      { timeout: 60_000 },
    )
    .toBe(true)
  expect(await page.getByRole('button', { name: 'Edit profile' }).count()).toBe(
    0,
  )
})

test('[SH-124] the real profile endpoint refuses cross-origin access and role fields', async () => {
  const page = await newPage()
  const forbidden = await page.request.get(`${studio.url}_studio/people`, {
    headers: { 'Sec-Fetch-Site': 'cross-site' },
  })
  expect(forbidden.status()).toBe(403)
  const directory = await (
    await page.request.get(`${studio.url}_studio/people`)
  ).json()
  const person = directory.people.find(
    (entry: { key: string }) => entry.key === 'ada',
  )
  const rejected = await page.request.post(`${studio.url}_studio/people`, {
    data: { key: 'ada', revision: person.revision, changes: { admin: true } },
  })
  expect(rejected.status()).toBe(400)
  expect(await rejected.text()).toContain('Invalid profile field')
})
