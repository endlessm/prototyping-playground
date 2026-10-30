// A new diagram: a small flowchart whose accessible title is the diagram's
// name. The studio adds its permanent identity as a leading comment.
export function template(title: string) {
  const name = title.replace(/\s+/g, ' ').trim() || 'Untitled'
  return `flowchart LR\n  accTitle: ${name}\n  accDescr: A starting point connects an idea to its next step.\n  idea[Idea] --> next[Next step]\n`
}
