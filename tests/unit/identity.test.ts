import { describe, expect, test } from 'vitest'
import { identity as view } from '../../src/modules/prototypes/types/view/identity'

describe('a view’s identity comment', () => {
  test('[CL-51] is written as an HTML comment at the top of the file', () => {
    const source = '<script setup lang="ts">\nconst a = 1\n</script>\n'
    const written = view.write(source, 'abcd000000000001')
    expect(written).toBe(
      '<!-- @studio-id abcd000000000001 -->\n<script setup lang="ts">\nconst a = 1\n</script>\n',
    )
    expect(view.read(written)).toBe('abcd000000000001')
  })

  test('[CL-51] keeps a byte order mark first and the line endings of the file', () => {
    const written = view.write(
      '\uFEFF<template>\r\n  <p />\r\n</template>\r\n',
      'abcd000000000001',
    )
    expect(written).toBe(
      '\uFEFF<!-- @studio-id abcd000000000001 -->\r\n<template>\r\n  <p />\r\n</template>\r\n',
    )
  })

  test('[CL-51] never replaces an identity the file already declares', () => {
    const source = '<!-- @studio-id abcd000000000001 -->\n<template />\n'
    expect(() => view.write(source, 'abcd000000000002')).toThrow(
      /already declares/,
    )
  })

  test('[CL-51] is not read from a comment inside the code', () => {
    expect(
      view.read(
        '<template>\n<!-- @studio-id abcd000000000001 -->\n</template>',
      ),
    ).toBeNull()
  })
})
