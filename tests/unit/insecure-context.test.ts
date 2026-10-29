import { createHash, webcrypto } from 'node:crypto'
import { expect, test } from 'vitest'
import {
  fillInsecureContext,
  randomUUID,
  sha256,
} from '../../app/utils/insecureContext'

// Carried over from the React studio with its assertions unchanged.
const hex = (buffer: ArrayBuffer) => Buffer.from(buffer).toString('hex')

test('[SH-144] sha256 matches Node across padding boundaries', () => {
  for (const length of [0, 1, 55, 56, 63, 64, 65, 119, 120, 1000]) {
    const data = new Uint8Array(length).map((_, i) => (i * 31 + 7) & 0xff)
    expect(hex(sha256(data)), `length ${length}`).toBe(
      createHash('sha256').update(data).digest('hex'),
    )
  }
  const text = new TextEncoder().encode('[["app/overview.tsx","1"]] — ünïcode')
  expect(hex(sha256(text))).toBe(
    createHash('sha256').update(text).digest('hex'),
  )
})

test('[SH-144] randomUUID produces distinct version 4 identifiers', () => {
  const ids = new Set(Array.from({ length: 200 }, randomUUID))
  expect(ids.size).toBe(200)
  for (const id of ids)
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
})

test('[SH-144] filling an insecure context adds only what is missing', async () => {
  const insecure = {
    getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
  } as unknown as Crypto
  fillInsecureContext({ crypto: insecure } as unknown as typeof globalThis)
  expect(insecure.randomUUID()).toMatch(/^[0-9a-f-]{36}$/)
  const digest = await insecure.subtle.digest(
    'SHA-256',
    new TextEncoder().encode('studio'),
  )
  expect(hex(digest)).toBe(createHash('sha256').update('studio').digest('hex'))
  await expect(
    insecure.subtle.digest('SHA-1', new Uint8Array()),
  ).rejects.toThrow()

  const native = webcrypto.randomUUID
  fillInsecureContext({ crypto: webcrypto } as unknown as typeof globalThis)
  expect(webcrypto.randomUUID).toBe(native)
})
