// A disposable copy of the studio's command line and content, so each test can
// run `studio` commands for real and inspect the files they leave behind.
// Its contributors are the fixtures in tests/fixtures/contributors: Ada, the
// only Admin, and Ben. Commands run as Ada unless a test says otherwise.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const COPIED = [
  'tooling',
  'studio.config.json',
  'package.json',
  'app/pages',
  'AGENTS.md',
]

export const ADA = {
  key: 'ada',
  id: 'ada0000000000001',
  name: 'Ada Lovelace',
  email: 'ada@endless.example',
  github: 'ada-l',
}
export const BEN = {
  key: 'ben',
  id: 'ben0000000000002',
  name: 'Ben Okafor',
  email: 'ben@endless.example',
  github: 'benok',
}

/** Who runs the commands: Git's name and email, and the GitHub account. */
export interface Identity {
  name?: string
  email?: string
  github?: string
}

export interface Result {
  status: number | null
  stdout: string
  stderr: string
  output: string
}

export interface TempStudio {
  root: string
  studio: (...args: string[]) => Result
  /** Runs any Node script in the copy, as the current identity. */
  node: (script: string, ...args: string[]) => Result
  /** Who later commands run as; nobody (no Git name, email or GitHub) by default. */
  identify: (identity: Identity) => void
  /** Extra environment for later commands. */
  env: Record<string, string>
  read: (file: string) => string
  json: <T = Record<string, unknown>>(file: string) => T
  write: (file: string, text: string) => void
  exists: (file: string) => boolean
  config: () => { modules: Record<string, boolean> } & Record<string, unknown>
  setConfig: (changes: Record<string, unknown>) => void
  addModule: (id: string, source?: string) => void
  remove: () => void
}

export function tempStudio(): TempStudio {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-cli-'))
  for (const entry of COPIED)
    fs.cpSync(path.resolve(entry), path.join(root, entry), { recursive: true })
  fs.cpSync(
    path.resolve('tests/fixtures/contributors'),
    path.join(root, 'contributors'),
    { recursive: true },
  )
  fs.mkdirSync(path.join(root, 'src/modules'), { recursive: true })
  fs.mkdirSync(path.join(root, 'src/prototypes'), { recursive: true })
  // Only the declarations and guidance entries: commands read a system's
  // permanent id there and point agents to its AGENTS.md.
  for (const system of fs.readdirSync('src/systems'))
    for (const name of ['system.ts', 'AGENTS.md']) {
      const file = `src/systems/${system}/${name}`
      if (fs.existsSync(file)) fs.cpSync(file, path.join(root, file))
    }
  const file = (name: string) => path.join(root, name)
  let identity: Identity = { ...ADA }
  const run = (args: string[]): Result => {
    // Git's own configuration from the environment outranks every file, so
    // the person's real identity never leaks in.
    const git = {
      GIT_CONFIG_COUNT: '2',
      GIT_CONFIG_KEY_0: 'user.name',
      GIT_CONFIG_VALUE_0: identity.name ?? '',
      GIT_CONFIG_KEY_1: 'user.email',
      GIT_CONFIG_VALUE_1: identity.email ?? '',
    }
    const result = spawnSync(process.execPath, args, {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...Object.fromEntries(
          Object.entries(process.env).filter(
            ([key]) =>
              !key.startsWith('VITEST') &&
              !key.startsWith('STUDIO_') &&
              !key.startsWith('GIT_'),
          ),
        ),
        ...git,
        STUDIO_GITHUB: identity.github ?? '',
        ...studio.env,
      },
    })
    return {
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      output: result.stdout + result.stderr,
    }
  }
  const studio: TempStudio = {
    root,
    studio: (...args) => run([file('tooling/studio/cli.ts'), ...args]),
    node: (script, ...args) => run([file(script), ...args]),
    identify: (next) => {
      identity = next
    },
    env: {},
    read: (name) => fs.readFileSync(file(name), 'utf8'),
    json: (name) => JSON.parse(studio.read(name)),
    write: (name, text) => {
      fs.mkdirSync(path.dirname(file(name)), { recursive: true })
      fs.writeFileSync(file(name), text)
    },
    exists: (name) => fs.existsSync(file(name)),
    config: () => JSON.parse(studio.read('studio.config.json')),
    setConfig: (changes) =>
      studio.write(
        'studio.config.json',
        `${JSON.stringify({ ...studio.config(), ...changes }, null, 2)}\n`,
      ),
    // Copies the sample module from the fixtures under another id.
    addModule: (id, source = 'tests/fixtures/modules/sample') => {
      fs.cpSync(path.resolve(source), file(`src/modules/${id}`), {
        recursive: true,
      })
      const declaration = file(`src/modules/${id}/module.ts`)
      fs.writeFileSync(
        declaration,
        fs
          .readFileSync(declaration, 'utf8')
          .replaceAll("'sample'", `'${id}'`)
          .replaceAll('/sample', `/${id}`),
      )
    },
    remove: () => fs.rmSync(root, { recursive: true, force: true }),
  }
  studio.setConfig({ admins: [ADA.id], systemMaintainers: {} })
  return studio
}
