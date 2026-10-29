// Each syntax the source editor highlights, loaded when a file needs it.
// Highlighting is an editing aid; Vue, Markdown and Mermaid stay the
// authority on what a file means.
import type { Extension } from '@codemirror/state'
import type { SourceLanguage } from '../../utils/sourceLanguage'

async function mermaid() {
  const { HighlightStyle, LanguageSupport, syntaxHighlighting } =
    await import('@codemirror/language')
  const {
    flowchartTags,
    journeyTags,
    mermaidLanguage,
    mindmapTags,
    requirementTags,
    sequenceTags,
  } = await import('codemirror-lang-mermaid')
  // Mermaid's own tokens have no standard parent tag the theme colours.
  const highlight = HighlightStyle.define([
    {
      tag: [
        mindmapTags.lineText1,
        mindmapTags.lineText2,
        mindmapTags.lineText3,
        mindmapTags.lineText4,
        mindmapTags.lineText5,
      ],
      color: 'var(--fx-cyan)',
    },
    {
      tag: [flowchartTags.nodeId, sequenceTags.nodeText, journeyTags.actor],
      color: 'var(--fx-blue)',
    },
    {
      tag: [flowchartTags.orientation, sequenceTags.position],
      color: 'var(--fx-green)',
    },
    {
      tag: [sequenceTags.messageText2, requirementTags.unquotedString],
      color: 'var(--fx-cyan)',
    },
  ])
  return new LanguageSupport(mermaidLanguage, syntaxHighlighting(highlight))
}

// Markdown with GitHub's tables, task lists and strikethrough, YAML
// frontmatter, and fenced code in the languages the editor has.
async function markdown() {
  const [{ markdown, markdownLanguage }, { javascript }, yaml, diagram] =
    await Promise.all([
      import('@codemirror/lang-markdown'),
      import('@codemirror/lang-javascript'),
      import('@codemirror/lang-yaml'),
      mermaid(),
    ])
  const code = javascript({ jsx: true, typescript: true }).language
  const codeLanguages = (info: string) => {
    const name = info.trim().split(/\s+/)[0]!.toLowerCase()
    if (
      ['js', 'jsx', 'javascript', 'ts', 'tsx', 'typescript', 'json'].includes(
        name,
      )
    )
      return code
    if (name === 'mermaid') return diagram.language
    if (name === 'yaml' || name === 'yml') return yaml.yamlLanguage
    return null
  }
  return [
    yaml.yamlFrontmatter({
      content: markdown({ base: markdownLanguage, codeLanguages }),
    }),
    diagram.support,
  ]
}

export async function languageExtension(
  language: SourceLanguage,
): Promise<Extension> {
  switch (language) {
    case 'vue':
      return (await import('@codemirror/lang-vue')).vue()
    case 'typescript':
      return (await import('@codemirror/lang-javascript')).javascript({
        jsx: true,
        typescript: true,
      })
    case 'json':
      return (await import('@codemirror/lang-json')).json()
    case 'css':
      return (await import('@codemirror/lang-css')).css()
    case 'yaml':
      return (await import('@codemirror/lang-yaml')).yaml()
    case 'mermaid':
      return mermaid()
    case 'markdown':
      return markdown()
    default:
      return []
  }
}
