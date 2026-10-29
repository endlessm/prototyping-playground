// A new document: its title and a line saying it's empty. The studio adds
// its permanent identity to the frontmatter when it writes the file.
import { stringify } from 'yaml'

export function template(title: string) {
  const line = stringify({ title: title.trim() || 'Untitled' })
  return `---\n${line}---\n\nThis document is empty. Ask your agent to write it: describe what it’s for and who will read it.\n`
}
