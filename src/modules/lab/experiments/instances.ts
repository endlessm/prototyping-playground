// The instances of a Lab component inside an experiment's own file, for the
// dial panel's Props folders: each tag that is the component (`UAlert` in
// an Alert experiment, as `isComponentTag` reads a tag's name), with the
// attributes written on it. A static attribute, or a binding to a literal
// (`:size="2"`), is a value the panel starts from and Save may replace; a
// binding to anything else (`:title="heading"`, `v-model:open`) is code,
// which the panel shows read-only and Save leaves alone. Pure: the caller
// reads the file's tags (`fileTags`).
import { NodeTypes } from '@vue/compiler-core'
import { isComponentTag } from '../../../../tooling/systems/example-seeds.ts'
import {
  literalValue,
  type LiteralValue,
} from '../../../../tooling/systems/literals.ts'
import {
  ROOT_NODE,
  type FileTag,
} from '../../../../tooling/systems/breakdown.ts'

/** How a prop is written on an instance's tag. */
export type InstanceAttribute = { value: LiteralValue } | { code: string }

export interface ComponentInstance {
  /** The tag's node ID in the experiment's Breakdown. */
  node: string
  /** As its tag spells it (`UAlert`). */
  name: string
  /** By prop name, camel-cased. */
  attributes: Record<string, InstanceAttribute>
}

// What styles, identifies or wires the element rather than configures it.
export const IGNORED_PROPS = new Set([
  'class',
  'style',
  'key',
  'ref',
  'is',
  'ui',
  '__proto__',
])

export const camel = (name: string) =>
  name.replace(/-([a-z\d])/g, (_, letter: string) => letter.toUpperCase())

/**
 * The prop a tag's attribute or directive sets, and how: undefined for
 * anything that isn't a prop (an event, `v-if`, a dynamic name, `class`).
 */
export function attributeOf(
  prop: FileTag['element']['props'][number],
): { name: string; attribute: InstanceAttribute } | undefined {
  if (prop.type === NodeTypes.ATTRIBUTE) {
    const name = camel(prop.name)
    if (IGNORED_PROPS.has(name)) return undefined
    return { name, attribute: { value: prop.value?.content ?? true } }
  }
  const arg = prop.arg
  if (prop.name === 'model' && !arg)
    return { name: 'modelValue', attribute: { code: prop.exp?.content ?? '' } }
  if (!arg || !['bind', 'model'].includes(prop.name)) return undefined
  // A dynamic argument (`:[name]`) names no prop the file spells out.
  if (prop.rawName && /[[\]]/.test(prop.rawName)) return undefined
  const name = camel(arg.content)
  if (IGNORED_PROPS.has(name) || /[.[\]]/.test(arg.content)) return undefined
  const code = prop.exp?.content.trim() ?? ''
  const literal = prop.name === 'bind' ? literalValue(code) : undefined
  return {
    name,
    attribute: literal === undefined ? { code } : { value: literal },
  }
}

/** The tags of a file that are the component under `slug`, as written. */
export function componentInstances(
  tags: FileTag[],
  slug: string,
): ComponentInstance[] {
  return tags
    .filter((tag) => tag.kind !== 'icon' && isComponentTag(tag.name, slug))
    .map((tag) => {
      const attributes: Record<string, InstanceAttribute> = {}
      for (const prop of tag.element.props) {
        const found = attributeOf(prop)
        if (found && !(found.name in attributes))
          attributes[found.name] = found.attribute
      }
      return { node: `${ROOT_NODE}>${tag.local}`, name: tag.name, attributes }
    })
}
