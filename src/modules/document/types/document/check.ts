// What makes a document's source wrong, as sentences completing "<file>: …".
import { frontmatterOf, frontmatterRegion } from './frontmatter.ts'

export function check(source: string): string[] {
  if (frontmatterRegion(source) === 'open')
    return [
      'its frontmatter (the block at the top between --- lines) is never closed. End it with a second --- line.',
    ]
  let fields: Record<string, unknown>
  try {
    fields = frontmatterOf(source)
  } catch (error) {
    return [`its frontmatter is not valid YAML: ${(error as Error).message}`]
  }
  if ('toc' in fields && typeof fields.toc !== 'boolean')
    return ['"toc" in the frontmatter must be true or false.']
  return []
}
