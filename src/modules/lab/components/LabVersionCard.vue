<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { useResizeObserver } from '@vueuse/core'
import {
  refreshManifest,
  type ManifestArtifact,
} from '../../../../app/composables/useManifest'
import { formatDate } from '../../../../app/utils/dates'
import { afterMenuCloses, menuGroups } from '../../../../app/utils/menus'
import { requestJson } from '../../../../app/utils/studioRequest'
import SystemPreview from '../../systems/components/SystemPreview.vue'
import {
  changesAddress,
  isMine,
  mayChangeVersion,
  olderRevision,
  type LabVersion,
} from '../utils/versions'
import { GHOST_FOCUS, labAddress, shortRevision } from '../utils/lab'

// One version in the Versions tab: its name, whose it is and when it last
// changed, a live preview of its stage, and links to open it in the
// Playground and to its Changes. Locally, someone registered can Save as my
// version on someone else's; whoever may change it can rename, duplicate
// and delete it through the file service. A version made against an older
// revision of the app than its original's says so. The preview is a picture,
// scaled to fit its box: it takes no keyboard focus and opens the version
// when clicked. After Rename the keyboard comes back to the card's "…"; after
// Delete the list decides where it goes (`removing`).
const props = defineProps<{
  systemId: string
  slug: string
  version: LabVersion
  /** Its view in the manifest; undefined until its prototype's list loads. */
  artifact?: ManifestArtifact | null
  /** When its file last changed (`YYYY-MM-DD`), locally. */
  changed?: string
  /** The original's revision now. */
  revision: string | null
  /** A copy of this version is being made. */
  copying: boolean
}>()
const emit = defineEmits<{
  copy: [mine: boolean]
  removing: [deleted: Promise<unknown>]
}>()
const { t } = useI18n()
const toast = useStudioToast()
const { me } = useMe()
// Only the dev server has the route; the static build never names it.
const versionsUrl = import.meta.dev
  ? `${useRuntimeConfig().app.baseURL}_studio/modules/lab/versions`
  : ''

const name = computed(
  () => props.artifact?.title ?? props.artifact?.path ?? props.version.id,
)
const mine = computed(() => isMine(props.version, me.value))
const changeable = computed(() => mayChangeVersion(props.version, me.value))
const offersCopy = computed(
  () => import.meta.dev && Boolean(me.value.key) && !mine.value,
)
const older = computed(() => olderRevision(props.version, props.revision))
const revisionLabel = (revision: string | null) =>
  shortRevision(revision, t('lab.original.unknownRevision'))
const playground = computed(
  () =>
    `${labAddress(props.systemId, props.slug, 'playground')}?version=${props.version.id}`,
)
/** Its file inside its prototype, as the file service names it. */
const file = computed(() =>
  props.artifact
    ? props.artifact.file.slice(props.version.home.folder.length + 1)
    : null,
)

// The dialogs exist only while the studio runs locally.
const overlay = import.meta.dev ? useOverlay() : undefined
const renameModal = import.meta.dev
  ? overlay!.create(
      defineAsyncComponent(() => import('./LabVersionRenameModal.vue')),
    )
  : undefined
const deleteModal = import.meta.dev
  ? overlay!.create(
      defineAsyncComponent(
        () => import('../../../../app/components/files/FileDeleteModal.vue'),
      ),
    )
  : undefined
const failed = (message: string) => toast.error(t('actions.failed'), message)
const trash = () =>
  /Win/.test(navigator.userAgent)
    ? ('recycle-bin' as const)
    : ('trash' as const)

const more = useTemplateRef('more')
// The dialog hands focus back to the menu item it came from, which is gone.
function focusMore() {
  setTimeout(() => (more.value?.$el as HTMLElement | undefined)?.focus(), 0)
}

async function rename() {
  if (!file.value) return
  await renameModal!.open({
    prototype: props.version.prototype,
    path: file.value,
    name: props.artifact?.path.split('/').at(-1) ?? name.value,
  }).result
  focusMore()
}

async function remove() {
  if (!file.value) return
  const confirmed = await deleteModal!.open({
    name: name.value,
    folder: false,
    hidden: [],
    trash: trash(),
  }).result
  if (!confirmed) return focusMore()
  // The Lab's own delete also takes the "<Component> versions" prototype
  // when this was the last version in it.
  const deleted = requestJson<{
    trashedTo: 'recycle-bin' | 'trash'
    prototypeRemoved: boolean
  }>(versionsUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'delete',
      prototype: props.version.prototype,
      artifact: props.version.id,
    }),
  })
  // Told before the reply: the manifest can drop this card first, and an
  // unmounted card's events never arrive.
  emit('removing', deleted)
  const reply = await deleted
  await refreshManifest()
  toast.success(
    t('files.deleted', {
      name: name.value,
      place: t(`files.trash.${reply.trashedTo}`),
    }),
  )
}

// The preview renders at the width that fits its content into the box's
// height, then is scaled down to the box. It only ever shrinks, so a
// component whose height follows its width can't make it flip back and forth.
const PREVIEW_HEIGHT = 384
const picture = useTemplateRef('picture')
const scale = ref(1)
const natural = ref(0)
useResizeObserver(picture, ([entry]) => {
  const height = (entry!.target as HTMLElement).offsetHeight
  natural.value = height
  if (height * scale.value > PREVIEW_HEIGHT)
    scale.value = Math.max(0.25, PREVIEW_HEIGHT / height)
})

const menu = computed<DropdownMenuItem[][]>(() =>
  menuGroups<DropdownMenuItem>([
    [
      {
        label: t('lab.versions.list.openPrototype'),
        icon: 'i-lucide-folder-open',
        to: `/prototypes/${props.version.prototype}/artifacts/${props.version.id}`,
      },
    ],
    [
      changeable.value &&
        Boolean(file.value) && {
          label: t('lab.versions.list.rename'),
          icon: 'i-lucide-pencil',
          onSelect: afterMenuCloses(rename, failed),
        },
      changeable.value && {
        label: t('lab.versions.list.duplicate'),
        icon: 'i-lucide-copy',
        onSelect: afterMenuCloses(() => emit('copy', true), failed),
      },
    ],
    [
      changeable.value &&
        Boolean(file.value) && {
          label: t('lab.versions.list.delete'),
          icon: 'i-lucide-trash-2',
          color: 'error' as const,
          onSelect: afterMenuCloses(remove, failed),
        },
    ],
  ]),
)
</script>

<template>
  <article
    data-lab-version
    :aria-labelledby="`lab-version-${version.id}`"
    class="flex min-w-0 flex-col gap-3 rounded-3xl border border-default p-4"
  >
    <header class="flex min-w-0 items-start gap-2">
      <div class="min-w-0 flex-1">
        <h3
          :id="`lab-version-${version.id}`"
          class="truncate text-sm font-semibold text-highlighted"
        >
          <ULink :to="playground" class="hover:underline">{{ name }}</ULink>
        </h3>
        <p class="mt-0.5 text-xs text-muted">
          {{
            [
              mine
                ? t('lab.versions.list.byYou')
                : t('lab.versions.list.by', {
                    name: version.owner?.name ?? t('lab.versions.list.someone'),
                  }),
              changed
                ? t('lab.versions.list.changed', { date: formatDate(changed) })
                : '',
            ]
              .filter(Boolean)
              .join(' · ')
          }}
        </p>
      </div>
      <UBadge
        v-if="!changeable"
        size="sm"
        color="neutral"
        variant="subtle"
        :label="t('lab.versions.list.readOnly')"
      />
      <UDropdownMenu :items="menu">
        <UButton
          ref="more"
          data-lab-version-more
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-ellipsis"
          :class="GHOST_FOCUS"
          :aria-label="t('lab.versions.list.more', { name })"
        />
      </UDropdownMenu>
    </header>
    <p
      v-if="older"
      role="note"
      class="flex gap-2 rounded-2xl bg-elevated px-3 py-2 text-xs text-default"
    >
      <UIcon
        name="i-lucide-triangle-alert"
        class="mt-0.5 size-3.5 shrink-0 text-warning"
      />
      {{
        t('lab.versions.older', {
          revision: revisionLabel(version.revision),
          current: revisionLabel(revision),
        })
      }}
    </p>
    <div
      class="relative overflow-hidden rounded-2xl"
      :style="{
        height: natural ? `${Math.ceil(natural * scale)}px` : undefined,
      }"
    >
      <div
        ref="picture"
        inert
        class="origin-top-left"
        :style="{ width: `${100 / scale}%`, transform: `scale(${scale})` }"
      >
        <SystemPreview
          :system-id="systemId"
          :artifact="version.stage"
          :title="t('lab.versions.list.preview', { name })"
        />
      </div>
      <!-- The whole picture opens the version; the keyboard has the links. -->
      <ULink
        :to="playground"
        tabindex="-1"
        aria-hidden="true"
        class="absolute inset-0 rounded-2xl ring-primary/40 ring-inset hover:ring-2"
      />
    </div>
    <footer class="flex flex-wrap items-center gap-2">
      <UButton
        size="xs"
        icon="i-lucide-flask-conical"
        :to="playground"
        :label="t('lab.versions.list.open')"
      />
      <UButton
        size="xs"
        color="neutral"
        variant="outline"
        icon="i-lucide-diff"
        :to="changesAddress(systemId, slug, version.id)"
        :label="t('lab.versions.list.changes')"
      />
      <UButton
        v-if="offersCopy"
        size="xs"
        color="neutral"
        variant="outline"
        icon="i-lucide-git-branch-plus"
        :loading="copying"
        :label="t('lab.versions.saveAsMine')"
        @click="emit('copy', false)"
      />
    </footer>
  </article>
</template>
