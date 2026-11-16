import type { LocationQuery } from 'vue-router'
import type { PreviewProps } from '../../../../tooling/preview/protocol'
import type { PropDoc } from '../../../../tooling/systems/props'

// Playground's controls, derived from the props metadata alone, so
// documenting a component is all its playground needs. Values a designer
// changes live in the address, one query parameter per changed prop.

export type ControlValue = string | number | boolean
/** The values changed from their start, by prop name. */
export type PlaygroundValues = Record<string, ControlValue>

interface ControlBase {
  name: string
  type: string
  required: boolean
  description: string
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
const STRING = /^"((?:[^"\\]|\\.)*)"$/
const SINGLE = /^'((?:[^'\\]|\\.)*)'$/
const NUMBER = /^-?\d+(\.\d+)?$/

/** A default written as a literal, or undefined for anything computed. */
export function literalValue(text: string | null): ControlValue | undefined {
  const value = text?.trim()
  if (!value) return undefined
  if (value === 'true') return true
  if (value === 'false') return false
  if (NUMBER.test(value)) return Number(value)
  if (STRING.test(value)) return JSON.parse(value) as string
  const single = SINGLE.exec(value)
  if (single) return single[1]!.replace(/\\(.)/g, '$1')
  return undefined
}

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

/** The control for one prop, with its starting value. */
export function controlFor(prop: PropDoc): PlaygroundControl {
  const base: ControlBase = {
    name: prop.name,
    type: prop.type,
    required: prop.required,
    description: prop.description,
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
  if (fits(control, parsed)) control.start = parsed as never
  return control
}

// What a control's text in the address means, or undefined when it can't.
function fromQuery(control: PlaygroundControl, text: string) {
  switch (control.kind) {
    case 'switch':
      return text === 'true' ? true : text === 'false' ? false : undefined
    case 'number':
      return NUMBER.test(text) ? Number(text) : undefined
    default:
      return text
  }
}

function isChange(control: PlaygroundControl, value: unknown) {
  if (!fits(control, value) || value === control.start) return false
  // An emptied text field is the prop left out.
  return !(control.kind === 'text' && value === '' && !control.required)
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

/** The values after one control changes; undefined or its start drops it. */
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
  if (isChange(control, value)) next[name] = value!
  return next
}

/**
 * The props the stage renders with: the changed values, and the start of
 * required props, which have no default of their own. Everything else is
 * left out, so it takes the component's default.
 */
export function stageProps(
  controls: PlaygroundControl[],
  values: PlaygroundValues,
): PreviewProps {
  const props: PreviewProps = {}
  for (const control of controls) {
    const value = values[control.name]
    if (value !== undefined) props[control.name] = value
    else if (control.required && control.start !== undefined)
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
