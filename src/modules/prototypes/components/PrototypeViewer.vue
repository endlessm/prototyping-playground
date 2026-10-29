<script setup lang="ts">
import types from '#studio/file-types'
import type { ContextMenuItem, NavigationMenuItem } from '@nuxt/ui'
import AppNotFound from '../../../../app/components/AppNotFound.vue'
import AppSectionNav from '../../../../app/components/AppSectionNav.vue'
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../../../app/composables/useManifest'

// A prototype's frame: its navigation in the section panel, and the open
// artifact beside it. A view's named states are listed under it, each
// opening at its own address. An unknown prototype, or an unknown artifact
// in a known one, is not found; the prototype keeps its navigation around
// it. Locally, a row's context menu switches a view to lo-fi and back in
// your own prototypes (any, for an Admin).
const props = defineProps<{
  prototype: ManifestPrototype | undefined
  artifacts: ManifestArtifact[]
  notFound?: boolean
}>()

const { t } = useI18n()
const { systemOf } = await useSystems()
const { me } = useMe()
const toast = useStudioToast()
const base = useRuntimeConfig().app.baseURL

const system = computed(() => {
  if (!props.prototype) return ''
  const found = systemOf(props.prototype.systemId)
  if (found === null) return t('prototypes.noSystem')
  return found ? found.label : t('prototypes.systemUnavailable')
})

const address = (id: string) =>
  `/prototypes/${props.prototype!.id}/artifacts/${id}`
const items = computed<NavigationMenuItem[]>(() =>
  props.artifacts.map((artifact) => ({
    label: artifact.title,
    to: address(artifact.id),
    ...(artifact.states?.length && {
      defaultOpen: true,
      children: artifact.states.map((state) => ({
        label: state.title,
        to: address(state.id),
      })),
    }),
  })),
)

const editable = computed(
  () =>
    import.meta.dev &&
    Boolean(props.prototype) &&
    (me.value.role === 'admin' ||
      me.value.key === props.prototype!.contributor),
)

// The row the menu opened on.
const target = shallowRef<ManifestArtifact>()
const menuOf = (artifact: ManifestArtifact | undefined): ContextMenuItem[] =>
  artifact && types[artifact.type]?.fidelity
    ? [
        {
          label: artifact.lofi
            ? t('prototypes.makeHifi')
            : t('prototypes.makeLofi'),
          icon: 'i-lucide-paintbrush',
          onSelect: () => setLofi(artifact, !artifact.lofi),
        },
      ]
    : []
const menu = computed(() => menuOf(target.value))

// Before the menu opens: a row with nothing to offer keeps the browser's.
function pick(event: MouseEvent) {
  const href = (event.target as Element | null)
    ?.closest('a[href]')
    ?.getAttribute('href')
  const artifact = props.artifacts.find(
    ({ id }) => href?.endsWith(`/artifacts/${id}`) ?? false,
  )
  if (!menuOf(artifact).length) {
    event.stopPropagation()
    return
  }
  target.value = artifact
}

async function setLofi(artifact: ManifestArtifact, lofi: boolean) {
  try {
    await requestJson(`${base}_studio/fidelity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artifact: artifact.id, lofi }),
    })
  } catch (error) {
    toast.error((error as Error).message)
  }
}
</script>

<template>
  <AppSectionNav v-if="prototype" :label="prototype.title">
    <template #header>
      <div class="flex min-w-0 flex-col gap-0.5">
        <h1 class="truncate text-sm font-semibold text-highlighted">
          {{ prototype.title }}
        </h1>
        <p class="truncate text-xs text-muted">
          {{ t('prototypes.system', { name: system }) }}
        </p>
      </div>
    </template>
    <UContextMenu :items="menu" :disabled="!editable">
      <div @contextmenu.capture="editable && pick($event)">
        <UNavigationMenu
          :items="items"
          orientation="vertical"
          :aria-label="prototype.title"
        />
      </div>
    </UContextMenu>
  </AppSectionNav>
  <UDashboardPanel id="prototype-artifact">
    <template #body>
      <AppNotFound v-if="!prototype || notFound" />
      <slot v-else />
    </template>
  </UDashboardPanel>
</template>
