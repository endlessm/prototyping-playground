// The Manual's chapters: the Markdown files in this module's `pages/`
// folder. Each needs a `title` and a numeric `order` in its frontmatter; a
// `description` and a sidebar `section` are optional, and `module: <id>`
// shows the chapter only while that module is on. The file name is the
// chapter's address (`index` is the Manual's own). Node built-ins only: the
// `studio` command loads it through `module.ts`.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { frontmatter } from '../../../tooling/guidance/frontmatter.ts'

export interface ManualChapter {
  /** Its address, `/documentation/manual/<slug>`; `index` is the Manual's. */
  slug: string
  title: string
  description: string
  /** The sidebar heading it sits under. */
  section: string | null
  /** Where it is, relative to the folder the Manual's files are named from. */
  file: string
}

const SLUG = /^[a-z0-9][a-z0-9-]*$/
const FIELDS = 'needs frontmatter with a "title" and a numeric "order".'

/**
 * The chapters in `dir` (named `<prefix>/<file>`), in order, for the
 * modules in `enabled`; what is wrong with the others; and every Markdown
 * file in the folder, which source mode can open even while it is broken.
 */
export function manualChapters(dir: string, prefix: string, enabled: string[]) {
  const names = existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
        .map((entry) => entry.name)
        .sort()
    : []
  const listed: (ManualChapter & { order: number })[] = []
  const problems: string[] = []
  for (const name of names) {
    const file = `${prefix}/${name}`
    const slug = name.slice(0, -'.md'.length)
    const fields = frontmatter(readFileSync(path.join(dir, name), 'utf8'))
    if (!fields) {
      problems.push(`${file}: ${FIELDS}`)
      continue
    }
    const { title, order, module } = fields
    if (module !== undefined) {
      if (typeof module !== 'string' || !SLUG.test(module)) {
        problems.push(`${file}: "module" must be a module ID, such as canvas.`)
        continue
      }
      if (!enabled.includes(module)) continue
    }
    if (typeof title !== 'string' || !title) {
      problems.push(
        typeof order === 'number'
          ? `${file}: needs a "title" in its frontmatter.`
          : `${file}: ${FIELDS}`,
      )
      continue
    }
    if (typeof order !== 'number') {
      problems.push(`${file}: needs a numeric "order" in its frontmatter.`)
      continue
    }
    if (!SLUG.test(slug)) {
      problems.push(
        `${file}: its file name gives the Manual address "${slug}", which must be lowercase letters, numbers and dashes. Rename the file.`,
      )
      continue
    }
    listed.push({
      slug,
      title,
      description:
        typeof fields.description === 'string' ? fields.description : '',
      section:
        typeof fields.section === 'string' && fields.section
          ? fields.section
          : null,
      file,
      order,
    })
  }
  const chapters: ManualChapter[] = listed
    .sort((a, b) => a.order - b.order)
    .map(({ order: _order, ...chapter }) => chapter)
  return {
    chapters,
    problems,
    files: names.map((name) => `${prefix}/${name}`),
  }
}
