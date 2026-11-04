// How the source editor looks: the studio's own background, text and
// borders (Nuxt UI's neutral theme), with syntax colours from the studio's
// accent palette (`contentPalette`, Flexoki), shared with code in documents
// and with diagrams. The colours live on the editor only, so the studio's
// theme gains no tokens.
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags as t } from '@lezer/highlight'
import { contentPalette } from '../../utils/contentPalette'

const palette = Object.fromEntries(
  Object.entries(contentPalette).map(([name, color]) => [
    `--fx-${name}`,
    color,
  ]),
)

// The search and go-to-line panels share their styles.
const panels = (rest: string) =>
  `.cm-panel.cm-search${rest}, .cm-panel.cm-gotoLine${rest}`
const quiet = 'var(--ui-text-muted)'
const radius = 'calc(var(--ui-radius) * 1.5)'
const control = {
  boxSizing: 'border-box',
  height: '28px',
  margin: '0',
  padding: '0 10px',
  fontSize: '12px',
  borderRadius: radius,
  outline: 'none',
  backgroundColor: 'var(--ui-bg)',
  color: 'var(--ui-text)',
  border: '1px solid var(--ui-border-accented)',
}

const layout = EditorView.theme({
  '&': {
    ...palette,
    height: '100%',
    backgroundColor: 'var(--ui-bg)',
    color: 'var(--ui-text)',
    fontSize: '13px',
  },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    lineHeight: '1.65',
  },
  '.cm-content': { caretColor: 'var(--ui-text)', padding: '12px 0' },
  '.cm-line': { padding: '0 16px' },
  '.cm-cursor': { borderLeftColor: 'var(--ui-text)' },
  '.cm-gutters': {
    backgroundColor: 'var(--ui-bg)',
    color: 'var(--ui-text-dimmed)',
    border: 'none',
  },
  '.cm-activeLine': {
    backgroundColor:
      'color-mix(in oklab, var(--ui-bg-elevated) 70%, transparent)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
    color: 'var(--ui-text)',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'color-mix(in oklab, var(--fx-blue) 22%, transparent)',
  },
  '.cm-matchingBracket': {
    backgroundColor: 'color-mix(in oklab, var(--fx-blue) 22%, transparent)',
    outline: 'none',
  },
  '.cm-selectionMatch': {
    backgroundColor: 'color-mix(in oklab, var(--fx-blue) 16%, transparent)',
  },
  '.cm-searchMatch': {
    backgroundColor: 'color-mix(in oklab, var(--fx-yellow) 30%, transparent)',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: 'color-mix(in oklab, var(--fx-orange) 45%, transparent)',
  },
  '.cm-panels': { backgroundColor: 'var(--ui-bg)', color: 'var(--ui-text)' },
  '.cm-panels-top': { borderBottom: '1px solid var(--ui-border)' },
  '.cm-panels-bottom': { borderTop: '1px solid var(--ui-border)' },
  [panels('')]: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 44px 10px 16px',
    fontSize: '12px',
  },
  [panels(' br')]: { flexBasis: '100%', height: '0', margin: '-2px 0 0' },
  [panels(' .cm-textfield')]: { ...control, width: '220px' },
  [panels(' .cm-textfield:focus')]: {
    borderColor: 'var(--ui-border-inverted)',
  },
  [panels(' .cm-button')]: {
    ...control,
    backgroundImage: 'none',
    fontWeight: '500',
    cursor: 'pointer',
    textTransform: 'none',
  },
  [`${panels(' .cm-button:hover')}, ${panels(' .cm-button:active')}`]: {
    backgroundImage: 'none',
    backgroundColor: 'var(--ui-bg-elevated)',
  },
  [panels(' label')]: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    margin: '0',
    color: quiet,
    fontSize: '12px',
    cursor: 'pointer',
  },
  [panels(' input[type=checkbox]')]: {
    width: '14px',
    height: '14px',
    margin: '0',
    accentColor: 'var(--ui-primary)',
  },
  [`${panels(' [name=close]')}, ${panels(' .cm-dialog-close')}`]: {
    position: 'absolute',
    top: '10px',
    right: '12px',
    width: '28px',
    height: '28px',
    margin: '0',
    padding: '0',
    fontSize: '18px',
    lineHeight: '1',
    backgroundColor: 'transparent',
    color: quiet,
    border: 'none',
    borderRadius: radius,
    cursor: 'pointer',
  },
  // Folding: the chevrons show while the pointer is over the gutter, or
  // where a fold is closed.
  '.cm-foldGutter': { width: '16px' },
  '.cm-foldGutter span': {
    display: 'flex',
    justifyContent: 'center',
    color: quiet,
    cursor: 'pointer',
    opacity: '0',
    transition: 'opacity 120ms',
  },
  '.cm-gutters:hover .cm-foldGutter span, .cm-foldGutter span[title="Unfold line"]':
    { opacity: '1' },
  '.cm-foldPlaceholder': {
    padding: '0 6px',
    margin: '0 2px',
    color: quiet,
    backgroundColor: 'var(--ui-bg-elevated)',
    border: '1px solid var(--ui-border)',
    borderRadius: radius,
    cursor: 'pointer',
  },
})

// Later rules win where they overlap, so the broad ones come first.
const highlight = HighlightStyle.define([
  { tag: t.quote, color: quiet, fontStyle: 'italic' },
  {
    tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.definitionKeyword],
    color: 'var(--fx-green)',
  },
  { tag: t.moduleKeyword, color: 'var(--fx-red)' },
  { tag: [t.string, t.special(t.string)], color: 'var(--fx-cyan)' },
  {
    tag: [t.regexp, t.escape, t.self, t.character],
    color: 'var(--fx-magenta)',
  },
  { tag: t.number, color: 'var(--fx-purple)' },
  {
    tag: [t.bool, t.null, t.atom, t.constant(t.variableName)],
    color: 'var(--fx-yellow)',
  },
  { tag: [t.typeName, t.className, t.namespace], color: 'var(--fx-yellow)' },
  {
    tag: [t.definition(t.variableName), t.propertyName, t.attributeName],
    color: 'var(--fx-blue)',
  },
  {
    tag: [
      t.function(t.variableName),
      t.function(t.propertyName),
      t.definition(t.function(t.variableName)),
    ],
    color: 'var(--fx-orange)',
  },
  { tag: t.tagName, color: 'var(--fx-magenta)' },
  {
    tag: [
      t.operator,
      t.definitionOperator,
      t.punctuation,
      t.separator,
      t.bracket,
      t.angleBracket,
      t.processingInstruction,
    ],
    color: quiet,
  },
  {
    tag: [t.comment, t.meta],
    color: 'var(--fx-comment)',
    fontStyle: 'italic',
  },
  // Markdown
  { tag: t.heading, fontWeight: '600', color: 'var(--fx-orange)' },
  { tag: t.strong, fontWeight: '600' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: [t.link, t.url], color: 'var(--fx-blue)' },
  { tag: t.monospace, color: 'var(--fx-cyan)' },
  { tag: t.contentSeparator, color: quiet },
  { tag: t.strikethrough, color: quiet, textDecoration: 'line-through' },
  { tag: t.labelName, color: 'var(--fx-yellow)' },
])

export const sourceTheme = [layout, syntaxHighlighting(highlight)]
