<script setup lang="ts">
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
} from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  indentOnInput,
} from '@codemirror/language'
import {
  highlightSelectionMatches,
  search,
  searchKeymap,
} from '@codemirror/search'
import {
  Compartment,
  EditorState,
  RangeSetBuilder,
  StateEffect,
  StateField,
} from '@codemirror/state'
import {
  Decoration,
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view'
import type { SourceLanguage } from '../../utils/sourceLanguage'
import { languageExtension } from './sourceLanguages'
import { sourceTheme } from './sourceTheme'

// CodeMirror 6 as a Vue component: the text is the model. Text set from
// outside (a file reloaded from disk) replaces the editor's as one change.
// A page can mark a range of the text (`highlight`, such as the element the
// Lab's Inspect selected): its lines are tinted and scrolled into view.
const props = withDefaults(
  defineProps<{
    language: SourceLanguage
    editable: boolean
    /** The editor's name for screen readers. */
    label: string
    /** Takes the focus when it opens. */
    autofocus?: boolean
    /** Character offsets of a range whose lines are marked. */
    highlight?: { from: number; to: number } | null
  }>(),
  { autofocus: true, highlight: null },
)
const text = defineModel<string>({ required: true })

const host = useTemplateRef<HTMLDivElement>('host')
let view: EditorView | undefined
const syntax = new Compartment()
const access = new Compartment()

const mark = StateEffect.define<{ from: number; to: number } | null>()
const marked = Decoration.line({ class: 'cm-studio-marked' })
// The marked lines, moved along with edits until the next mark.
const markedLines = StateField.define({
  create: () => Decoration.none,
  update(lines, transaction) {
    let next = lines.map(transaction.changes)
    for (const effect of transaction.effects) {
      if (!effect.is(mark)) continue
      const range = effect.value
      if (!range) {
        next = Decoration.none
        continue
      }
      const { doc } = transaction.state
      const builder = new RangeSetBuilder<Decoration>()
      const first = doc.lineAt(Math.min(range.from, doc.length)).number
      const last = doc.lineAt(Math.min(range.to, doc.length)).number
      for (let line = first; line <= last; line++)
        builder.add(doc.line(line).from, doc.line(line).from, marked)
      next = builder.finish()
    }
    return next
  },
  provide: (field) => EditorView.decorations.from(field),
})

function showHighlight(range: { from: number; to: number } | null) {
  if (!view) return
  const length = view.state.doc.length
  view.dispatch({
    effects: [
      mark.of(range),
      ...(range
        ? [
            EditorView.scrollIntoView(Math.min(range.from, length), {
              y: 'start',
              yMargin: 48,
            }),
          ]
        : []),
    ],
  })
}

const accessExtensions = (editable: boolean) => [
  EditorState.readOnly.of(!editable),
  EditorView.editable.of(editable),
  // A read-only editor isn't focusable by default, which would leave it
  // without ⌘F and keyboard selection, so it keeps a tab stop.
  EditorView.contentAttributes.of({
    'aria-label': props.label,
    ...(editable ? {} : { tabindex: '0' }),
  }),
]

onMounted(async () => {
  view = new EditorView({
    parent: host.value!,
    state: EditorState.create({
      doc: text.value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        drawSelection(),
        history(),
        bracketMatching(),
        closeBrackets(),
        autocompletion({ activateOnTyping: false }),
        indentOnInput(),
        foldGutter(),
        highlightSelectionMatches(),
        search({ top: true }),
        sourceTheme,
        markedLines,
        syntax.of([]),
        access.of(accessExtensions(props.editable)),
        ...(props.language === 'markdown' ? [EditorView.lineWrapping] : []),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...searchKeymap,
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) text.value = update.state.doc.toString()
        }),
      ],
    }),
  })
  if (props.autofocus) view.focus()
  showHighlight(props.highlight)
  const extension = await languageExtension(props.language)
  view?.dispatch({ effects: syntax.reconfigure(extension) })
})

watch(text, (next) => {
  if (!view || next === view.state.doc.toString()) return
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: next },
  })
})

watch(
  () => [props.editable, props.label] as const,
  ([editable]) =>
    view?.dispatch({ effects: access.reconfigure(accessExtensions(editable)) }),
)

watch(() => props.highlight, showHighlight)

onBeforeUnmount(() => {
  view?.destroy()
  view = undefined
})

defineExpose({ focus: () => view?.focus() })
</script>

<template>
  <div ref="host" class="min-h-0 flex-1 overflow-hidden" />
</template>
