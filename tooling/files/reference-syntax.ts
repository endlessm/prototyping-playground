// The source grammars reference adapters share: where code, Vue files,
// Markdown and CSS name other files. Each finds the references and asks the
// context (`./references.ts`) what they become; resolving targets is the
// context's. Uses Vue's own SFC parser and the Babel parser it carries.
import { babelParse, parse as parseSfc, walk } from 'vue/compiler-sfc'
import type { MoveReferenceContext } from './references.ts'

interface AstNode {
  type: string
  start?: number | null
  end?: number | null
  [key: string]: unknown
}
interface Edit {
  start: number
  end: number
  value: string
}

const applyEdits = (text: string, edits: Edit[]) =>
  [...edits]
    .sort((a, b) => b.start - a.start)
    .reduce(
      (result, edit) =>
        result.slice(0, edit.start) + edit.value + result.slice(edit.end),
      text,
    )

// Attributes that name something to open inside the prototype, and those
// that hold a URL relative to the file.
const OPENS = new Set(['to'])
const URLS = new Set(['href', 'src'])
// Calls whose first argument is a path to open: `navigate('Details')`,
// `usePrototypeArtifactHref()('Details')`, `useIsPrototypeArtifact('Details')`.
const OPENING_CALL = /navigate|href|isprototypeartifact/i

const nameOf = (node: AstNode | undefined): string | undefined => {
  if (!node) return undefined
  if (node.type === 'Identifier' || node.type === 'JSXIdentifier')
    return node.name as string
  if (node.type === 'StringLiteral') return node.value as string
  if (
    node.type === 'MemberExpression' ||
    node.type === 'OptionalMemberExpression'
  )
    return nameOf(node.property as AstNode)
  if (node.type === 'CallExpression') return nameOf(node.callee as AstNode)
  return undefined
}

/** What a string in code is, from where it stands. */
function roleOf(node: AstNode, parent: AstNode | null) {
  if (!parent) return 'text'
  const first = (parent.arguments as AstNode[] | undefined)?.[0] === node
  if (
    ((parent.type === 'ImportDeclaration' ||
      parent.type === 'ExportNamedDeclaration' ||
      parent.type === 'ExportAllDeclaration' ||
      parent.type === 'ImportExpression') &&
      parent.source === node) ||
    (parent.type === 'CallExpression' &&
      first &&
      ((parent.callee as AstNode).type === 'Import' ||
        nameOf(parent.callee as AstNode) === 'require')) ||
    (parent.type === 'NewExpression' &&
      first &&
      nameOf(parent.callee as AstNode) === 'URL')
  )
    return 'import'
  const key =
    parent.type === 'ObjectProperty' && parent.value === node
      ? nameOf(parent.key as AstNode)
      : parent.type === 'JSXAttribute'
        ? nameOf(parent.name as AstNode)
        : undefined
  if (key && OPENS.has(key)) return 'opens'
  if (key && URLS.has(key)) return 'url'
  if (
    parent.type === 'CallExpression' &&
    first &&
    OPENING_CALL.test(nameOf(parent.callee as AstNode) ?? '')
  )
    return 'opens'
  return 'text'
}

function codeEdits(
  code: string,
  offset: number,
  context: MoveReferenceContext,
  plugins: ('typescript' | 'jsx')[],
  attribute?: 'opens' | 'url',
): Edit[] {
  let ast: AstNode
  try {
    ast = babelParse(code, {
      sourceType: 'module',
      plugins,
    }) as unknown as AstNode
  } catch {
    // Unreadable code is left as it is.
    return []
  }
  const edits: Edit[] = []
  const body = ((ast.program as AstNode).body as AstNode[]) ?? []
  // A bound attribute whose whole value is a string: `:to="'Details'"`.
  const whole =
    attribute && body.length === 1 && body[0]!.type === 'ExpressionStatement'
      ? (body[0]!.expression as AstNode)
      : undefined
  walk(ast as unknown as Parameters<typeof walk>[0], {
    enter(raw: unknown, rawParent: unknown) {
      const node = raw as unknown as AstNode
      const parent = rawParent as unknown as AstNode | null
      const literal =
        node.type === 'StringLiteral'
          ? (node.value as string)
          : node.type === 'TemplateLiteral' &&
              !(node.expressions as unknown[]).length
            ? ((node.quasis as AstNode[])[0]!.value as { cooked: string })
                .cooked
            : undefined
      if (literal === undefined) return
      let role = roleOf(node, parent)
      if (node === whole) role = attribute!
      let next =
        role === 'import'
          ? context.relativeTarget(literal, true)
          : context.navigation(literal, role === 'opens')
      if (next === literal && role === 'url') next = context.link(literal)
      if (next === literal) return
      const start = node.start!
      const quote = code[start]!
      const value = next
        .replace(/\\/g, '\\\\')
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n')
        .replace(new RegExp(quote, 'g'), `\\${quote}`)
        .replace(/\$\{/g, quote === '`' ? '\\${' : '${')
      edits.push({
        start: offset + start + 1,
        end: offset + node.end! - 1,
        value,
      })
    },
  })
  return edits
}

const pluginsFor = (file: string, lang = ''): ('typescript' | 'jsx')[] => {
  const kind = lang || file.slice(file.lastIndexOf('.') + 1)
  return [
    ...(/^[mc]?tsx?$/.test(kind) ? (['typescript'] as const) : []),
    ...(/x$/.test(kind) ? (['jsx'] as const) : []),
  ]
}

/** Imports and paths in JavaScript or TypeScript. */
export function moveCode(
  text: string,
  file: string,
  context: MoveReferenceContext,
) {
  return applyEdits(text, codeEdits(text, 0, context, pluginsFor(file)))
}

interface TemplateNode {
  type: number
  props?: {
    type: number
    name: string
    value?: {
      content: string
      loc: { start: { offset: number }; source: string }
    }
    arg?: { content?: string }
    exp?: { content: string; loc: { start: { offset: number } } }
  }[]
  children?: TemplateNode[]
}

const ELEMENT = 1
const ATTRIBUTE = 6
const DIRECTIVE = 7

/**
 * A Vue file's references: its scripts' imports and paths, its template's
 * `to`, `href` and `src` attributes and its expressions, and its styles'
 * imports and URLs.
 */
export function moveVue(
  text: string,
  file: string,
  context: MoveReferenceContext,
) {
  const { descriptor, errors } = parseSfc(text, {
    filename: file,
    sourceMap: false,
    ignoreEmpty: false,
  })
  if (errors.length) return text
  const edits: Edit[] = []
  for (const block of [descriptor.script, descriptor.scriptSetup])
    if (block)
      edits.push(
        ...codeEdits(
          block.content,
          block.loc.start.offset,
          context,
          pluginsFor(file, block.lang ?? 'js'),
        ),
      )
  const lang = descriptor.scriptSetup?.lang ?? descriptor.script?.lang ?? ''
  const visit = (node: TemplateNode) => {
    if (node.type === ELEMENT)
      for (const prop of node.props ?? []) {
        if (prop.type === ATTRIBUTE && prop.value) {
          const kind = OPENS.has(prop.name)
            ? 'opens'
            : URLS.has(prop.name)
              ? 'url'
              : undefined
          const { source, start } = prop.value.loc
          const quote = source[0]
          if (!kind || (quote !== '"' && quote !== "'")) continue
          const value = source.slice(1, -1)
          let next = context.navigation(value, kind === 'opens')
          if (next === value && kind === 'url') next = context.link(value)
          if (next !== value)
            edits.push({
              start: start.offset + 1,
              end: start.offset + source.length - 1,
              value: next.replaceAll(quote, quote === '"' ? '&quot;' : '&#39;'),
            })
        } else if (prop.type === DIRECTIVE && prop.exp?.content.trim()) {
          const name = prop.name === 'bind' ? prop.arg?.content : undefined
          const kind =
            name && OPENS.has(name)
              ? 'opens'
              : name && URLS.has(name)
                ? 'url'
                : undefined
          const code = prop.exp.content
          // An expression parses on its own in parentheses; statements, as
          // in `@click="a = 1; go()"`, don't.
          const wrapped = codeEdits(
            `(${code})`,
            prop.exp.loc.start.offset - 1,
            context,
            pluginsFor(file, lang),
            kind,
          )
          edits.push(
            ...(wrapped.length || !/;/.test(code)
              ? wrapped
              : codeEdits(
                  code,
                  prop.exp.loc.start.offset,
                  context,
                  pluginsFor(file, lang),
                )),
          )
        }
      }
    for (const child of node.children ?? []) visit(child)
  }
  if (descriptor.template?.ast)
    visit(descriptor.template.ast as unknown as TemplateNode)
  for (const style of descriptor.styles) {
    const moved = cssReferences(style.content, context.relativeTarget)
    if (moved !== style.content)
      edits.push({
        start: style.loc.start.offset,
        end: style.loc.end.offset,
        value: moved,
      })
  }
  return applyEdits(text, edits)
}

/**
 * Markdown links, images and reference definitions; prose and code fences
 * stay as they are.
 */
export function markdownReferences(
  text: string,
  link: (value: string) => string,
) {
  const blocks = text.split(
    /(^```[^\n]*\n[\s\S]*?^```[^\n]*$|^~~~[^\n]*\n[\s\S]*?^~~~[^\n]*$)/m,
  )
  const target = (value: string) =>
    value.startsWith('<')
      ? `<${decodeURI(link(encodeURI(value.slice(1, -1))))}>`
      : link(value)
  return blocks
    .map((block, index) =>
      index % 2
        ? block
        : block
            .replace(
              /(!?\[[^\]\n]*\]\()(<[^>\n]+>|[^\s)]+)([^\n]*?\))/g,
              (_, lead: string, value: string, tail: string) =>
                lead + target(value) + tail,
            )
            .replace(
              /^(\s*\[[^\]\n]+\]:\s*)(<[^>\n]+>|\S+)/gm,
              (_, lead: string, value: string) => lead + target(value),
            ),
    )
    .join('')
}

/** CSS `@import` and `url()` references. */
export function cssReferences(
  text: string,
  relativeTarget: (value: string) => string,
) {
  return text
    .replace(
      /(url\(\s*['"]?)([^'")\s]+)(['"]?\s*\))/g,
      (_, lead: string, value: string, tail: string) =>
        lead + relativeTarget(value) + tail,
    )
    .replace(
      /(@import\s+['"])([^'"]+)(['"])/g,
      (_, lead: string, value: string, tail: string) =>
        lead + relativeTarget(value) + tail,
    )
}
