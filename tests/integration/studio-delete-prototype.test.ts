// `yarn studio delete-prototype <folder>`: agents delete a prototype only
// after showing what would break or be lost (links from other prototypes,
// canvas and document references, files Git doesn't have), then apply it
// with --yes. The owner or an Admin only; --as runs it as your profile.
import { spawn, spawnSync } from 'node:child_process'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { ADA, BEN, tempStudio, type TempStudio } from './setup/temp-studio'

const DEMO = 'dem0000000000001'
const HOME = 'vw00000000000001'
const SHARED = 'dem0000000000002'
const FOLDER = 'src/prototypes/ben/demo'

let studio: TempStudio
beforeEach(() => {
  studio = tempStudio()
  studio.withModule('prototypes')
  studio.withModule('document')
  studio.withModule('canvas')
  const meta = (title: string, id: string, owner: string) =>
    `${JSON.stringify({ formatVersion: 1, title, studioId: id, ownerContributorId: owner, systemId: null }, null, 2)}\n`
  studio.write(`${FOLDER}/meta.json`, meta('Demo', DEMO, BEN.id))
  studio.write(
    `${FOLDER}/Home.vue`,
    `<!-- @studio-id ${HOME} -->\n<template><h1>Home</h1></template>\n`,
  )
  studio.write(
    'src/prototypes/ada/shared/meta.json',
    meta('Shared', SHARED, ADA.id),
  )
  studio.write(
    'src/prototypes/ada/shared/Board.vue',
    `<!-- @studio-id vw00000000000002 -->\n<template><a href="/prototypes/${DEMO}">Demo</a></template>\n`,
  )
  studio.write(
    'src/prototypes/ada/shared/Guide.md',
    `---\nstudioId: dc00000000000001\n---\n\n[Home](/prototypes/${DEMO}/artifacts/${HOME}) and [the file](../../ben/demo/Home.vue).\n`,
  )
  studio.write(
    'src/prototypes/ada/shared/Board.excalidraw',
    JSON.stringify({
      type: 'excalidraw',
      studioId: 'cv00000000000001',
      elements: [{ link: `/prototypes/${DEMO}/artifacts/${HOME}` }],
    }),
  )
  studio.identify(BEN)
})
afterEach(() => {
  studio.remove()
})

const remove = (...args: string[]) =>
  studio.studio('delete-prototype', FOLDER, ...args)

describe('yarn studio delete-prototype', () => {
  test('[PR-45] [CL-50] previews what would break or be lost, and changes nothing', () => {
    const result = remove()
    expect(result.status).toBe(0)
    expect(result.stdout).toBe(
      [
        `Delete prototype ${FOLDER} (“Demo”). This permanently removes the folder.`,
        'Incoming links from other prototypes that would break:',
        `  src/prototypes/ada/shared/Board.vue: /prototypes/${DEMO}`,
        'Canvas and document references that would break:',
        `  src/prototypes/ada/shared/Board.excalidraw: /prototypes/${DEMO}/artifacts/${HOME}`,
        `  src/prototypes/ada/shared/Guide.md: ../../ben/demo/Home.vue, /prototypes/${DEMO}/artifacts/${HOME}`,
        'This studio is not a Git repository, so every file in the folder would be lost.',
        'Nothing was changed. To apply it, run the same command with --yes.',
        '',
      ].join('\n'),
    )
    expect(studio.exists(`${FOLDER}/meta.json`)).toBe(true)
  })

  test('[PR-45] [CL-50] --json gives the preview as data', () => {
    const result = remove('--json')
    expect(result.status).toBe(0)
    const plan = JSON.parse(result.stdout)
    expect(plan).toMatchObject({
      folder: FOLDER,
      title: 'Demo',
      prototypeId: DEMO,
      owner: 'ben',
      incoming: [
        {
          path: 'src/prototypes/ada/shared/Board.vue',
          kind: 'link',
          references: [`/prototypes/${DEMO}`],
        },
      ],
      git: false,
    })
    expect(plan.breaking.map(({ kind }: { kind: string }) => kind)).toEqual([
      'canvas',
      'document',
    ])
  })

  test('[PR-45] [CL-50] lists untracked and uncommitted files from Git', () => {
    const git = (...args: string[]) =>
      spawnSync(
        'git',
        [
          '-c',
          'user.name=Ada',
          '-c',
          'user.email=ada@endless.example',
          ...args,
        ],
        { cwd: studio.root, encoding: 'utf8' },
      )
    git('init', '-q')
    git('add', '-A')
    git('commit', '-q', '-m', 'start')
    studio.write(
      `${FOLDER}/Home.vue`,
      `<!-- @studio-id ${HOME} -->\n<template><h1>Changed</h1></template>\n`,
    )
    studio.write(`${FOLDER}/Draft.vue`, '<template>Draft</template>\n')
    const result = remove()
    expect(result.stdout).toContain(
      [
        'Untracked files that would be lost (not in Git):',
        `  ${FOLDER}/Draft.vue`,
        'Uncommitted changes that would be lost:',
        `  ${FOLDER}/Home.vue`,
      ].join('\n'),
    )
    expect(JSON.parse(remove('--json').stdout)).toMatchObject({
      git: true,
      untracked: [`${FOLDER}/Draft.vue`],
      modified: [`${FOLDER}/Home.vue`],
    })
  })

  test('[PR-45] [CL-50] --yes deletes it and says which files still link to it', () => {
    const result = remove('--yes')
    expect(result.status).toBe(0)
    expect(result.stdout).toBe(
      [
        `Deleted ${FOLDER}.`,
        '3 files in other prototypes still link to it; update them.',
        'A running studio updates by itself.',
        '',
      ].join('\n'),
    )
    expect(studio.exists(FOLDER)).toBe(false)
    expect(studio.exists('src/prototypes/ben')).toBe(true)
    expect(studio.exists('src/prototypes/ada/shared/meta.json')).toBe(true)
  })

  test('[PR-45] [CL-04] only the owner or an Admin; --as runs as your own profile', () => {
    studio.write(
      'src/prototypes/ben/other/meta.json',
      `${JSON.stringify({ title: 'Other', studioId: 'dem0000000000003', ownerContributorId: BEN.id, systemId: null })}\n`,
    )
    // Ada is an Admin; Ben owns nothing of Ada's.
    const theirs = studio.studio(
      'delete-prototype',
      'src/prototypes/ada/shared',
      '--yes',
    )
    expect(theirs.status).toBe(1)
    expect(theirs.stderr).toContain(
      'This prototype belongs to someone else. You can change only your own.',
    )
    expect(studio.exists('src/prototypes/ada/shared/meta.json')).toBe(true)

    studio.identify({ name: BEN.name, email: 'ben@new-laptop.example' })
    const unknown = remove('--yes')
    expect(unknown.status).toBe(1)
    expect(unknown.stderr).toContain(
      'Your Git identity (ben@new-laptop.example) doesn',
    )
    expect(remove('--yes', '--as', 'ben').status).toBe(0)
    expect(studio.exists(FOLDER)).toBe(false)

    studio.identify(ADA)
    expect(
      studio.studio('delete-prototype', 'src/prototypes/ben/other', '--yes')
        .status,
    ).toBe(0)
  })

  test('[PR-45] refuses anything but a prototype folder', () => {
    for (const folder of [
      'src/prototypes/ben',
      'src/prototypes/ben/nowhere',
      'tooling',
    ]) {
      const result = studio.studio('delete-prototype', folder)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain(
        'Give an existing src/prototypes/<contributor>/<prototype> folder',
      )
    }
    expect(studio.studio('delete-prototype').stderr).toContain(
      'Usage: yarn studio delete-prototype src/prototypes/<contributor>/<prototype> [--yes] [--json] [--as <key>]',
    )
  })

  test.runIf(process.platform === 'win32')(
    '[PR-45] [CL-50] a folder another program holds is reported, and nothing is deleted',
    async () => {
      // A program working inside the folder holds it on Windows.
      const holder = spawn(
        process.execPath,
        ['-e', 'setTimeout(() => {}, 20000)'],
        {
          cwd: path.join(studio.root, FOLDER),
          stdio: 'ignore',
        },
      )
      try {
        await new Promise((resolve) => holder.once('spawn', resolve))
        const result = remove('--yes')
        expect(result.status).toBe(1)
        expect(result.stderr).toContain(
          `Another program is using ${FOLDER}. Close it, then run the command again. Nothing was deleted.`,
        )
        expect(studio.exists(`${FOLDER}/Home.vue`)).toBe(true)
      } finally {
        holder.kill()
      }
    },
    30_000,
  )
})
