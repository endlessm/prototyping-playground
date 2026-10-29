// Browsers withhold some APIs outside secure contexts, which includes a studio
// opened at http://<lan-ip>:<port>. Fill in only what Studio uses and only when
// it is missing, so https and localhost keep the native implementations.

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
])

export function sha256(data: Uint8Array): ArrayBuffer {
  const length = data.length
  const padded = new Uint8Array(((length + 9 + 63) >> 6) << 6)
  padded.set(data)
  padded[length] = 0x80
  const view = new DataView(padded.buffer)
  view.setUint32(padded.length - 8, Math.floor(length / 0x20000000))
  view.setUint32(padded.length - 4, (length << 3) >>> 0)
  const hash = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
    0x1f83d9ab, 0x5be0cd19,
  ])
  const w = new Uint32Array(64)
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n))
  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4)
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15]!, 7) ^ rotr(w[i - 15]!, 18) ^ (w[i - 15]! >>> 3)
      const s1 = rotr(w[i - 2]!, 17) ^ rotr(w[i - 2]!, 19) ^ (w[i - 2]! >>> 10)
      w[i] = w[i - 16]! + s0 + w[i - 7]! + s1
    }
    let [a, b, c, d, e, f, g, h] = [...hash] as [
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
    ]
    for (let i = 0; i < 64; i++) {
      const t1 =
        h +
        (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) +
        ((e & f) ^ (~e & g)) +
        K[i]! +
        w[i]!
      const t2 =
        (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))
      h = g
      g = f
      f = e
      e = (d + t1) >>> 0
      d = c
      c = b
      b = a
      a = (t1 + t2) >>> 0
    }
    hash[0]! += a
    hash[1]! += b
    hash[2]! += c
    hash[3]! += d
    hash[4]! += e
    hash[5]! += f
    hash[6]! += g
    hash[7]! += h
  }
  const out = new DataView(new ArrayBuffer(32))
  hash.forEach((word, i) => out.setUint32(i * 4, word))
  return out.buffer
}

export function randomUUID(): `${string}-${string}-${string}-${string}-${string}` {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = [...bytes]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function copyText(text: string) {
  const field = document.createElement('textarea')
  field.value = text
  field.setAttribute('readonly', '')
  field.style.position = 'fixed'
  field.style.opacity = '0'
  document.body.append(field)
  field.select()
  const copied = document.execCommand('copy')
  field.remove()
  return copied
    ? Promise.resolve()
    : Promise.reject(new Error("Couldn't copy to the clipboard."))
}

export function fillInsecureContext(scope: typeof globalThis = globalThis) {
  const { crypto: webCrypto, navigator: browser } = scope
  if (webCrypto && typeof webCrypto.randomUUID !== 'function') {
    Object.defineProperty(webCrypto, 'randomUUID', {
      value: randomUUID,
      configurable: true,
    })
  }
  if (webCrypto && !webCrypto.subtle) {
    const digest = async (
      algorithm: AlgorithmIdentifier,
      data: BufferSource,
    ) => {
      const name = typeof algorithm === 'string' ? algorithm : algorithm.name
      if (name.toUpperCase() !== 'SHA-256')
        throw new Error(`${name} needs a secure context.`)
      const bytes = ArrayBuffer.isView(data)
        ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
        : new Uint8Array(data)
      return sha256(bytes)
    }
    Object.defineProperty(webCrypto, 'subtle', {
      value: { digest },
      configurable: true,
    })
  }
  if (browser && !browser.clipboard && typeof document !== 'undefined') {
    Object.defineProperty(browser, 'clipboard', {
      value: { writeText: copyText },
      configurable: true,
    })
  }
}
