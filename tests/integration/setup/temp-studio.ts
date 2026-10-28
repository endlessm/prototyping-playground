// A disposable copy of the studio's command line and content, so each test can
// run `studio` commands for real and inspect the files they leave behind.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const COPIED = [
  'tooling',
  'studio.config.json',
  'package.json',
  'contributors',
  'app/pages',
]

export interface TempStudio {
  root: string
  studio: (...args: string[]) => {
    status: number | null
    stdout: string
    stderr: string
    output: string
  }
  read: (file: string) => string
  write: (file: string, text: string) => void
  exists: (file: string) => boolean
  config: () => { modules: Record<string, boolean> } & Record<string, unknown>
  addModule: (id: string, source?: string) => void
  remove: () => void
}

export function tempStudio(): TempStudio {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-cli-'))
  for (const entry of COPIED)
    fs.cpSync(path.resolve(entry), path.join(root, entry), { recursive: true })
  fs.mkdirSync(path.join(root, 'src/modules'), { recursive: true })
  // Only the declarations: commands read a system's permanent id there.
  for (const system of fs.readdirSync('src/systems')) {
    const declaration = `src/systems/${system}/system.ts`
    if (fs.existsSync(declaration))
      fs.cpSync(declaration, path.join(root, declaration))
  }
  const file = (name: string) => path.join(root, name)
  const studio: TempStudio = {
    root,
    studio: (...args) => {
      const result = spawnSync(
        process.execPath,
        [file('tooling/studio/cli.ts'), ...args],
        {
          cwd: root,
          encoding: 'utf8',
          env: Object.fromEntries(
            Object.entries(process.env).filter(
              ([key]) =>
                !key.startsWith('VITEST') && !key.startsWith('STUDIO_'),
            ),
          ),
        },
      )
      return {
        status: result.status,
        stdout: result.stdout,
        stderr: result.stderr,
        output: result.stdout + result.stderr,
      }
    },
    read: (name) => fs.readFileSync(file(name), 'utf8'),
    write: (name, text) => {
      fs.mkdirSync(path.dirname(file(name)), { recursive: true })
      fs.writeFileSync(file(name), text)
    },
    exists: (name) => fs.existsSync(file(name)),
    config: () => JSON.parse(studio.read('studio.config.json')),
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
  return studio
}
