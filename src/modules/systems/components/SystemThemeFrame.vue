<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { PREVIEW_ROUTE } from '../../../../tooling/preview/constants'
import type { PreviewShortcut } from '../../../../tooling/preview/protocol'
import {
  isThemeDocumentMessage,
  THEME_CHANNEL,
  THEME_QUERY,
  THEME_VERSION,
  type SpecimenLabels,
  type SpecimenToken,
  type ThemeHostMessage,
} from '../../../../tooling/preview/theme'
import type {
  SystemCatalog,
  ThemeToken,
  TokenGroup,
} from '../../../../tooling/systems/catalog'

// One theme page's tokens, drawn and measured inside the system's own
// preview document, so samples and values use the system's stylesheet,
// fonts and colour modes. The frame stays while the person moves between
// theme pages and grows to fit what it shows; the studio sends it the
// tokens again when the stylesheet changes.
const props = defineProps<{ system: SystemCatalog; group: TokenGroup }>()
const { t, te } = useI18n()

const session = Math.random().toString(36).slice(2, 12)
const src = `${useRuntimeConfig().app.baseURL}${PREVIEW_ROUTE}${props.system.id}/?${THEME_QUERY}&session=${session}`
const frame = useTemplateRef<HTMLIFrameElement>('frame')
const height = ref(0)
const ready = ref(false)

// The keys each shortcut is pressed with, as the studio's handlers read it.
const SHORTCUT_KEYS: Partial<Record<PreviewShortcut, { key: string }>> = {
  source: { key: "'" },
}

function role(token: ThemeToken) {
  const key = `systems.theme.roles.${token.name.slice(2)}`
  if (te(key)) return t(key)
  if (token.section === 'actions')
    return t('systems.theme.colorRole', { name: token.name.slice(5) })
  return null
}

const tokens = computed<SpecimenToken[]>(() =>
  props.system.tokens
    .filter((token) => token.group === props.group)
    .map((token) => ({
      name: token.name,
      value: token.value,
      group: token.group,
      heading: token.section ?? token.ramp,
      role: role(token),
      utility: token.utility,
    })),
)

const labels = computed<SpecimenLabels>(() => ({
  notSet: t('systems.theme.notSet'),
  pangram: t('systems.theme.pangram'),
  sample: t('systems.theme.sample'),
  families: t('systems.theme.families'),
  sizes: t('systems.theme.sizes'),
  weights: t('systems.theme.weights'),
  other: t('systems.theme.other'),
  spacing: t('systems.theme.spacing'),
  containers: t('systems.theme.containers'),
  containersNote: t('systems.theme.containersNote'),
  noSizes: t('systems.theme.noSizes'),
  noWeights: t('systems.theme.noWeights'),
  otherColors: t('systems.theme.otherColors'),
  sections: Object.fromEntries(
    ['text', 'surfaces', 'borders', 'actions'].map((section) => [
      section,
      t(`systems.theme.sections.${section}`),
    ]),
  ),
}))

function show() {
  const target = frame.value?.contentWindow
  if (!target || !ready.value) return
  const message: ThemeHostMessage = {
    channel: THEME_CHANNEL,
    version: THEME_VERSION,
    session,
    kind: 'show',
    page: props.group,
    // Plain copies: the catalog is reactive.
    tokens: JSON.parse(JSON.stringify(tokens.value)),
    labels: JSON.parse(JSON.stringify(labels.value)),
  }
  target.postMessage(message, location.origin)
}

watch([tokens, labels, () => props.group], show)

useEventListener(window, 'message', (event: MessageEvent) => {
  if (
    event.origin !== location.origin ||
    event.source !== frame.value?.contentWindow ||
    !isThemeDocumentMessage(event.data, session)
  )
    return
  const message = event.data
  if (message.kind === 'ready') {
    ready.value = true
    show()
  } else if (message.kind === 'size') height.value = message.height
  else if (message.kind === 'shortcut') {
    // The studio's own handlers decide, as if pressed here.
    const key = SHORTCUT_KEYS[message.action]
    if (key)
      window.dispatchEvent(
        new KeyboardEvent('keydown', { ...key, ctrlKey: true, bubbles: true }),
      )
  }
})
</script>

<template>
  <iframe
    ref="frame"
    data-theme-frame
    :src="src"
    :title="
      t('systems.theme.frame', {
        page: t(`systems.pages.${group}`),
        name: system.label,
      })
    "
    class="block w-full rounded-lg border border-default"
    :style="{ height: height ? `${height}px` : '24rem' }"
  />
</template>
