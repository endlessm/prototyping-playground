// Playground's controls come from the props metadata alone: each prop maps
// to one control with a starting value, and the values a designer changes
// travel in the address and back, dropping what no longer fits.
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
const BUTTON = [
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
].map(controlFor)

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
      start: undefined,
      description: 'The button’s text.',
    })
    expect(BUTTON[4]).toMatchObject({ kind: 'number', start: 2 })
  })

  test('a required string starts empty, which is a value', () => {
    expect(
      controlFor(prop({ name: 'label', type: 'string', required: true })),
    ).toMatchObject({ kind: 'text', start: '' })
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
    expect(changeValue(BUTTON, { label: 'Save' }, 'label', '')).toEqual({})
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

describe('what the stage gets', () => {
  test('only changed values and required starts, so defaults stay the component’s', () => {
    const controls = [
      ...BUTTON,
      controlFor(prop({ name: 'title', type: 'string', required: true })),
    ]
    expect(stageProps(controls, { size: 'xs' })).toEqual({
      size: 'xs',
      title: '',
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
  })
})
