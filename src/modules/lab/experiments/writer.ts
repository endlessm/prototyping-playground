// Writes a Breakdown's unsaved changes into an experiment's file, as plain
// theme classes on each piece's tag. A theme slot's classes go to that key
// of the tag's `ui`: an object written into a tag without one, a key merged
// into an object already there, or a bound expression spread with the key
// after it, keeping what the expression gives that slot. A change to the
// piece's root slot replaces a class of its family in the tag's static
// `class`, since `class` wins over `ui` there. Each new class replaces the
// one of the same knob family and leaves prefixed classes (`hover:`, `md:`)
// alone. Pieces the file itself doesn't hold (inside a file it imports) are
// left unsaved. Pure: the caller reads the file's tags (`fileTags`).
import { babelParse, MagicString } from 'vue/compiler-sfc'
import {
  knobFamilyOf,
  type KnobFamily,
  type KnobTheme,
} from '../../../../tooling/preview/knobs.ts'
import {
  directive,
  ROOT_NODE,
  type FileTag,
  type TemplateDirective,
} from '../../../../tooling/systems/breakdown.ts'

/** One class to write: what Save sends for each unsaved change. */
export interface SourceChange {
  /** The piece's node ID; a theme slot's ID names its piece. */
  node: string
  /** The `ui` key it goes to, or `class` for the tag's own class. */
  slot: string
  family: KnobFamily
  /** The class it writes, such as `rounded-xl`. */
  className: string
}

export interface WrittenChanges {
  source: string
  written: SourceChange[]
  /** Changes to pieces the file doesn't hold, left unsaved. */
  skipped: SourceChange[]
}

const PLAIN = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/

interface Location {
  start: { offset: number }
  end: { offset: number }
}
interface StaticAttribute {
  type: 6
  name: string
  value?: { content: string; loc: Location }
  loc: Location
}
// The parts of Babel's expression tree read here.
interface Node {
  type: string
  start: number
  end: number
}
interface StringLiteral extends Node {
  type: 'StringLiteral'
  value: string
}
interface ObjectProperty extends Node {
  type: 'ObjectProperty'
  computed: boolean
  key: Node & { name?: string; value?: string }
  value: Node
}
interface ObjectExpression extends Node {
  type: 'ObjectExpression'
  properties: (ObjectProperty | (Node & { argument?: Node }))[]
}
interface ArrayExpression extends Node {
  type: 'ArrayExpression'
  elements: (Node | null)[]
}

const isString = (node: Node | null | undefined): node is StringLiteral =>
  node?.type === 'StringLiteral'

/** The classes with each change's class replacing its family's. */
function merged(classes: string, changes: SourceChange[], theme: KnobTheme) {
  let tokens = classes.split(/\s+/).filter(Boolean)
  for (const change of changes) {
    tokens = tokens.filter(
      (token) => knobFamilyOf(token, theme)?.family !== change.family,
    )
    tokens.push(change.className)
  }
  return tokens.join(' ')
}

const holdsFamily = (classes: string, family: KnobFamily, theme: KnobTheme) =>
  classes
    .split(/\s+/)
    .some((token) => knobFamilyOf(token, theme)?.family === family)

// An expression as the start of a member access or a spread.
const wrapped = (expression: string) =>
  PLAIN.test(expression.trim()) ? expression.trim() : `(${expression.trim()})`

/**
 * One `ui` key's value from scratch: its classes, after what the spread
 * objects (`sources`) give that key, so none of it is lost.
 */
function freshValue(
  sources: string[],
  slot: string,
  classes: string,
  quote: string,
) {
  const literal = `${quote}${classes}${quote}`
  return sources.length
    ? `[${[...sources.map((source) => `${source}?.${slot}`), literal].join(', ')}]`
    : literal
}

function parseExpression(content: string) {
  try {
    const parsed = babelParse(`(${content})`, { plugins: ['typescript'] })
    const statement = parsed.program.body[0] as unknown as
      { type: string; expression: Node } | undefined
    return statement?.type === 'ExpressionStatement'
      ? statement.expression
      : null
  } catch {
    return null
  }
}

function writeTag(
  code: MagicString,
  source: string,
  tag: FileTag,
  changes: SourceChange[],
  theme: KnobTheme,
) {
  const { element } = tag
  const nameEnd = element.loc.start.offset + 1 + element.tag.length
  const staticClass = element.props.find(
    (prop) => prop.type === 6 && prop.name === 'class',
  ) as StaticAttribute | undefined
  const classValue = staticClass?.value
  const forClass: SourceChange[] = []
  const forUi = new Map<string, SourceChange[]>()
  for (const change of changes) {
    if (
      change.slot === 'class' ||
      tag.slotless ||
      (change.slot === tag.rootSlot &&
        classValue &&
        holdsFamily(classValue.content, change.family, theme))
    )
      forClass.push(change)
    else forUi.set(change.slot, [...(forUi.get(change.slot) ?? []), change])
  }

  const added: string[] = []
  let addAt = nameEnd
  if (forUi.size) {
    const ui = directive(element, 'bind', 'ui')
    if (ui?.exp) writeUi(code, source, ui, forUi, theme)
    else {
      // A `v-bind` object may give the tag its `ui`: the new one comes after
      // it, spreading it, so it adds to that rather than replacing it.
      const spread = element.props
        .filter(
          (prop): prop is TemplateDirective =>
            prop.type === 7 && prop.name === 'bind' && !prop.arg,
        )
        .at(-1)
      const sources = spread?.exp ? [`${wrapped(spread.exp.content)}?.ui`] : []
      if (spread)
        addAt = Math.max(...element.props.map((p) => p.loc.end.offset))
      const entries = [...forUi].map(
        ([slot, list]) =>
          `${slot}: ${freshValue(sources, slot, merged('', list, theme), "'")}`,
      )
      added.push(
        ` :ui="{ ${[...sources.map((each) => `...${each}`), ...entries].join(', ')} }"`,
      )
    }
  }
  if (forClass.length) {
    if (classValue) {
      const { start, end } = classValue.loc
      const quoted = /["']/.test(source[start.offset]!)
      code.overwrite(
        start.offset + (quoted ? 1 : 0),
        end.offset - (quoted ? 1 : 0),
        merged(classValue.content, forClass, theme),
      )
    } else added.push(` class="${merged('', forClass, theme)}"`)
  }
  if (added.length) code.appendLeft(addAt, added.join(''))
}

/** Merges the `ui` keys into the tag's bound `ui` expression. */
function writeUi(
  code: MagicString,
  source: string,
  ui: TemplateDirective,
  forUi: Map<string, SourceChange[]>,
  theme: KnobTheme,
) {
  const exp = ui.exp!
  const base = exp.loc.start.offset
  // Babel's offsets count the opening parenthesis wrapped around it.
  const at = (offset: number) => base + offset - 1
  const text = (node: Node) => source.slice(at(node.start), at(node.end))
  // Strings inside the attribute take the quote the attribute doesn't.
  const quote = source[base - 1] === "'" ? '"' : "'"
  const expression = parseExpression(exp.content)

  if (expression?.type !== 'ObjectExpression') {
    const spread = wrapped(exp.content)
    const entries = [...forUi].map(
      ([slot, list]) =>
        `${slot}: ${freshValue([spread], slot, merged('', list, theme), quote)}`,
    )
    code.overwrite(
      base,
      exp.loc.end.offset,
      `{ ...${spread}, ${entries.join(', ')} }`,
    )
    return
  }

  const object = expression as ObjectExpression
  const rewriteString = (literal: StringLiteral, list: SourceChange[]) => {
    const own = source[at(literal.start)]!
    code.overwrite(
      at(literal.start),
      at(literal.end),
      `${own}${merged(literal.value, list, theme)}${own}`,
    )
  }
  const spreads = object.properties
    .filter((property) => property.type === 'SpreadElement')
    .map((property) => wrapped(text((property as { argument: Node }).argument)))
  const missing: string[] = []
  for (const [slot, list] of forUi) {
    const property = object.properties
      .filter(
        (each): each is ObjectProperty =>
          each.type === 'ObjectProperty' &&
          !(each as ObjectProperty).computed &&
          ((each as ObjectProperty).key.name === slot ||
            (each as ObjectProperty).key.value === slot),
      )
      .at(-1)
    if (!property) {
      missing.push(
        `${slot}: ${freshValue(spreads, slot, merged('', list, theme), quote)}`,
      )
      continue
    }
    const value = property.value
    const last =
      value.type === 'ArrayExpression'
        ? (value as ArrayExpression).elements.at(-1)
        : null
    if (isString(value)) rewriteString(value, list)
    else if (isString(last)) rewriteString(last, list)
    else if (value.type === 'ArrayExpression')
      code.appendLeft(
        at(value.end) - 1,
        `${(value as ArrayExpression).elements.length ? ', ' : ''}${quote}${merged('', list, theme)}${quote}`,
      )
    else
      code.overwrite(
        at(value.start),
        at(value.end),
        `[${text(value)}, ${quote}${merged('', list, theme)}${quote}]`,
      )
  }
  if (!missing.length) return

  const last = object.properties.at(-1)
  if (!last) {
    code.overwrite(
      at(object.start),
      at(object.end),
      `{ ${missing.join(', ')} }`,
    )
    return
  }
  const between = source.slice(at(last.end), at(object.end) - 1)
  const comma = between.indexOf(',')
  const trailing = comma >= 0 && !between.slice(0, comma).trim()
  if (text(object).includes('\n')) {
    const lineStart = source.lastIndexOf('\n', at(last.start)) + 1
    const indent = /^\s*/.exec(source.slice(lineStart, at(last.start)))![0]
    if (trailing)
      code.appendLeft(
        at(last.end) + comma + 1,
        missing.map((entry) => `\n${indent}${entry},`).join(''),
      )
    else
      code.appendLeft(
        at(last.end),
        missing.map((entry) => `,\n${indent}${entry}`).join(''),
      )
  } else if (trailing)
    code.appendLeft(
      at(last.end) + comma + 1,
      missing.map((entry) => ` ${entry},`).join(''),
    )
  else
    code.appendLeft(at(last.end), missing.map((entry) => `, ${entry}`).join(''))
}

/**
 * The file's source with each change written into its piece's tag, the
 * changes written and those whose piece the file doesn't hold.
 */
export function writeBreakdownChanges(
  source: string,
  changes: SourceChange[],
  options: { tags: FileTag[]; theme: KnobTheme },
): WrittenChanges {
  const tags = new Map(
    options.tags.map((tag) => [`${ROOT_NODE}>${tag.local}`, tag]),
  )
  const byTag = new Map<FileTag, SourceChange[]>()
  const written: SourceChange[] = []
  const skipped: SourceChange[] = []
  for (const change of changes) {
    const tag = tags.get(change.node.split('#')[0]!)
    if (!tag || (change.slot !== 'class' && tag.kind !== 'nuxt-ui')) {
      skipped.push(change)
      continue
    }
    byTag.set(tag, [...(byTag.get(tag) ?? []), change])
    written.push(change)
  }
  const code = new MagicString(source)
  for (const [tag, list] of byTag)
    writeTag(code, source, tag, list, options.theme)
  return { source: code.toString(), written, skipped }
}
