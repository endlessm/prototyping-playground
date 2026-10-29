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
import { Compartment, EditorState } from '@codemirror/state'
import {
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
const props = defineProps<{
  language: SourceLanguage
  editable: boolean
  /** The editor's name for screen readers. */
  label: string
}>()
const text = defineModel<string>({ required: true })

const host = useTemplateRef<HTMLDivElement>('host')
let view: EditorView | undefined
const syntax = new Compartment()
const access = new Compartment()

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
  view.focus()
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

onBeforeUnmount(() => {
  view?.destroy()
  view = undefined
})

defineExpose({ focus: () => view?.focus() })
</script>

<template>
  <div ref="host" class="min-h-0 flex-1 overflow-hidden" />
</template>
