import type { DialConfig } from 'dialkit/vanilla'
import { NUMBER_LITERAL as NUMBER } from '../../../../tooling/systems/literals'
import type {
  ControlValue,
  PlaygroundControl,
  PlaygroundValues,
} from './playground'

// The Playground's prop controls as a DialKit panel: one dial per control
// the panel can change, keyed by the prop's name, showing its value (the
// changed value, else its start). DialKit only shows values; the address
// stays where they live, so a dial's change goes through the same
// `changeValue` as before, and the panel follows the address back.
// A select DialKit can't leave empty gets the **Default** entry (the prop
// left out), or **Choose** while a required one has no value. A number is a
// text dial, as DialKit's only number dial is a slider and props declare no
// range.

/** Stands for "no value" in a select: Default, or Choose. */
export const UNSET = '\u0000unset'

export interface DialWords {
  /** The select entry that leaves an optional prop out. */
  default: string
  /** The select entry shown while a required prop has no value. */
  choose: string
}

/** Whether DialKit has a dial for this control. */
export const dialable = (control: PlaygroundControl) => control.kind !== 'code'

/** What a control shows: its changed value, or its start. */
export function shownValue(
  control: PlaygroundControl,
  values: PlaygroundValues,
): ControlValue | undefined {
  const value = values[control.name]
  if (value === undefined) return control.start
  // An empty value is the prop left out: Default, or an empty field.
  return value === '' && control.kind !== 'text' ? undefined : value
}

/** The dial's value for a control's shown value. */
export function dialValue(
  control: PlaygroundControl,
  value: ControlValue | undefined,
): string | boolean {
  switch (control.kind) {
    case 'switch':
      return Boolean(value)
    case 'select':
      return typeof value === 'string' ? value : UNSET
    case 'number':
      return value === undefined ? '' : String(value)
    default:
      return typeof value === 'string' ? value : ''
  }
}

/** The DialKit config for the controls, at their shown values. */
export function propsConfig(
  controls: PlaygroundControl[],
  values: PlaygroundValues,
  words: DialWords,
): DialConfig {
  const config: DialConfig = {}
  for (const control of controls) {
    if (!dialable(control)) continue
    const value = dialValue(control, shownValue(control, values))
    if (control.kind === 'select') {
      const empty =
        control.unset || value === UNSET
          ? [
              {
                value: UNSET,
                label: control.unset ? words.default : words.choose,
              },
            ]
          : []
      config[control.name] = {
        type: 'select',
        options: [
          ...empty,
          ...control.options.map((option) => ({
            value: option,
            label: option,
          })),
        ],
        default: value as string,
      }
    } else if (control.kind === 'switch') config[control.name] = value
    else config[control.name] = { type: 'text', default: value as string }
  }
  return config
}

/**
 * What a dial's value means for its control: the value to change it to,
 * undefined to leave the prop out, or `invalid` while a number being typed
 * doesn't read as one yet (nothing changes, and the dial keeps the text).
 */
export function fromDial(
  control: PlaygroundControl,
  value: unknown,
): ControlValue | undefined | 'invalid' {
  switch (control.kind) {
    case 'switch':
      return Boolean(value)
    case 'select':
      return value === UNSET ? undefined : String(value)
    case 'number': {
      const text = String(value ?? '').trim()
      if (text === '') return undefined
      return NUMBER.test(text) ? Number(text) : 'invalid'
    }
    default: {
      const text = String(value ?? '')
      return text === '' ? undefined : text
    }
  }
}

/** Whether the dial already shows what the control's value means. */
export function dialShows(
  control: PlaygroundControl,
  dial: unknown,
  value: ControlValue | undefined,
) {
  const read = fromDial(control, dial)
  // Text being typed that doesn't read yet stays as typed.
  if (read === 'invalid') return true
  if (control.kind === 'text') return (read ?? '') === (value ?? '')
  return read === value
}

/** A signature of the panel's dials, so a new set rebuilds it. */
export const dialsSignature = (controls: PlaygroundControl[]) =>
  JSON.stringify(
    controls
      .filter(dialable)
      .map((control) => [
        control.name,
        control.kind,
        control.kind === 'select' ? [control.options, control.unset] : null,
      ]),
  )
