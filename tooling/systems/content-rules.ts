// What can be made, renamed, moved and deleted in a system's Context and
// Skills, which have a fixed shape: Context holds Markdown documents in
// folders; Skills holds skill folders in the Agent Skills format
// (https://agentskills.io/specification), each a folder with a SKILL.md
// whose frontmatter names it as its folder and describes it. The file
// service checks every change with these, and the navigation uses them to
// offer only what fits. Paths are inside the section, like
// `review/SKILL.md` in skills. No imports, so the browser and Node share it.

export type ContentSection = 'context' | 'skills'

/** What "New" can make in a folder of a section. */
export type NewKind = 'document' | 'folder' | 'skill' | 'file'

export const SKILL_FILE = 'SKILL.md'
export const SKILL_NAME_MAX = 64
export const SKILL_DESCRIPTION_MAX = 1024

const depth = (path: string) => (path ? path.split('/').length : 0)
const base = (path: string) => path.split('/').at(-1) ?? ''

/** What can be made in `folder` ('' is the top of the section). */
export function creatableIn(
  section: ContentSection,
  folder: string,
): NewKind[] {
  if (section === 'context') return ['document', 'folder']
  return folder === '' ? ['skill'] : ['file', 'folder']
}

/** A skill's SKILL.md, which can't be renamed, moved or deleted alone. */
export const isSkillFile = (section: ContentSection, path: string) =>
  section === 'skills' && depth(path) === 2 && base(path) === SKILL_FILE

/** A skill's own folder: a direct child of skills/. */
export const isSkillFolder = (
  section: ContentSection,
  path: string,
  dir: boolean,
) => section === 'skills' && dir && depth(path) === 1

const NAME = /^[\p{Ll}\p{Nd}]+(-[\p{Ll}\p{Nd}]+)*$/u

/** Why a skill's name (its folder's name) is invalid, or null. */
export function skillNameProblem(name: unknown): string | null {
  if (typeof name !== 'string' || !name) return 'is missing.'
  if (name.length > SKILL_NAME_MAX)
    return `is too long: names are at most ${SKILL_NAME_MAX} characters.`
  if (!NAME.test(name))
    return 'can use only lowercase letters, numbers and single hyphens, and can’t start or end with a hyphen.'
  return null
}

/** Why a skill's description is invalid, or null. */
export function skillDescriptionProblem(description: unknown): string | null {
  if (typeof description !== 'string' || !description.trim())
    return 'is missing: say what the skill does and when to use it.'
  if (description.length > SKILL_DESCRIPTION_MAX)
    return `is too long: descriptions are at most ${SKILL_DESCRIPTION_MAX} characters.`
  return null
}

/**
 * A new skill's SKILL.md: the frontmatter the format needs and a start for
 * the body. A description YAML could misread goes in a folded block.
 */
export function skillTemplate(name: string, description: string) {
  const plain =
    /^[A-Za-z0-9][^:#"'\\\n]*$/.test(description) && !/\s$/.test(description)
  const line = plain
    ? `description: ${description}`
    : `description: >\n  ${description.replace(/\s+/g, ' ').trim()}`
  return `---\nname: ${name}\n${line}\n---\n\nSay what to do, step by step, and when it applies.\n`
}

/** A change to a file or folder in a section, as the file service gets it. */
export type ContentChange =
  | { op: 'create'; path: string; name: string; kind: NewKind }
  | { op: 'rename'; path: string; name: string; dir: boolean }
  | { op: 'move'; path: string; to: string; dir: boolean }
  | { op: 'delete'; path: string; dir: boolean }

const DOCUMENTS_ONLY = 'Context documents are Markdown files, and end in .md.'

/**
 * Why a change isn't allowed in a section, as a sentence that says what to
 * do instead, or null if it is. For `create`, `path` is the folder it's made
 * in.
 */
export function contentProblem(
  section: ContentSection,
  change: ContentChange,
): string | null {
  const { path } = change
  if (change.op === 'create') {
    if (!creatableIn(section, path).includes(change.kind))
      return section === 'skills' && path === ''
        ? 'A skill is made with New skill. It has to be a folder with a SKILL.md.'
        : 'That can’t be made here.'
    if (change.kind === 'document' && !change.name.endsWith('.md'))
      return DOCUMENTS_ONLY
    return null
  }
  if (isSkillFile(section, path))
    return change.op === 'rename'
      ? `${SKILL_FILE} has to keep its name: it’s how agents find the skill.`
      : change.op === 'move'
        ? `${SKILL_FILE} has to stay in its skill’s folder.`
        : `A skill needs its ${SKILL_FILE}. To remove the skill, delete its folder.`
  if (change.op === 'rename') {
    if (isSkillFolder(section, path, change.dir)) {
      const problem = skillNameProblem(change.name)
      return problem ? `A skill’s name ${problem}` : null
    }
    if (section === 'context' && !change.dir && !change.name.endsWith('.md'))
      return DOCUMENTS_ONLY
    return null
  }
  if (change.op === 'move') {
    if (isSkillFolder(section, path, change.dir))
      return 'A skill’s folder stays in skills/. Rename it, or delete it.'
    if (section === 'skills' && change.to === '')
      return 'Files in skills/ live inside a skill’s folder.'
  }
  return null
}
