import { expect, test } from 'vitest'
import { editConfig, parseConfig } from '../../tooling/settings/config-file'
import { identityCache } from '../../tooling/contributors/identity-cache'

test('[CL-61] nested switches keep every unrelated line, indentation and key order', () => {
  const source =
    '{\r\n "name": "Studio",\r\n "modules": {\r\n   "one": true,\r\n   "two": false\r\n }\r\n}\r\n'
  expect(
    editConfig(
      source,
      { modules: { one: false, two: false } },
      'studio.config.json',
    ),
  ).toBe(source.replace('"one": true', '"one": false'))
  expect(() =>
    parseConfig('{"modules":{"one":true,"one":false}}', 'studio.config.json'),
  ).toThrow('Repeated key')
})

test('[CL-61] adding a setting preserves existing property lines and produces strict JSON', () => {
  const source = '{\n  "name" : "Studio"\n}\n'
  const next = editConfig(
    source,
    { tagline: 'New', admins: ['ada'] },
    'studio.config.json',
  )
  expect(next).toContain('  "name" : "Studio"')
  expect(JSON.parse(next)).toEqual({
    name: 'Studio',
    tagline: 'New',
    admins: ['ada'],
  })
  expect(
    JSON.parse(
      editConfig(
        '{}',
        { name: 'Studio', tagline: 'New' },
        'studio.config.json',
      ),
    ),
  ).toEqual({ name: 'Studio', tagline: 'New' })
})

test('[CL-61] removing a module preserves the other module lines', () => {
  const source =
    '{\n "modules": {\n   "one" : true,\n   "two" : false,\n   "three" : true\n }\n}\n'
  const result = editConfig(
    source,
    { modules: { one: true, three: true } },
    'studio.config.json',
  )
  expect(result).toContain('   "one" : true,')
  expect(result).toContain('   "three" : true')
  expect(JSON.parse(result).modules).toEqual({ one: true, three: true })
})

test('[SH-106] transient GitHub lookup failure never caches nobody indefinitely', () => {
  let key: string | null = null
  const cache = identityCache(() => ({ key }))
  expect(cache.read()).toBe('{"key":null}')
  key = 'ada'
  expect(cache.read()).toBe('{"key":"ada"}')
  key = 'ben'
  expect(cache.read()).toBe('{"key":"ada"}')
  cache.clear()
  expect(cache.read()).toBe('{"key":"ben"}')
})
