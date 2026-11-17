// A Lab experiment is a view that names the system component it explores in
// a comment at its top, beside its permanent identity, and the day it was
// made, for the Lab's list:
//
//   <!-- @lab-experiment <system id> <component slug> [YYYY-MM-DD] -->
//
// The manifest reads it, so the Lab lists experiments without running any
// view. Framework-neutral.

export interface ExperimentMarker {
  /** The system's permanent ID. */
  systemId: string
  /** The component's address in the system, such as `button`. */
  component: string
  /** The day it was made, as metadata writes dates, or null. */
  created: string | null
}

// The comments and blank lines before a file's first code.
const HEADER = /^\uFEFF?(?:\s|<!--[\s\S]*?-->)*/
const COMMENT = /<!--[\s\S]*?-->/g
const MARKER =
  /^<!--\s*@lab-experiment\s+([0-9a-z]+)\s+([a-z0-9][a-z0-9-]*)(?:\s+(\d{4}-\d{2}-\d{2}))?\s*-->$/

const markerLine = ({ systemId, component, created }: ExperimentMarker) =>
  `<!-- @lab-experiment ${[systemId, component, created].filter(Boolean).join(' ')} -->`

/** The comment at the file's top, as found, or null. */
function markerComment(source: string) {
  const header = HEADER.exec(source)?.[0] ?? ''
  for (const comment of header.matchAll(COMMENT))
    if (/@lab-experiment\b/.test(comment[0]))
      return { text: comment[0], index: comment.index }
  return null
}

/** The component a view explores, or null for any other file. */
export function readExperiment(source: string): ExperimentMarker | null {
  const found = markerComment(source)
  const match = found && MARKER.exec(found.text)
  if (!match) return null
  return {
    systemId: match[1]!,
    component: match[2]!,
    created: match[3] ?? null,
  }
}

/**
 * The component a prototype's view explores. A marker naming another system
 * than the prototype's is ignored: the view is an ordinary view.
 */
export function experimentOf(
  source: string,
  prototype: { systemId?: unknown },
): ExperimentMarker | null {
  const marker = readExperiment(source)
  return marker && marker.systemId === prototype.systemId ? marker : null
}

/**
 * The source naming the component it explores: the comment replaces the one
 * there, or goes after the permanent identity's, or first.
 */
export function writeExperiment(source: string, marker: ExperimentMarker) {
  const line = markerLine(marker)
  const found = markerComment(source)
  if (found)
    return (
      source.slice(0, found.index) +
      line +
      source.slice(found.index + found.text.length)
    )
  const bom = source.startsWith('\uFEFF') ? '\uFEFF' : ''
  const eol = source.includes('\r\n') ? '\r\n' : '\n'
  const header = HEADER.exec(source)?.[0] ?? ''
  let at = -1
  for (const comment of header.matchAll(COMMENT))
    if (/@studio-(?:id|state)\b/.test(comment[0]))
      at = comment.index + comment[0].length
  if (at < 0) return `${bom}${line}${eol}${source.slice(bom.length)}`
  // After the identity comment's own line break.
  const rest = source.slice(at)
  const lineEnd = /^\r?\n/.exec(rest)?.[0] ?? ''
  return (
    source.slice(0, at) +
    lineEnd +
    line +
    (lineEnd ? eol : '') +
    rest.slice(lineEnd.length)
  )
}
