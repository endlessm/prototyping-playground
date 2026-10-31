import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'
import { useBrowser } from './setup/browser'
import { startDevServer, type RunningStudio } from './setup/studio'

const newPage = useBrowser()
test('[SH-124] [SH-126] [SH-127] real grants persist, restart identity and enforce permission boundaries', async () => {
  fs.mkdirSync('.e2e', { recursive: true })
  const root = fs.mkdtempSync(path.resolve('.e2e/people-persistence-'))
  const people = path.join(root, 'contributors')
  fs.cpSync('tests/fixtures/contributors', people, { recursive: true })
  const file = path.join(root, 'studio.config.json')
  const initial = JSON.parse(fs.readFileSync('studio.config.json', 'utf8'))
  initial.admins = ['ada0000000000001']
  initial.systemMaintainers = { '8x5spen6xtvp96a9': ['ada0000000000001'] }
  fs.writeFileSync(file, JSON.stringify(initial, null, 2))
  let server: RunningStudio | undefined
  const start = (person: 'ada' | 'ben') =>
    startDevServer({
      STUDIO_CONFIG: file,
      STUDIO_CONTRIBUTORS: people,
      STUDIO_GITHUB: '',
      GIT_CONFIG_COUNT: '2',
      GIT_CONFIG_KEY_0: 'user.email',
      GIT_CONFIG_VALUE_0: `${person}@endless.example`,
      GIT_CONFIG_KEY_1: 'user.name',
      GIT_CONFIG_VALUE_1: person === 'ada' ? 'Ada Lovelace' : 'Ben Okafor',
    })
  try {
    server = await start('ada')
    const page = await newPage()
    const settings = async () => {
      const response = await page.request.get(`${server!.url}_studio/settings`)
      expect(response.headers()['content-type']).toContain('application/json')
      expect(response.status()).toBe(200)
      return response.json()
    }
    const post = (revision: string, changes: object) =>
      page.request.post(`${server!.url}_studio/settings`, {
        data: { revision, changes },
      })
    const before = await settings()
    expect(before.role).toBe('admin')
    expect((await post(before.revision, { admins: [] })).status()).toBe(400)
    await page.goto(`${server.url}contributors`)
    const ben = page.getByRole('region', { name: 'Ben Okafor' })
    await expect.poll(() => ben.isVisible(), { timeout: 60000 }).toBe(true)
    fs.mkdirSync('.scratch', { recursive: true })
    await page.screenshot({
      path: '.scratch/29-real-contributors.png',
      fullPage: true,
    })
    await ben.getByRole('checkbox', { name: /maintainer/ }).check()
    await ben.getByRole('checkbox', { name: 'Admin', exact: true }).check()
    await page
      .getByRole('button', { name: 'Save changes', exact: true })
      .click()
    await expect
      .poll(() => JSON.parse(fs.readFileSync(file, 'utf8')).admins)
      .toEqual(['ada0000000000001', 'ben0000000000002'])
    const granted = JSON.parse(fs.readFileSync(file, 'utf8'))
    expect(granted).toEqual({
      ...initial,
      admins: ['ada0000000000001', 'ben0000000000002'],
      systemMaintainers: {
        '8x5spen6xtvp96a9': ['ada0000000000001', 'ben0000000000002'],
      },
    })
    await server.stop()
    server = await start('ben')
    expect((await settings()).role).toBe('admin')
    expect(
      await (await page.request.get(`${server.url}_studio/me`)).json(),
    ).toMatchObject({ key: 'ben', role: 'admin' })
    const adminDirectory = await (
      await page.request.get(`${server.url}_studio/people`)
    ).json()
    const ada = adminDirectory.people.find(
      (p: { key: string }) => p.key === 'ada',
    )
    expect(
      (
        await page.request.post(`${server.url}_studio/people`, {
          data: {
            key: 'ada',
            revision: ada.revision,
            changes: { name: 'Ada Updated' },
          },
        })
      ).status(),
    ).toBe(200)
    expect(
      JSON.parse(fs.readFileSync(path.join(people, 'ada.json'), 'utf8')),
    ).toMatchObject({ name: 'Ada Updated', studioId: 'ada0000000000001' })
    expect((await post(before.revision, { name: 'stale' })).status()).toBe(409)
    await page.goto(`${server.url}contributors`)
    await expect.poll(() => ben.isVisible(), { timeout: 60000 }).toBe(true)
    await ben.getByRole('checkbox', { name: 'Admin', exact: true }).uncheck()
    await ben.getByRole('checkbox', { name: /maintainer/ }).uncheck()
    await page
      .getByRole('button', { name: 'Save changes', exact: true })
      .click()
    await expect
      .poll(() => JSON.parse(fs.readFileSync(file, 'utf8')))
      .toEqual(initial)
    expect(JSON.parse(fs.readFileSync(file, 'utf8'))).toEqual(initial)
    await server.stop()
    server = await start('ben')
    expect((await settings()).role).toBe('contributor')
    expect(
      (await post(before.revision, { admins: ['ben0000000000002'] })).status(),
    ).toBe(403)
    const directory = await (
      await page.request.get(`${server.url}_studio/people`)
    ).json()
    const self = directory.people.find((p: { key: string }) => p.key === 'ben')
    const edit = (key: string, revision: string) =>
      page.request.post(`${server!.url}_studio/people`, {
        data: { key, revision, changes: { name: 'Benjamin' } },
      })
    expect((await edit('ada', self.revision)).status()).toBe(403)
    expect((await edit('ben', self.revision)).status()).toBe(200)
    expect(
      JSON.parse(fs.readFileSync(path.join(people, 'ben.json'), 'utf8')),
    ).toMatchObject({ name: 'Benjamin', studioId: 'ben0000000000002' })
    expect(JSON.parse(fs.readFileSync(file, 'utf8'))).toEqual(initial)
  } finally {
    await server?.stop()
  }
}, 600000)
