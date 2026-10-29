// The parity fixture studios: the same prototypes written for each studio.
// The new studio's views are `.vue` files; the React studio's are `.tsx`
// views that render the new side's `.vue` file from a `_vue/` folder, which
// the harness copies in (see `writeReactPrototypes`).
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'

export type Side = 'vue' | 'react'

export const PARITY_FIXTURES: Record<Side, string> = {
  vue: path.resolve('tests/fixtures/parity/vue'),
  react: path.resolve('tests/fixtures/parity/react'),
}

const VIEW_EXTENSION: Record<Side, string> = { vue: '.vue', react: '.tsx' }
// `<!-- @studio-id x -->` in a `.vue` file, `/** @studio-id x */` in `.tsx`.
const IDENTITY = /^\s*(?:<!--|\/\*\*)\s*@studio-id\s+(\S+)/
// Documents are the same `.md` files on both sides, with `studioId` in their
// frontmatter.
const DOCUMENT = '.md'
const DOCUMENT_IDENTITY = /^---\r?\n(?:[^\r\n]*\r?\n)*?studioId:[ \t]*(\S+)/

export interface FixturePrototype {
  /** `<contributor>/<prototype folder>` */
  folder: string
  meta: Record<string, unknown>
  /** Views and documents by path inside the prototype, without the extension. */
  artifacts: { path: string; id: string | null }[]
}

const hidden = (name: string) => name.startsWith('_') || name.startsWith('.')

function files(dir: string, prefix = ''): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter(({ name }) => !hidden(name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) =>
      entry.isDirectory()
        ? files(path.join(dir, entry.name), `${prefix}${entry.name}/`)
        : [`${prefix}${entry.name}`],
    )
}

function folders(dir: string) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !hidden(entry.name))
    .map(({ name }) => name)
    .sort()
}

/** What a person sees of a fixture studio's prototypes, comparable across sides. */
export function describeFixtureStudio(
  root: string,
  side: Side,
): FixturePrototype[] {
  return folders(root).flatMap((contributor) =>
    folders(path.join(root, contributor)).map((name) => {
      const dir = path.join(root, contributor, name)
      return {
        folder: `${contributor}/${name}`,
        meta: JSON.parse(readFileSync(path.join(dir, 'meta.json'), 'utf8')),
        artifacts: files(dir).flatMap((file) => {
          const extension = [VIEW_EXTENSION[side], DOCUMENT].find((end) =>
            file.endsWith(end),
          )
          if (!extension) return []
          const source = readFileSync(path.join(dir, file), 'utf8')
          const identity = extension === DOCUMENT ? DOCUMENT_IDENTITY : IDENTITY
          return [
            {
              path: file.slice(0, -extension.length),
              id: identity.exec(source)?.[1] ?? null,
            },
          ]
        }),
      }
    }),
  )
}

/**
 * Replaces a React studio's prototypes with the React fixtures, and gives
 * each prototype the new side's `.vue` views in `_vue/`, without their
 * identity comments (the React views carry them).
 */
export function writeReactPrototypes(
  prototypesDir: string,
  fixtures = PARITY_FIXTURES,
) {
  rmSync(prototypesDir, { recursive: true, force: true })
  mkdirSync(prototypesDir, { recursive: true })
  cpSync(fixtures.react, prototypesDir, { recursive: true })
  for (const { folder } of describeFixtureStudio(fixtures.react, 'react')) {
    const source = path.join(fixtures.vue, folder)
    if (!existsSync(source)) continue
    for (const file of files(source).filter((f) => f.endsWith('.vue'))) {
      const target = path.join(prototypesDir, folder, '_vue', file)
      mkdirSync(path.dirname(target), { recursive: true })
      const text = readFileSync(path.join(source, file), 'utf8')
      writeFileSync(
        target,
        text.replace(/^\s*<!--\s*@studio-id[^>]*-->\r?\n/, ''),
      )
    }
  }
}
