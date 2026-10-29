// What makes a document's source wrong, as sentences completing "<file>: …".
import { frontmatterRegion, frontmatterValues } from './frontmatter.ts'

export function check(source: string): string[] {
  if (frontmatterRegion(source) === 'open')
    return [
      'its frontmatter (the block at the top between --- lines) is never closed. End it with a second --- line.',
    ]
  const toc = frontmatterValues(source, 'toc')
  if (toc.some((value) => value !== 'true' && value !== 'false'))
    return ['"toc" in the frontmatter must be true or false.']
  return []
}
