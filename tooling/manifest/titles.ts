// An artifact's readable title from its file name, without folder or
// extension, so a name reads the same in the navigation, page titles and new
// documents:
//   "session-done" → "Session Done", "home_screen" → "Home Screen",
//   "Home - new user" → "Home - New user", "lofi" → "Lo-fi"
// A spaced dash stays a dash; a bare hyphen or underscore becomes a space.
// Each part starts with a capital, and the rest of a name is kept as
// written. Framework-neutral.
export function artifactTitle(name: string) {
  const title = name
    .split(/\s+-\s+/)
    .map((part) =>
      part
        .split(/[-_]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
    )
    .join(' - ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\bLo ?fi\b/gi, 'Lo-fi')
    .replace(/\bHi ?fi\b/gi, 'Hi-fi')
  return title || name
}
