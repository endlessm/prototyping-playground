import type { LocationQuery } from 'vue-router'
import type { PreviewProps } from '../../../../tooling/preview/protocol'
import {
  literalValue,
  NUMBER_LITERAL as NUMBER,
  STRING_LITERAL as STRING,
} from '../../../../tooling/systems/literals'
import type { PropDoc } from '../../../../tooling/systems/props'

export { literalValue }

// Playground's controls, derived from the props metadata alone, so
// documenting a component is all its playground needs. Each control starts
// seeded so the component never opens empty: the value its Default example
// writes, then its declared default, then a sample for text that shows.
// Values a designer changes live in the address, one query parameter per
// changed prop; an empty one (`?color=`) leaves a seeded prop out.

export type ControlValue = string | number | boolean
/** The values changed from their start, by prop name. */
export type PlaygroundValues = Record<string, ControlValue>

interface ControlBase {
  name: string
  type: string
  required: boolean
  description: string
  /** Its start comes from an example or a sample, so the stage gets it. */
  seeded: boolean
}

export type PlaygroundControl = ControlBase &
  (
    | {
        kind: 'select'
        options: string[]
        start: string | undefined
        /** Optional without a default: it offers Default, leaving it unset. */
        unset: boolean
      }
    | { kind: 'switch'; start: boolean | undefined }
    | { kind: 'text'; start: string | undefined }
    | { kind: 'number'; start: number | undefined }
    | { kind: 'code'; start?: undefined }
  )

// Long enough for any label, short enough for an address.
const MAX_TEXT = 2000
// Props whose text shows in the component, so an empty one looks broken.
const CONTENT = new Set([
  'label',
  'title',
  'description',
  'placeholder',
  'text',
])

// `"a" | "b"`, as the metadata tooling prints a union of string literals.
function literalUnion(type: string) {
  const parts = type.split(' | ').map((part) => part.trim())
  if (!parts.every((part) => STRING.test(part))) return undefined
  return parts.map((part) => JSON.parse(part) as string)
}

function fits(control: PlaygroundControl, value: unknown) {
  switch (control.kind) {
    case 'select':
      return typeof value === 'string' && control.options.includes(value)
    case 'switch':
      return typeof value === 'boolean'
    case 'text':
      return typeof value === 'string' && value.length <= MAX_TEXT
    case 'number':
      return typeof value === 'number' && Number.isFinite(value)
    default:
      return false
  }
}

// A sample from the prop's name, such as "Label" or "Model value". It is a
// value given to the component, as an example's copy is, not studio
// interface text, so it isn't translated.
function sampleText(name: string) {
  const words = name.replace(/([a-z\d])([A-Z])/g, '$1 $2').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/**
 * The control for one prop, with its starting value: the prop's `seed` from
 * the Default example when it fits, otherwise its literal default, and for
 * text that shows (a label, a title, any required text) still without one, a
 * sample from its name. A declared default comes before the sample, so the
 * author's own copy wins over a made-up one.
 */
export function controlFor(
  prop: PropDoc,
  seed?: ControlValue,
): PlaygroundControl {
  const base: ControlBase = {
    name: prop.name,
    type: prop.type,
    required: prop.required,
    description: prop.description,
    seeded: false,
  }
  const parsed = literalValue(prop.default)
  const options = literalUnion(prop.type)
  let control: PlaygroundControl
  if (options) {
    control = {
      ...base,
      kind: 'select',
      options,
      start: undefined,
      unset: !prop.required && parsed === undefined,
    }
  } else if (prop.type === 'boolean') {
    // Vue reads a boolean prop left out as false.
    control = { ...base, kind: 'switch', start: false }
  } else if (prop.type === 'string') {
    control = {
      ...base,
      kind: 'text',
      start: prop.required ? '' : undefined,
    }
  } else if (prop.type === 'number') {
    control = { ...base, kind: 'number', start: undefined }
  } else {
    return { ...base, kind: 'code' }
  }
  if (seed !== undefined && fits(control, seed)) {
    control.start = seed as never
    control.seeded = true
  } else {
    if (fits(control, parsed)) control.start = parsed as never
    if (
      control.kind === 'text' &&
      !control.start &&
      (prop.required || CONTENT.has(prop.name))
    ) {
      control.start = sampleText(prop.name)
      control.seeded = true
    }
  }
  return control
}

// Whether the prop may be left out for the component's own default.
function omittable(control: PlaygroundControl) {
  if (control.kind === 'select') return control.unset
  return (
    (control.kind === 'text' || control.kind === 'number') && !control.required
  )
}

// What a control's text in the address means, or undefined when it can't.
// An empty parameter is a seeded prop left out.
function fromQuery(control: PlaygroundControl, text: string) {
  switch (control.kind) {
    case 'switch':
      return text === 'true' ? true : text === 'false' ? false : undefined
    case 'number':
      if (text === '') return text
      return NUMBER.test(text) ? Number(text) : undefined
    default:
      return text
  }
}

function isChange(control: PlaygroundControl, value: unknown) {
  // An empty value leaves the prop out, which only changes a seeded one: any
  // other start is the component's own default. A required text keeps it.
  if (value === '' && (control.kind !== 'text' || !control.required))
    return omittable(control) && control.seeded
  return fits(control, value) && value !== control.start
}

/** The changed values an address holds; what doesn't fit is dropped. */
export function readValues(
  controls: PlaygroundControl[],
  query: LocationQuery | Record<string, string>,
): PlaygroundValues {
  const values: PlaygroundValues = {}
  for (const control of controls) {
    const text = query[control.name]
    if (typeof text !== 'string') continue
    const value = fromQuery(control, text)
    if (isChange(control, value)) values[control.name] = value as ControlValue
  }
  return values
}

/** The address's query for these values: one parameter per change. */
export function writeQuery(
  controls: PlaygroundControl[],
  values: PlaygroundValues,
) {
  const query: Record<string, string> = {}
  for (const control of controls) {
    const value = values[control.name]
    if (value !== undefined && isChange(control, value))
      query[control.name] = String(value)
  }
  return query
}

/**
 * The values after one control changes; its start drops it. Undefined, a
 * control emptied or set to Default, leaves the prop out: kept as an empty
 * value when the prop starts with one, so it doesn't spring back.
 */
export function changeValue(
  controls: PlaygroundControl[],
  values: PlaygroundValues,
  name: string,
  value: ControlValue | undefined,
): PlaygroundValues {
  const control = controls.find((entry) => entry.name === name)
  if (!control || (value !== undefined && !fits(control, value))) return values
  const next = Object.fromEntries(
    Object.entries(values).filter(([key]) => key !== name),
  )
  const chosen =
    value === undefined && (control.kind === 'text' || omittable(control))
      ? ''
      : value
  if (isChange(control, chosen)) next[name] = chosen!
  return next
}

/**
 * The props the stage renders with: the changed values, and the start of
 * seeded and required props. Everything else is left out, so it takes the
 * component's default, as a prop emptied or set to Default does.
 */
export function stageProps(
  controls: PlaygroundControl[],
  values: PlaygroundValues,
): PreviewProps {
  const props: PreviewProps = {}
  for (const control of controls) {
    const value = values[control.name]
    if (value !== undefined) {
      if (value !== '' || !omittable(control)) props[control.name] = value
    } else if (
      (control.seeded || control.required) &&
      control.start !== undefined
    )
      props[control.name] = control.start
  }
  return props
}

/** The first required prop with no value to start the component with. */
export function blockingProp(
  controls: PlaygroundControl[],
  values: PlaygroundValues = {},
) {
  return controls.find(
    (control) =>
      control.required &&
      control.start === undefined &&
      values[control.name] === undefined,
  )
}
