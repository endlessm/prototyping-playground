// The syntax the source editor highlights, from a file's extension.

export type SourceLanguage =
  | 'vue'
  | 'typescript'
  | 'markdown'
  | 'json'
  | 'mermaid'
  | 'css'
  | 'yaml'
  | 'text'

const BY_EXTENSION: Record<string, SourceLanguage> = {
  vue: 'vue',
  ts: 'typescript',
  tsx: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  js: 'typescript',
  jsx: 'typescript',
  mjs: 'typescript',
  cjs: 'typescript',
  md: 'markdown',
  json: 'json',
  mmd: 'mermaid',
  mermaid: 'mermaid',
  css: 'css',
  yaml: 'yaml',
  yml: 'yaml',
}

export function sourceLanguage(file: string): SourceLanguage {
  const name = file.split('/').at(-1) ?? ''
  const dot = name.lastIndexOf('.')
  if (dot <= 0) return 'text'
  return BY_EXTENSION[name.slice(dot + 1).toLowerCase()] ?? 'text'
}
