// A lo-fi view says so in a comment at the top, `<!-- @lofi -->`. Its
// preview keeps the system's components and behavior, drawn in grayscale
// with a handwritten font. "Make lo-fi" and "Make hi-fi" add and remove the
// marker.
import type { FidelityAdapter } from '../../../../../tooling/modules/contract.ts'
import { HEADER } from './states.ts'

const TAG = /@lofi\b/
// A comment that holds only the tag goes whole when lo-fi is switched off.
const ONLY_TAG =
  /^(\uFEFF?(?:\s|<!--[\s\S]*?-->)*?)[ \t]*<!--[ \t]*@lofi[ \t]*-->[ \t]*\r?\n?/

export const fidelity: FidelityAdapter = {
  isLofi: (source) => TAG.test(HEADER.exec(source)?.[0] ?? ''),
  setLofi(source, on) {
    const lofi = fidelity.isLofi(source)
    if (on) {
      if (lofi) return source
      const bom = source.startsWith('\uFEFF') ? '\uFEFF' : ''
      const eol = source.includes('\r\n') ? '\r\n' : '\n'
      return `${bom}<!-- @lofi -->${eol}${source.slice(bom.length)}`
    }
    if (!lofi) return source
    if (ONLY_TAG.test(source)) return source.replace(ONLY_TAG, '$1')
    const header = HEADER.exec(source)![0]
    return (
      header.replace(/[ \t]*@lofi\b[ \t]*\r?\n?/, '') +
      source.slice(header.length)
    )
  },
}
