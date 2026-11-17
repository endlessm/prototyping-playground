// The values a component's Playground opens with, read on Node from its
// examples file, so the component never starts empty: the literal
// attributes of the component's own tag in its `Default` example, or in its
// first example when none is named so. `label="Save"` is text, a bare
// `loading` is true, `:size="2"` is its literal; anything computed, events,
// directives, `class` and `style` are left out. Whether a value fits a prop
// is the Lab's call, as it knows the controls.
import { kebab } from './components.ts'
import { splitExamples } from './example-snippets.ts'
import { literalValue, type LiteralValue } from './literals.ts'

export type ExampleSeeds = Record<string, LiteralValue>

// An opening tag, with quoted attribute values that may hold `>`.
const OPENING_TAG = /<([A-Za-z][\w.:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g
const ATTRIBUTE =
  /([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
// What styles or identifies the element rather than configures it.
const IGNORED = new Set(['class', 'style', 'key', 'ref', 'is'])
const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
}

// Vue decodes character references in a static attribute's value.
function decode(text: string) {
  return text.replace(
    /&(?:#(\d+)|#x([\da-f]+)|(\w+));/gi,
    (whole, decimal?: string, hex?: string, name?: string) => {
      if (decimal) return String.fromCodePoint(Number(decimal))
      if (hex) return String.fromCodePoint(parseInt(hex, 16))
      return ENTITIES[name!.toLowerCase()] ?? whole
    },
  )
}

const camel = (name: string) =>
  name.replace(/-([a-z\d])/g, (_, letter: string) => letter.toUpperCase())

/**
 * Whether a tag is the component itself: its name in kebab case, maybe
 * after one word naming its library, so `UButton`, `HarborButton` and
 * `u-button` are the button, while a `UFormField` wrapping an input or a
 * `UDropdownMenu` beside a menu are not.
 */
export function isComponentTag(tag: string, slug: string) {
  const name = kebab(tag.replace(/([A-Z])(?=[A-Z][a-z])/g, '$1-'))
  if (name === slug) return true
  if (!name.endsWith(`-${slug}`)) return false
  return !name.slice(0, -slug.length - 1).includes('-')
}

/** The literal attributes of one opening tag's attribute text, by prop. */
export function literalAttributes(attributes: string): ExampleSeeds {
  const seeds: ExampleSeeds = {}
  for (const match of attributes.replace(/\/\s*$/, '').matchAll(ATTRIBUTE)) {
    const [, written, double, single, unquoted] = match
    const text = double ?? single ?? unquoted
    let name = written!
    const bound = /^(?::|v-bind:)/.test(name)
    if (bound) name = name.replace(/^(?::|v-bind:)/, '')
    else if (/^(?:v-|@|#)/.test(name)) continue
    // Modifiers (`.prop`) and dynamic names (`[name]`) aren't plain props.
    if (/[.[\]]/.test(name)) continue
    const prop = camel(name)
    if (IGNORED.has(prop) || prop in seeds) continue
    const value = bound
      ? literalValue(text ?? null)
      : text === undefined
        ? true
        : decode(text)
    if (value !== undefined) seeds[prop] = value
  }
  return seeds
}

/**
 * The Playground's seeds from an examples file, for the component under
 * `slug`. The tag is the first element in the example that is the
 * component, not simply the first: Default examples often wrap it (a
 * `UFormField` around an input, a sized `div` around a modal), and the
 * wrapper's attributes would seed the wrong props. Empty when the file
 * can't be split or the example doesn't use the component.
 */
export function exampleSeeds(source: string, slug: string): ExampleSeeds {
  const examples = splitExamples(source)
  if (!examples?.size) return {}
  const snippet = examples.get('Default') ?? examples.values().next().value!
  const markup = snippet.replace(/<!--[\s\S]*?(?:-->|$)/g, '')
  for (const [, tag, attributes] of markup.matchAll(OPENING_TAG))
    if (isComponentTag(tag!, slug)) return literalAttributes(attributes!)
  return {}
}
