// A new document: its title and a line saying it's empty. The studio adds
// its permanent identity to the frontmatter when it writes the file.

// A title YAML reads as plain text without quotes; anything else is written
// as a JSON string, which YAML reads the same way.
const PLAIN = /^[\p{L}\p{N}][\p{L}\p{N} .,’'()-]*$/u

export function template(title: string) {
  const name = title.trim() || 'Untitled'
  const value = PLAIN.test(name) ? name : JSON.stringify(name)
  return `---\ntitle: ${value}\n---\n\nThis document is empty. Ask your agent to write it: describe what it’s for and who will read it.\n`
}
