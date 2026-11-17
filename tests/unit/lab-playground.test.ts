// Playground's controls come from the props metadata alone: each prop maps
// to one control with a starting value, seeded from the Default example or a
// sample so the component never opens empty, and the values a designer
// changes travel in the address and back, dropping what no longer fits.
import { describe, expect, test } from 'vitest'
import type { PropDoc } from '../../tooling/systems/props'
import {
  blockingProp,
  changeValue,
  controlFor,
  literalValue,
  readValues,
  stageProps,
  writeQuery,
} from '../../src/modules/lab/utils/playground'

const prop = (fields: Partial<PropDoc> & { name: string; type: string }) => ({
  required: false,
  default: null,
  description: '',
  ...fields,
})

// The Endless Studios button's props, as the metadata tooling reads them.
const BUTTON_PROPS = [
  prop({ name: 'label', type: 'string', description: 'The button’s text.' }),
  prop({
    name: 'color',
    type: '"primary" | "secondary" | "neutral"',
    default: '"primary"',
  }),
  prop({ name: 'size', type: '"xs" | "sm" | "md"', default: '"md"' }),
  prop({ name: 'loading', type: 'boolean' }),
  prop({ name: 'count', type: 'number', default: '2' }),
  prop({ name: 'ui', type: '{ base?: string; }' }),
]
const BUTTON = BUTTON_PROPS.map((entry) => controlFor(entry))

describe('a prop maps to one control', () => {
  test('a union of string literals is a select of those words', () => {
    expect(BUTTON[1]).toMatchObject({
      kind: 'select',
      name: 'color',
      options: ['primary', 'secondary', 'neutral'],
      start: 'primary',
      unset: false,
    })
  })

  test('an optional union without a default offers Default, meaning unset', () => {
    expect(
      controlFor(prop({ name: 'tone', type: '"calm" | "loud"' })),
    ).toMatchObject({ kind: 'select', start: undefined, unset: true })
  })

  test('a required union without a default has no Default and no start', () => {
    expect(
      controlFor(
        prop({ name: 'tone', type: '"calm" | "loud"', required: true }),
      ),
    ).toMatchObject({ kind: 'select', start: undefined, unset: false })
  })

  test('boolean is a switch, off unless its default says otherwise', () => {
    expect(BUTTON[3]).toMatchObject({ kind: 'switch', start: false })
    expect(
      controlFor(prop({ name: 'open', type: 'boolean', default: 'true' })),
    ).toMatchObject({ kind: 'switch', start: true })
  })

  test('string is a text field, number a number field', () => {
    expect(BUTTON[0]).toMatchObject({
      kind: 'text',
      description: 'The button’s text.',
    })
    expect(BUTTON[4]).toMatchObject({ kind: 'number', start: 2 })
    expect(controlFor(prop({ name: 'icon', type: 'string' }))).toMatchObject({
      kind: 'text',
      start: undefined,
      seeded: false,
    })
  })

  test('anything else is set in code, keeping its type', () => {
    expect(BUTTON[5]).toMatchObject({
      kind: 'code',
      type: '{ base?: string; }',
    })
    for (const type of ['string | number', 'string[]', '() => void', '"a" | 1'])
      expect(controlFor(prop({ name: 'x', type })).kind).toBe('code')
  })

  test('a default that is not one of the options is no start', () => {
    expect(
      controlFor(prop({ name: 'tone', type: '"calm"', default: '"loud"' })),
    ).toMatchObject({ start: undefined })
  })
})

describe('defaults are read only when they are literals', () => {
  test.each([
    ['"primary"', 'primary'],
    ["'primary'", 'primary'],
    ['true', true],
    ['false', false],
    ['-1.5', -1.5],
    ['0', 0],
  ])('%s', (text, value) => {
    expect(literalValue(text)).toBe(value)
  })

  test.each([[null], ['() => []'], ['{}'], ['size.md'], ['']])('%s', (text) => {
    expect(literalValue(text)).toBeUndefined()
  })
})

describe('values in the address', () => {
  test('changed values become query parameters and read back the same', () => {
    let values = changeValue(BUTTON, {}, 'color', 'neutral')
    values = changeValue(BUTTON, values, 'loading', true)
    values = changeValue(BUTTON, values, 'label', 'Save')
    values = changeValue(BUTTON, values, 'count', 5)
    const query = writeQuery(BUTTON, values)
    expect(query).toEqual({
      color: 'neutral',
      loading: 'true',
      label: 'Save',
      count: '5',
    })
    expect(readValues(BUTTON, query)).toEqual({
      color: 'neutral',
      loading: true,
      label: 'Save',
      count: 5,
    })
  })

  test('a value back at its start leaves the address', () => {
    const values = changeValue(BUTTON, { color: 'neutral' }, 'color', 'primary')
    expect(writeQuery(BUTTON, values)).toEqual({})
    expect(changeValue(BUTTON, { label: 'Save' }, 'label', 'Label')).toEqual({})
    expect(changeValue(BUTTON, { size: 'xs' }, 'size', undefined)).toEqual({})
  })

  test('unknown props and values that do not fit are dropped', () => {
    expect(
      readValues(BUTTON, {
        color: 'purple',
        size: ['xs', 'sm'],
        loading: 'yes',
        count: 'many',
        ui: '{}',
        sparkle: 'true',
        label: 'Kept',
      }),
    ).toEqual({ label: 'Kept' })
  })

  test('a value equal to its start is not a change', () => {
    expect(readValues(BUTTON, { color: 'primary', loading: 'false' })).toEqual(
      {},
    )
  })

  test('changing a value keeps the others and only fitting values', () => {
    expect(changeValue(BUTTON, { label: 'A' }, 'color', 'purple')).toEqual({
      label: 'A',
    })
    expect(changeValue(BUTTON, { label: 'A' }, 'sparkle', 'x')).toEqual({
      label: 'A',
    })
  })
})

describe('the start is seeded, so the component never opens empty', () => {
  test('the Default example’s value comes first, when it fits', () => {
    expect(controlFor(BUTTON_PROPS[1]!, 'neutral')).toMatchObject({
      start: 'neutral',
      seeded: true,
    })
    expect(controlFor(BUTTON_PROPS[3]!, true)).toMatchObject({
      start: true,
      seeded: true,
    })
    expect(controlFor(BUTTON_PROPS[4]!, 7)).toMatchObject({ start: 7 })
    expect(controlFor(BUTTON_PROPS[0]!, 'Invite Learners')).toMatchObject({
      start: 'Invite Learners',
      seeded: true,
    })
  })

  test('a seed that doesn’t fit the control falls back to the default', () => {
    expect(controlFor(BUTTON_PROPS[1]!, 'purple')).toMatchObject({
      start: 'primary',
      seeded: false,
    })
    expect(controlFor(BUTTON_PROPS[4]!, '7')).toMatchObject({ start: 2 })
    expect(controlFor(BUTTON_PROPS[3]!, 'true')).toMatchObject({
      start: false,
      seeded: false,
    })
    expect(controlFor(BUTTON_PROPS[5]!, 'x')).toMatchObject({ kind: 'code' })
  })

  test('text that shows gets a sample from its name, a required text too', () => {
    for (const [name, sample] of [
      ['label', 'Label'],
      ['title', 'Title'],
      ['description', 'Description'],
      ['placeholder', 'Placeholder'],
      ['text', 'Text'],
    ] as const)
      expect(controlFor(prop({ name, type: 'string' }))).toMatchObject({
        start: sample,
        seeded: true,
      })
    expect(
      controlFor(prop({ name: 'modelValue', type: 'string', required: true })),
    ).toMatchObject({ start: 'Model value', seeded: true })
  })

  test('a declared default comes before a sample', () => {
    expect(
      controlFor(prop({ name: 'label', type: 'string', default: '"Save"' })),
    ).toMatchObject({ start: 'Save', seeded: false })
    expect(
      controlFor(prop({ name: 'label', type: 'string', default: '""' })),
    ).toMatchObject({ start: 'Label', seeded: true })
  })

  test('a seed is the start: not written to the address, and Reset returns to it', () => {
    const color = controlFor(BUTTON_PROPS[1]!, 'neutral')
    const controls = [BUTTON[0]!, color]
    expect(readValues(controls, { color: 'neutral', label: 'Label' })).toEqual(
      {},
    )
    expect(changeValue(controls, {}, 'color', 'neutral')).toEqual({})
    const values = changeValue(controls, {}, 'color', 'primary')
    expect(writeQuery(controls, values)).toEqual({ color: 'primary' })
    expect(stageProps(controls, {})).toEqual({
      label: 'Label',
      color: 'neutral',
    })
  })

  test('a seeded prop can be emptied or set to Default, and stays so', () => {
    const tone = controlFor(
      prop({ name: 'tone', type: '"calm" | "loud"' }),
      'loud',
    )
    const max = controlFor(prop({ name: 'max', type: 'number' }), 5)
    const controls = [BUTTON[0]!, tone, max]
    let values = changeValue(controls, {}, 'label', undefined)
    values = changeValue(controls, values, 'tone', undefined)
    values = changeValue(controls, values, 'max', undefined)
    const query = writeQuery(controls, values)
    expect(query).toEqual({ label: '', tone: '', max: '' })
    expect(readValues(controls, query)).toEqual(values)
    expect(stageProps(controls, values)).toEqual({})
    // Unseeded, leaving it out is its default again: nothing changes.
    const saved = controlFor(
      prop({ name: 'label', type: 'string', default: '"Save"' }),
    )
    expect(
      readValues([...BUTTON.slice(1), saved], {
        size: '',
        count: '',
        label: '',
      }),
    ).toEqual({})
  })

  test('a required text emptied is an empty value, not its seed again', () => {
    const title = controlFor(
      prop({ name: 'title', type: 'string', required: true }),
      'Tide tables',
    )
    const values = changeValue([title], {}, 'title', undefined)
    expect(values).toEqual({ title: '' })
    expect(stageProps([title], values)).toEqual({ title: '' })
  })
})

describe('what the stage gets', () => {
  test('changed values and seeded or required starts; defaults stay the component’s', () => {
    const controls = [
      ...BUTTON,
      controlFor(prop({ name: 'title', type: 'string', required: true })),
    ]
    expect(stageProps(controls, { size: 'xs' })).toEqual({
      label: 'Label',
      size: 'xs',
      title: 'Title',
    })
  })

  test('a required prop the panel can’t fill blocks the stage, naming it', () => {
    const ui = controlFor(prop({ name: 'ui', type: 'object', required: true }))
    const tone = controlFor(
      prop({ name: 'tone', type: '"calm" | "loud"', required: true }),
    )
    expect(blockingProp([...BUTTON, ui])?.name).toBe('ui')
    expect(blockingProp([...BUTTON, tone], {})?.name).toBe('tone')
    expect(blockingProp([...BUTTON, tone], { tone: 'calm' })).toBeUndefined()
    expect(blockingProp(BUTTON, {})).toBeUndefined()
    // A required choice its Default example sets no longer waits.
    const seeded = controlFor(
      prop({ name: 'tone', type: '"calm" | "loud"', required: true }),
      'calm',
    )
    expect(blockingProp([...BUTTON, seeded], {})).toBeUndefined()
  })
})
