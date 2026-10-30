// A design system's component documentation, worked out from its files. A
// component is whatever files share a name, in a folder of its own or flat:
//
//   button/button.vue            the component (its props table)
//   button/button.examples.vue   live examples: each <Example name="…"> is one
//   button/button.md             frontmatter (title, description, source,
//                                docs) and a "When to use" section
//
// Any one of them makes a page; the others add to it. Plain functions over
// paths and text with Node built-ins only, so the catalog, the build's checks
// and the `component-docs` command share them.

export interface SystemComponent {
  /** As its files spell it ("Button", "button"). */
  name: string
  /** Its page under the system's Components ("icon-button"). */
  slug: string
  /** Inside the system's `components/` folder; null when absent. */
  files: {
    source: string | null
    examples: string | null
    doc: string | null
  }
}

type Kind = keyof SystemComponent['files']

/** "IconButton" → "icon-button". */
export const kebab = (name: string) =>
  name
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .replace(/[^A-Za-z\d]+/g, '-')
    .toLowerCase()

const baseName = (file: string) => file.slice(file.lastIndexOf('/') + 1)

/** The name a component file goes by: `button/button.vue` → `button`. */
export const stemOf = (file: string) =>
  baseName(file).replace(/(\.examples)?\.(vue|md)$/, '')

// Which kind of file this is, and the name it goes by. Helpers (index files,
// tests, stories, anything starting with "_" or ".") and a README are not
// components.
function classify(file: string): { kind: Kind; name: string } | null {
  const base = baseName(file)
  if (/^[._]/.test(base) || /^readme\.md$/i.test(base)) return null
  let match = /^(.+)\.examples\.vue$/.exec(base)
  if (match) return { kind: 'examples', name: match[1]! }
  if (/\.(test|spec|stories)\.vue$/.test(base)) return null
  match = /^(.+)\.md$/.exec(base)
  if (match) return { kind: 'doc', name: match[1]! }
  match = /^(.+)\.vue$/.exec(base)
  if (match) return { kind: 'source', name: match[1]! }
  return null
}

/**
 * The components in a list of paths inside a system's `components/` folder.
 * Files match by folder and name, ignoring case, so `button.md` belongs to
 * `Button.vue` beside it but not to another folder's button.
 */
export function discoverComponents(files: string[]): SystemComponent[] {
  const found = new Map<string, SystemComponent>()
  for (const file of [...files].sort()) {
    const classified = classify(file)
    if (!classified) continue
    const folder = file.slice(0, file.length - baseName(file).length)
    const key = `${folder}${classified.name}`.toLowerCase()
    let component = found.get(key)
    if (!component) {
      component = {
        name: classified.name,
        slug: kebab(classified.name),
        files: { source: null, examples: null, doc: null },
      }
      found.set(key, component)
    }
    component.files[classified.kind] ??= file
    // The component file names it best (Button over button).
    if (classified.kind === 'source') {
      component.name = classified.name
      component.slug = kebab(classified.name)
    }
  }
  return [...found.values()].sort((a, b) =>
    a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }),
  )
}

/** Each `<Example name="…">` of an examples file, in file order. */
export function exampleNames(source: string) {
  const text = source.replace(/<!--[\s\S]*?-->/g, '')
  return [...text.matchAll(/<Example\b[^>]*?\sname\s*=\s*(["'])(.*?)\1/g)].map(
    (match) => match[2]!,
  )
}

/** "WithIcon" → "With icon". */
export const exampleTitle = (name: string) =>
  name
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/^./, (first) => first.toUpperCase())
    .replace(
      / ([A-Z])(?![A-Z])/g,
      (_, letter: string) => ` ${letter.toLowerCase()}`,
    )

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/

/** A frontmatter field's text, read line by line (no YAML parser here). */
export function frontmatterField(source: string, field: string) {
  const block = FRONTMATTER.exec(source)?.[1] ?? ''
  for (const line of block.split(/\r?\n/)) {
    const match = /^([A-Za-z]+):\s*(.*)$/.exec(line)
    if (match?.[1] !== field) continue
    const value = match[2]!.trim().replace(/^(["'])(.*)\1$/, '$2')
    return value || null
  }
  return null
}

// The text without code blocks and HTML comments, so a heading inside an
// example doesn't count.
const prose = (body: string) =>
  body
    .replace(FRONTMATTER, '')
    .replace(/^(```|~~~)[\s\S]*?^\1/gm, '')
    .replace(/<!--[\s\S]*?-->/g, '')

/**
 * What a component's page is missing, as sentences that start with the file
 * at fault (or follow the component's own file). `doc` and `examples` are
 * the files' text, null when absent.
 */
export function componentProblems(
  component: SystemComponent,
  text: { doc: string | null; examples: string | null },
) {
  const { files } = component
  const stem = files.source ? stemOf(files.source) : component.name
  if (!files.doc && !files.examples)
    return [
      `has no examples or page yet. Add ${stem}.examples.vue and ${stem}.md`,
    ]
  const problems: string[] = []
  if (!files.doc)
    problems.push(
      `has no ${stem}.md yet (a title, a description, and a "When to use" section)`,
    )
  else if (text.doc !== null) {
    const file = baseName(files.doc)
    for (const field of ['title', 'description'])
      if (!frontmatterField(text.doc, field))
        problems.push(`${file} needs a "${field}" in its frontmatter`)
    if (!/^#{2,3}[ \t]+when to use[ \t]*$/im.test(prose(text.doc)))
      problems.push(`${file} needs a "When to use" section (a ## heading)`)
  }
  if (!files.examples)
    problems.push(`has no ${stem}.examples.vue yet (at least one example)`)
  else if (text.examples !== null && !exampleNames(text.examples).length)
    problems.push(
      `${baseName(files.examples)} has no examples: wrap each one in <Example name="…">`,
    )
  return problems
}

/** Two components with the same page address. */
export function duplicateProblems(components: SystemComponent[]) {
  const seen = new Map<string, SystemComponent>()
  const problems: { component: SystemComponent; problem: string }[] = []
  for (const component of components) {
    const first = seen.get(component.slug)
    const file = (entry: SystemComponent) =>
      entry.files.source ?? entry.files.doc ?? entry.files.examples
    if (first)
      problems.push({
        component,
        problem: `has the same name as ${file(first)}, so they'd share a page. Rename one`,
      })
    else seen.set(component.slug, component)
  }
  return problems
}

export interface DocsProblem {
  /** Repository-relative. */
  file: string
  message: string
}

const SHOWN = 5

/** One warning for a system's documentation gaps, the first five listed. */
export function docsWarning(label: string, problems: DocsProblem[]) {
  if (!problems.length) return null
  const count = problems.length
  const lines = problems
    .slice(0, SHOWN)
    .map(({ file, message }) => `  - ${file} ${message}`)
  if (count > SHOWN) lines.push(`  - and ${count - SHOWN} more`)
  return `${label} has ${count} component documentation ${count === 1 ? 'gap' : 'gaps'}:\n${lines.join('\n')}`
}
