<script setup lang="ts">
import { useEventListener, useLocalStorage } from '@vueuse/core'
import type { DialValue } from 'dialkit/vanilla'
import LabDialPanels, { type DialPanel } from '../components/LabDialPanels.vue'
import LabEditorDivider from '../components/LabEditorDivider.vue'
import LabPlaygroundCodeProps from '../components/LabPlaygroundCodeProps.vue'
import LabPlaygroundEditor from '../components/LabPlaygroundEditor.vue'
import LabPlaygroundStage from '../components/LabPlaygroundStage.vue'
import { useLabComponent } from '../composables/useLabComponent'
import { useOriginalSource } from '../composables/useOriginalSource'
import type { PlaygroundCode } from '../composables/usePlaygroundDraft'
import { useStageInspector } from '../composables/useStageInspector'
import { useVersionDraft } from '../composables/useVersionDraft'
import { useVersionCopy } from '../composables/useVersionCopy'
import { useVersionCode } from '../composables/useVersionText'
import { refreshManifest } from '../../../../app/composables/useManifest'
import { requestJson } from '../../../../app/utils/studioRequest'
import {
  areaBoxes,
  boxModel,
  describeElement,
  spaceSize,
  type Box,
} from '../utils/boxes'
import {
  attributeAt,
  classConfig,
  classDials,
  elementRange,
  findElementSource,
  rewriteToken,
  tokenFor,
  type ElementTraits,
} from '../utils/classDials'
import {
  dialable,
  dialShows,
  dialsSignature,
  dialValue,
  fromDial,
  propsConfig,
  shownValue,
} from '../utils/dials'
import { GHOST_FOCUS, shortRevision } from '../utils/lab'
import {
  blockingProp,
  changeValue,
  controlFor,
  readValues,
  stageProps,
  writeQuery,
  type ControlValue,
} from '../utils/playground'
import {
  changesAddress,
  isMine,
  olderRevision,
  versionById,
} from '../utils/versions'

// Playground: the real component file on the stage, beside DialKit dials
// built from its props and seeded from its Default example, so it opens
// showing something and Reset comes back to that. Changed values live in
// the address, replaced rather than pushed so typing doesn't fill the
// history; what no longer fits a dial is dropped. A component without a
// component file, with props that can't be read, or with a required prop the
// panel can't fill says why instead. Escape in the stage brings the keyboard
// back to the dials.
// Hovering a dial shows on the stage what it changes. Inspect (on by
// default) selects an element on the stage: its box model, and the prop
// dials that change it. An app component's code sits beside the stage,
// locally and on the deployed site: the app's original, read-only, where
// Inspect jumps to the selected element's code. Other components, such as
// Nuxt UI's, have no code there: their only file is the system's catalog
// page around them. Locally, for someone registered, New version copies the
// original into their own versions and opens it (`?version=<view id>`):
// the stage shows the version in the original's frame, the dials add the
// props the version declares, and the editor edits it as a draft, with the
// selected element's class dials that rewrite it. On the deployed site a
// version opens read-only, with the text the build shipped for it.
const { component, system, stem, data, reload } = useLabComponent()
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const local = import.meta.dev
const manifest = await useManifest()
const { me } = useMe()
const toast = useStudioToast()
const versionsUrl = `${useRuntimeConfig().app.baseURL}_studio/modules/lab/versions`

// --- The version open ---

const versionId = computed(() =>
  typeof route.query.version === 'string' ? route.query.version : null,
)
const version = computed(() => {
  const found = versionId.value
    ? versionById(manifest.value, versionId.value)
    : null
  return found?.system === system.value.id &&
    found.component === component.value.slug
    ? found
    : null
})
const versionMissing = computed(() =>
  Boolean(versionId.value && !version.value),
)
const versionAddress = () =>
  version.value
    ? { prototype: version.value.prototype, artifact: version.value.id }
    : null
const versionCode = local
  ? useVersionDraft(versionAddress)
  : useVersionCode(versionAddress)
// The address keeps the open version beside the props' values.
const kept = (): Record<string, string> =>
  versionId.value ? { version: versionId.value } : {}

// The props the version declares that its frame doesn't come after the
// frame's own.
const propsDoc = computed(() => {
  const own = data.value?.props
  const added = version.value ? versionCode?.props.value : null
  if (!own || !added) return own ?? null
  const names = new Set(own.props.map(({ name }) => name))
  return {
    ...own,
    props: [
      ...own.props,
      ...added.props.filter(({ name }) => !names.has(name)),
    ],
  }
})

const controls = computed(() => {
  const loaded = data.value
  return (
    propsDoc.value?.props.map((prop) =>
      controlFor(prop, loaded?.seeds[prop.name]),
    ) ?? []
  )
})
const values = computed(() => readValues(controls.value, route.query))
const blocking = computed(() => blockingProp(controls.value, values.value))
const props = computed(() => stageProps(controls.value, values.value))
const editable = computed(() => controls.value.some(dialable))

const inspecting = ref(true)
const inspector = useStageInspector(inspecting)

function change(name: string, value: ControlValue | undefined) {
  const next = changeValue(controls.value, values.value, name, value)
  inspector.recordChangesFor(name)
  void router.replace({
    query: { ...kept(), ...writeQuery(controls.value, next) },
  })
}
const wasReset = ref(false)
function reset() {
  wasReset.value = true
  void router.replace({ query: kept() })
}
// A prop the component changed itself, such as a modal closed with Escape:
// its dial follows, as if the person had set it.
function update(name: string, value: unknown) {
  if (['string', 'number', 'boolean'].includes(typeof value))
    change(name, value as ControlValue)
}

// An address holding props the component lacks or values that don't fit is
// rewritten without them, so passing the link on doesn't carry them along.
watch(
  () => [propsDoc.value, route.query] as const,
  ([loaded, query]) => {
    // A version's own props come a moment later; the deployed site doesn't
    // know them.
    if (!loaded || (local && version.value && !versionCode.props.value)) return
    const clean: Record<string, string> = {
      ...kept(),
      ...writeQuery(controls.value, values.value),
    }
    const keys = Object.keys(query)
    const same =
      keys.length === Object.keys(clean).length &&
      keys.every((key) => query[key] === clean[key])
    if (!same) void router.replace({ query: clean })
  },
  { immediate: true },
)

// --- The code ---

const original = computed(() => data.value?.original ?? null)
const originalCode = useOriginalSource(() => original.value)
const draft = computed<PlaygroundCode>(() =>
  version.value && versionCode ? versionCode : originalCode,
)
const showsCode = computed(() => Boolean(original.value))

// New version: offered locally to someone registered, on the original.
const offersVersion = computed(
  () => local && Boolean(me.value.key) && !version.value && showsCode.value,
)
const creating = ref(false)
async function newVersion() {
  if (creating.value) return
  creating.value = true
  try {
    const created = await requestJson<{ artifact: string; path: string }>(
      versionsUrl,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          system: system.value.id,
          component: component.value.slug,
        }),
      },
    )
    await refreshManifest()
    toast.success(
      t('lab.versions.created', {
        name: created.path
          .split('/')
          .at(-1)!
          .replace(/\.vue$/, ''),
      }),
    )
    await router.push({ query: { version: created.artifact } })
  } catch (error) {
    toast.error(t('lab.versions.createFailed'), (error as Error).message)
  } finally {
    creating.value = false
  }
}
// Someone else's version, locally: Save as my version copies it into your
// own versions and opens the copy.
const offersCopy = computed(
  () =>
    local &&
    Boolean(me.value.key) &&
    Boolean(version.value) &&
    !isMine(version.value!, me.value),
)
const { copy, copying } = useVersionCopy()
async function saveAsMine() {
  const created = version.value ? await copy(version.value) : null
  if (created) await router.push({ query: { version: created.artifact } })
}
const older = computed(() =>
  version.value
    ? olderRevision(version.value, original.value?.revision ?? null)
    : false,
)
// What the editor holds, in words: the version's name (its file's, without
// the extension) and whose it is, or the app's original file.
const versionName = computed(() =>
  version.value ? draft.value.fileName().replace(/\.vue$/, '') : '',
)
const editorHeading = computed(() => {
  if (!version.value)
    return t('lab.editor.original', { file: draft.value.fileName() })
  if (!versionName.value) return undefined
  return t('lab.editor.version', {
    name: versionName.value,
    author: isMine(version.value, me.value)
      ? t('lab.editor.you')
      : (version.value.owner?.name ?? t('lab.versions.list.someone')),
  })
})
const revisionLabel = (revision: string | null) =>
  shortRevision(revision, t('lab.original.unknownRevision'))

function openOriginal() {
  void router.push({ query: writeQuery(controls.value, values.value) })
}

// --- Inspect: the selected element in the code ---

function traitsOf(element: Element): ElementTraits {
  const control = element.matches('button, a, [role="button"]')
  const iconHolder = control ? element.querySelector('[class*=":"]') : element
  const icon = [...(iconHolder?.classList ?? [])].find((name) =>
    /^i-[a-z0-9-]+:/.test(name),
  )
  return { classes: [...element.classList], control, icon }
}
function chainOf(element: Element) {
  const chain: ElementTraits[] = []
  for (
    let node: Element | null = element;
    node && node.tagName !== 'BODY';
    node = node.parentElement
  )
    chain.push(traitsOf(node))
  return chain
}

// A class dial's own rewrite keeps the selection on its attribute, even
// before the stage has re-rendered with the new class.
const pinned = ref<number | null>(null)
let rewriting = false
watch(inspector.selected, () => (pinned.value = null))
watch(
  () => draft.value.code.value,
  () => {
    if (!rewriting) pinned.value = null
  },
)

const source = computed(() => {
  void inspector.version.value
  const element = inspector.selected.value
  const code = showsCode.value ? draft.value.code.value : ''
  if (!element || !code) return null
  if (pinned.value !== null) {
    const attribute = attributeAt(code, pinned.value)
    if (attribute)
      return {
        depth: 0,
        attribute,
        block: elementRange(code, attribute.start),
      }
  }
  return findElementSource(code, chainOf(element))
})
const editorHighlight = computed(() => {
  const block = source.value?.block
  return block ? { from: block.start, to: block.end } : null
})

// --- Dials ---

const PROPS = 'props'
const ELEMENT = 'element'
const folders = computed(() => ({
  spacing: t('lab.playground.spacing'),
  radius: t('lab.playground.radius'),
  size: t('lab.playground.size'),
}))
// The selected element's own classes: only when it has a class attribute of
// its own, only locally, and only for someone who may change the system.
const elementDials = computed(() => {
  const found = source.value
  if (!draft.value.editable.value || !found?.attribute || found.depth !== 0)
    return []
  return classDials(found.attribute.tokens)
})

const panels = computed<DialPanel[]>(() => {
  const list: DialPanel[] = []
  if (editable.value)
    list.push({
      id: PROPS,
      name: t('lab.playground.props'),
      config: propsConfig(controls.value, values.value, {
        default: t('lab.playground.default'),
        choose: t('lab.playground.choose'),
      }),
      signature: `${component.value.slug}|${dialsSignature(controls.value)}`,
      help: Object.fromEntries(
        controls.value.filter(dialable).map((control) => [
          control.name,
          {
            name: control.name,
            text: [
              control.required ? t('lab.playground.required') : '',
              control.description,
            ]
              .filter(Boolean)
              .join(' · '),
          },
        ]),
      ),
    })
  const dials = elementDials.value
  if (dials.length)
    list.push({
      id: ELEMENT,
      name: t('lab.playground.element'),
      config: classConfig(dials, folders.value),
      // Its values change as it is dragged; only another element or another
      // set of classes rebuilds it.
      signature: `${source.value!.attribute!.start}|${dials.map((dial) => dial.key).join()}`,
    })
  return list
})

const dialPanels = useTemplateRef('dialPanels')

// DialKit follows the address: a value set elsewhere (Reset, a shared link,
// the component itself) moves its dial.
watch(
  [values, controls, () => panels.value.length],
  () => {
    const shown = dialPanels.value?.valuesOf(PROPS)
    if (!shown) return
    for (const control of controls.value.filter(dialable)) {
      const value = shownValue(control, values.value)
      if (!dialShows(control, shown[control.name], value))
        dialPanels.value!.setValue(
          PROPS,
          control.name,
          dialValue(control, value),
        )
    }
  },
  { flush: 'post' },
)

// DialKit's values by path, flat or in folders.
function valueAt(values: Record<string, unknown>, path: string): unknown {
  if (path in values) return values[path]
  return path
    .split('.')
    .reduce<unknown>(
      (node, key) => (node as Record<string, unknown> | undefined)?.[key],
      values,
    )
}

function dialsChanged(panel: string, dialed: Record<string, DialValue>) {
  wasReset.value = false
  if (panel === PROPS) {
    for (const control of controls.value.filter(dialable)) {
      const dial = valueAt(dialed, control.name)
      if (dialShows(control, dial, shownValue(control, values.value))) continue
      const read = fromDial(control, dial)
      if (read !== 'invalid') change(control.name, read)
    }
    return
  }
  const found = source.value
  const target = draft.value.code
  if (!found?.attribute) return
  let code = target.value
  let attribute = found.attribute
  for (const dial of elementDials.value) {
    const value = valueAt(dialed, `${folders.value[dial.folder]}.${dial.key}`)
    if (value === undefined) continue
    const token = tokenFor(dial, value as number | string)
    if (token === dial.token) continue
    code = rewriteToken(code, attribute, dial.token, token)
    attribute = attributeAt(code, attribute.start) ?? attribute
  }
  if (code === target.value) return
  pinned.value = found.attribute.start
  rewriting = true
  target.value = code
  void nextTick(() => (rewriting = false))
}

// --- What the stage shows over the component ---

const hovered = shallowRef<{ panel: string; paths: string[] } | null>(null)
function hover(panel: string | null, paths: string[]) {
  hovered.value = panel && paths.length ? { panel, paths } : null
}

// The elements a prop changes: those holding its text, then those that
// changed the last time it did, and otherwise the component's own roots.
function targetsOf(name: string, fallback: boolean) {
  const control = controls.value.find((entry) => entry.name === name)
  if (!control) return []
  const value = shownValue(control, values.value)
  const holding =
    control.kind === 'text' && typeof value === 'string'
      ? inspector.holdingText(value)
      : []
  const found = holding.length ? holding : inspector.changedBy(name)
  return found.length || !fallback ? found : inspector.roots()
}

const dialHighlight = computed<{ boxes: Box[]; label: string } | null>(() => {
  void inspector.version.value
  const current = hovered.value
  if (!current) return null
  if (current.panel === PROPS) {
    const [name] = current.paths
    const control = controls.value.find((entry) => entry.name === name)
    if (!control) return null
    const value = shownValue(control, values.value)
    const boxes = targetsOf(control.name, true).flatMap((element) =>
      areaBoxes(element, { kind: 'outline' }),
    )
    const said = value === undefined || value === '' ? '' : ` = ${value}`
    return boxes.length
      ? {
          boxes,
          label: `${t('lab.playground.props')} › ${control.name}${said}`,
        }
      : null
  }
  const element = inspector.selected.value
  if (!element) return null
  const dials = elementDials.value.filter((dial) =>
    current.paths.includes(`${folders.value[dial.folder]}.${dial.key}`),
  )
  const boxes = dials.flatMap((dial) => areaBoxes(element, dial.area))
  if (!boxes.length) return null
  const [first] = dials
  if (dials.length !== 1 || !first)
    return { boxes, label: folders.value[first!.folder] }
  const size = first.folder === 'spacing' ? spaceSize(boxes, first.area) : null
  return {
    boxes,
    label: `${folders.value[first.folder]} › ${first.key} = ${first.token}${size === null ? '' : ` · ${size}px`}`,
  }
})

const selection = computed(() => {
  void inspector.version.value
  const element = inspector.selected.value
  return element
    ? { boxes: boxModel(element), label: describeElement(element) }
    : null
})
const overlay = computed(() => ({
  boxes: [
    ...(selection.value?.boxes ?? []),
    ...(dialHighlight.value?.boxes ?? []),
    ...(inspector.hoverBox.value ? [inspector.hoverBox.value] : []),
  ],
  label: dialHighlight.value?.label ?? selection.value?.label ?? null,
}))

// The prop dials that change the selected element, or its nearest ancestor
// that one changes.
const marked = computed(() => {
  void inspector.version.value
  const element = inspector.selected.value
  if (!element) return []
  const dialed = controls.value.filter(dialable)
  for (
    let node: Element | null = element;
    node && node.tagName !== 'BODY';
    node = node.parentElement
  ) {
    const current = node
    const names = dialed
      .filter((control) => targetsOf(control.name, false).includes(current))
      .map((control) => `${PROPS}:${control.name}`)
    if (names.length) return names
  }
  return []
})

const announced = computed(() =>
  selection.value
    ? t('lab.playground.selected', { element: selection.value.label })
    : '',
)

useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  if (event.key === 'Escape' && inspector.selected.value) inspector.clear()
})

// The stage hands the keyboard back to the dial last used, or the first.
const panelColumn = useTemplateRef('panelColumn')
let lastUsed: HTMLElement | null = null
function remember(event: FocusEvent) {
  const target = event.target as HTMLElement
  if (target.closest('[data-lab-dial]')) lastUsed = target
}
function focusDials() {
  const target = lastUsed?.isConnected
    ? lastUsed
    : panelColumn.value?.querySelector<HTMLElement>(
        '[data-lab-dial] :is(textarea, button:not(:disabled), [role="slider"], [role="radio"][tabindex="0"])',
      )
  target?.focus()
}

// The deployed site can't make a version.
const originalClassDials = import.meta.dev
  ? 'lab.original.classDials'
  : 'lab.original.classDialsDeployed'

// The editor's width beside the stage, remembered by this browser.
const editorWidth = useLocalStorage('design-studio:lab-editor-width', 0)
</script>

<template>
  <i18n-t
    v-if="!component.playground"
    keypath="lab.playground.noComponent"
    tag="p"
    class="text-sm text-muted"
    scope="global"
  >
    <template #file>
      <code class="font-mono">{{ stem }}.vue</code>
    </template>
  </i18n-t>
  <div
    v-else-if="!propsDoc"
    role="alert"
    class="space-y-2 rounded-3xl border border-default p-4 text-sm"
  >
    <p class="text-default">
      {{ t('lab.playground.unreadable', { name: component.title }) }}
    </p>
    <p v-for="error in data?.errors" :key="error" class="text-muted">
      {{ error }}
    </p>
    <UButton
      size="sm"
      color="neutral"
      variant="outline"
      :label="t('lab.playground.tryAgain')"
      @click="reload"
    />
  </div>
  <div v-else class="space-y-3">
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <USwitch
        v-model="inspecting"
        size="sm"
        :label="t('lab.inspect.toggle')"
      />
      <p class="min-w-0 flex-1 text-xs text-muted">
        {{ t(showsCode ? 'lab.inspect.hint' : 'lab.inspect.hintNoCode') }}
      </p>
      <UButton
        v-if="inspector.selected.value"
        size="xs"
        color="neutral"
        variant="ghost"
        icon="i-lucide-x"
        :label="t('lab.inspect.clear')"
        @click="inspector.clear()"
      />
    </div>
    <p
      v-if="versionMissing"
      role="alert"
      class="rounded-3xl border border-default p-4 text-sm text-muted"
    >
      {{ t('lab.versions.missing') }}
    </p>
    <p
      v-if="older"
      role="note"
      class="flex gap-2 rounded-3xl border border-default p-4 text-sm text-default"
    >
      <UIcon
        name="i-lucide-triangle-alert"
        class="mt-0.5 size-4 shrink-0 text-warning"
      />
      {{
        t('lab.versions.older', {
          revision: revisionLabel(version?.revision ?? null),
          current: revisionLabel(original?.revision ?? null),
        })
      }}
    </p>
    <p role="status" class="sr-only">{{ announced }}</p>
    <div
      class="grid items-start gap-6"
      :class="
        showsCode
          ? 'lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[var(--editor-width)_auto_minmax(0,1fr)_18rem] xl:gap-x-3'
          : 'lg:grid-cols-[minmax(0,1fr)_18rem]'
      "
      :style="
        showsCode
          ? { '--editor-width': editorWidth ? `${editorWidth}px` : '40%' }
          : undefined
      "
    >
      <template v-if="showsCode">
        <!-- Beside the stage on wide screens; under it otherwise. -->
        <div
          class="order-last h-[28rem] min-w-0 lg:col-span-2 xl:sticky xl:top-4 xl:order-none xl:col-span-1 xl:h-[min(75vh,48rem)]"
        >
          <LabPlaygroundEditor
            :key="version?.id ?? 'original'"
            :draft="draft"
            :highlight="editorHighlight"
            :heading="editorHeading"
            :named="versionName || undefined"
          >
            <template v-if="offersVersion || version" #actions>
              <UButton
                v-if="offersVersion"
                size="xs"
                icon="i-lucide-git-branch-plus"
                :label="
                  t(creating ? 'lab.versions.creating' : 'lab.versions.new')
                "
                :loading="creating"
                @click="newVersion"
              />
              <template v-else-if="version">
                <UButton
                  v-if="offersCopy"
                  size="xs"
                  icon="i-lucide-git-branch-plus"
                  :label="t('lab.versions.saveAsMine')"
                  :loading="Boolean(copying)"
                  @click="saveAsMine"
                />
                <UButton
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-arrow-left"
                  :class="GHOST_FOCUS"
                  :label="t('lab.versions.original')"
                  @click="openOriginal"
                />
                <UButton
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-file-diff"
                  :class="GHOST_FOCUS"
                  :label="t('lab.changes.view')"
                  :to="changesAddress(system.id, component.slug, version.id)"
                />
              </template>
            </template>
            <template v-if="original && !version" #notice>
              <span class="mt-1 block font-mono wrap-anywhere">
                {{
                  t('lab.original.from', {
                    path: original.appPath ?? original.file,
                    revision: revisionLabel(original.revision),
                  })
                }}
              </span>
            </template>
          </LabPlaygroundEditor>
        </div>
        <LabEditorDivider
          v-model="editorWidth"
          class="hidden xl:flex"
          :label="t('lab.editor.resize')"
        />
      </template>
      <!-- The stage stays in view while the dials scroll: above them on
           narrow screens, beside them on wide ones. -->
      <div class="sticky top-0 z-10 min-w-0 bg-default pb-2 lg:top-4 lg:pb-0">
        <i18n-t
          v-if="blocking"
          :keypath="
            blocking.kind === 'code'
              ? 'lab.playground.codeOnly'
              : 'lab.playground.chooseFirst'
          "
          tag="p"
          role="status"
          class="rounded-3xl border border-dashed border-default p-4 text-sm text-muted"
          scope="global"
        >
          <template #name>{{ component.title }}</template>
          <template #prop>
            <code class="font-mono text-highlighted">{{ blocking.name }}</code>
          </template>
        </i18n-t>
        <Suspense v-else>
          <LabPlaygroundStage
            :key="version?.stage ?? component.playground"
            :system-id="system.id"
            :artifact="version?.stage ?? component.playground"
            :title="t('lab.playground.stage', { name: component.title })"
            :props="props"
            :boxes="overlay.boxes"
            :label="overlay.label"
            :version="inspector.version.value"
            @update="update"
            @escape="focusDials"
            @ready="inspector.attach"
          />
        </Suspense>
      </div>
      <section
        ref="panelColumn"
        aria-labelledby="lab-playground-props"
        class="relative min-w-0 space-y-3"
        @focusin="remember"
      >
        <!-- DialKit's panel shows the title; Reset sits in its header. -->
        <div
          class="flex items-center justify-between gap-2 px-1"
          :class="{ 'absolute end-2 top-2 z-10 px-0': panels.length }"
        >
          <h2
            id="lab-playground-props"
            class="text-sm font-semibold text-highlighted"
            :class="{ 'sr-only': panels.length }"
          >
            {{ t('lab.playground.props') }}
          </h2>
          <UButton
            v-if="editable"
            size="xs"
            color="neutral"
            variant="outline"
            icon="i-lucide-rotate-ccw"
            :label="t('lab.playground.reset')"
            :disabled="blocking?.kind === 'code'"
            @click="reset"
          />
        </div>
        <p role="status" class="sr-only">
          {{ wasReset ? t('lab.playground.resetDone') : '' }}
        </p>
        <p v-if="!controls.length" class="px-1 text-sm text-muted">
          {{ t('lab.playground.noProps') }}
        </p>
        <LabDialPanels
          v-if="panels.length"
          ref="dialPanels"
          :panels="panels"
          :marked="marked"
          :disabled="blocking?.kind === 'code'"
          @change="dialsChanged"
          @hover="hover"
        />
        <p
          v-if="showsCode && inspector.selected.value && !elementDials.length"
          class="px-1 text-xs text-muted"
        >
          {{
            draft.editable.value
              ? t('lab.playground.noClassDials', {
                  element: selection?.label.split(' · ')[0] ?? '',
                })
              : original
                ? t(originalClassDials)
                : t('lab.playground.elementReadOnly')
          }}
        </p>
        <LabPlaygroundCodeProps :controls="controls" />
      </section>
    </div>
  </div>
</template>
