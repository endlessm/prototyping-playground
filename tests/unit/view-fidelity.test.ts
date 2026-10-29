import { describe, expect, test } from 'vitest'
import { fidelity } from '../../src/modules/prototypes/types/view/fidelity'

const { isLofi, setLofi } = fidelity
const SOURCE = `<!-- @studio-id vew0000000000001 -->\n<template>\n  <UButton>Hi</UButton>\n</template>\n`

describe('a lo-fi view', () => {
  test('[PR-91] is marked by a comment at the top', () => {
    expect(isLofi(SOURCE)).toBe(false)
    expect(isLofi('')).toBe(false)
    expect(isLofi(`<!-- @lofi -->\n${SOURCE}`)).toBe(true)
    expect(isLofi(`${SOURCE.replace('-->', '-->\n<!-- @lofi -->')}`)).toBe(true)
    expect(
      isLofi(`<!--\n  Checkout, first try.\n  @lofi\n-->\n${SOURCE}`),
    ).toBe(true)
    expect(isLofi(`\uFEFF<!-- @lofi -->\n${SOURCE}`)).toBe(true)
  })

  test('[PR-91] a marker below the code, or a word that only starts like it, does not count', () => {
    expect(isLofi(`${SOURCE}<!-- @lofi -->\n`)).toBe(false)
    expect(isLofi(`<!-- @lofioutdated -->\n${SOURCE}`)).toBe(false)
  })

  test('[PR-91] "Make lo-fi" adds the marker once, and "Make hi-fi" takes it out again', () => {
    const on = setLofi(SOURCE, true)
    expect(on).toBe(`<!-- @lofi -->\n${SOURCE}`)
    expect(setLofi(on, true)).toBe(on)
    expect(setLofi(on, false)).toBe(SOURCE)
    expect(setLofi(SOURCE, false)).toBe(SOURCE)
  })

  test('[PR-91] switching off inside a longer comment leaves the rest of it', () => {
    const source = `<!--\n  Checkout, first try.\n  @lofi\n-->\n${SOURCE}`
    const off = setLofi(source, false)
    expect(isLofi(off)).toBe(false)
    expect(off).toContain('Checkout, first try.')
    expect(off.endsWith(SOURCE)).toBe(true)
  })

  test('[PR-91] keeps the byte order mark first and the line endings', () => {
    const crlf = SOURCE.replaceAll('\n', '\r\n')
    const on = setLofi(`\uFEFF${crlf}`, true)
    expect(on).toBe(`\uFEFF<!-- @lofi -->\r\n${crlf}`)
    expect(setLofi(on, false)).toBe(`\uFEFF${crlf}`)
  })
})
