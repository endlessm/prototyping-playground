// Versions of an app component (the Lab's New version): views in a
// person's own "<Component> versions" prototype, each a copy of the copied
// app file with the studio's two markers on top:
//
//   <!-- @studio-id <view id> -->
//   <!-- @lab-version <system id> <component slug> <revision> -->
//
// The second names the system, the component and the app revision the
// original was copied at. Plain functions over text, with no Node built-ins,
// so the manifest, the dev server and the browser share them.

/** What a version's marker names. */
export interface VersionMarker {
  /** The system's permanent ID. */
  system: string
  /** The component's slug on its system's pages. */
  component: string
  /** The app's revision the original was copied at, or null if unknown. */
  revision: string | null
}

const MARKER =
  /<!--\s*@lab-version\s+([^\s>]+)\s+([^\s>]+)(?:\s+([^\s>]+))?\s*-->/
// The comments before a file's code, where the markers belong.
const HEADER = /^\uFEFF?(?:\s|<!--[\s\S]*?-->)*/
const UNKNOWN = '?'

/** The version marker in a file's leading comments, or null. */
export function readVersionMarker(source: string): VersionMarker | null {
  const found = MARKER.exec(HEADER.exec(source)?.[0] ?? '')
  if (!found) return null
  const revision = found[3] ?? UNKNOWN
  return {
    system: found[1]!,
    component: found[2]!,
    revision: revision === UNKNOWN ? null : revision,
  }
}

/** The marker's comment, for a new version. */
export const versionMarker = ({ system, component, revision }: VersionMarker) =>
  `<!-- @lab-version ${system} ${component} ${revision || UNKNOWN} -->`

/**
 * A version's text without the studio's own lines (its permanent ID, its
 * version marker), with Unix line endings: what the app's file would hold.
 */
export function withoutStudioMarkers(source: string) {
  const text = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
  const header = HEADER.exec(text)?.[0] ?? ''
  const kept = header.replace(
    /<!--\s*@(?:studio-id|lab-version)\b[^>]*?-->[ \t]*\n?/g,
    '',
  )
  return kept + text.slice(header.length)
}
