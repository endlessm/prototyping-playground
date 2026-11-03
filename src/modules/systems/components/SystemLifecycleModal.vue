<script setup lang="ts">
import { restartHandoff } from '../../../../app/utils/restartHandoff'
import { deletedSystem } from '../utils/destination'

// Archiving, restoring or deleting a system. The dialog first asks the dev
// server to check the change (who it touches, whether another program
// holds the folder) and keeps its button off until the check passes. The
// default system can't be archived or deleted. Once confirmed, the studio
// restarts behind the status screen: archiving and deleting land on the
// collection, restoring stays on the page, and the confirmation shows after
// the reload. A failure returns here with its message. Opened through
// useOverlay.
type Operation = 'archive' | 'restore' | 'delete'
interface Dependent {
  id: string
  title: string
  archived: boolean
  pending: boolean
  /** Assigned to the system, rather than waiting to be rebuilt with it. */
  uses: boolean
}
const props = defineProps<{
  operation: Operation
  system: { id: string; label: string }
  isDefault: boolean
  dependents: Dependent[]
}>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const base = useRuntimeConfig().app.baseURL
const route = `${base}_studio/files/systems`
const name = props.system.label
const handoff = restartHandoff()

const blocked = props.operation !== 'restore' && props.isDefault
const checking = ref(!blocked)
const allowed = ref(false)
const busy = ref(false)
const failure = ref('')

const post = (body: Record<string, unknown>) =>
  requestJson(route, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system: props.system.id, ...body }),
  })

onMounted(async () => {
  if (blocked) return
  try {
    await post({ op: `${props.operation}-check` })
    allowed.value = true
  } catch (error) {
    failure.value = (error as Error).message
  } finally {
    checking.value = false
  }
})

/** The active prototypes archiving takes along. */
const archives = computed(() =>
  props.dependents.filter(({ uses, archived }) => uses && !archived),
)

const TOASTS: Record<Operation, string> = {
  archive: 'systems.toasts.archived',
  restore: 'systems.toasts.restored',
  delete: 'systems.toasts.deleted',
}

async function confirm(restorePrototypes = false) {
  if (busy.value) return
  busy.value = true
  failure.value = ''
  const previous = location.href
  handoff?.start({
    kind: 'system',
    title: t(`systems.transition.titles.${props.operation}`, { name }),
    description: t(`systems.transition.descriptions.${props.operation}`),
    // A deletion finishes once the collection no longer lists the system.
    destination:
      props.operation === 'delete' ? deletedSystem(props.system.id) : false,
  })
  // The restart reloads the page: archiving and deleting land on the
  // collection, never on a page that is going away.
  if (props.operation !== 'restore')
    history.replaceState(history.state, '', `${base}systems`)
  try {
    await post({ op: props.operation, restorePrototypes })
    handoff?.update({ confirmation: t(TOASTS[props.operation]) })
  } catch (error) {
    history.replaceState(history.state, '', previous)
    handoff?.cancel()
    failure.value = (error as Error).message
    busy.value = false
  }
}

const title = computed(() =>
  blocked
    ? props.operation === 'archive'
      ? t('systems.archiveDialog.defaultTitle', { name })
      : t('systems.deleteDialog.defaultTitle', { name })
    : t(`systems.${props.operation}Dialog.title`, { name }),
)
const description = computed(() => {
  if (blocked)
    return props.operation === 'archive'
      ? t('systems.archiveDialog.defaultDescription', { name })
      : t('systems.deleteDialog.defaultDescription', { name })
  if (props.operation === 'delete') return t('systems.deleteDialog.description')
  return t(`systems.${props.operation}Dialog.description`)
})
</script>

<template>
  <UModal
    :title="title"
    :description="description"
    :dismissible="!busy"
    :close="!busy"
    :ui="{ content: operation === 'restore' ? 'sm:max-w-xl' : undefined }"
    @update:open="(open: boolean) => !open && emit('close')"
  >
    <template v-if="!blocked" #body>
      <div class="space-y-3 text-sm">
        <p
          v-if="operation === 'delete' && dependents.length"
          class="text-muted"
        >
          {{ t('systems.deleteDialog.dependents') }}
        </p>
        <p v-if="checking" role="status" class="text-muted">
          {{
            operation === 'archive'
              ? t('systems.archiveDialog.checking')
              : t(`systems.${operation}Dialog.checking`)
          }}
        </p>
        <p v-if="failure" role="alert" class="whitespace-pre-line text-error">
          {{ failure }}
        </p>
        <div
          v-if="operation === 'archive' && archives.length"
          class="grid gap-2"
        >
          <p class="font-medium text-highlighted">
            {{ t('systems.archiveDialog.alsoArchives', archives.length) }}
          </p>
          <ul class="max-h-48 list-disc overflow-auto pl-5">
            <li v-for="prototype in archives" :key="prototype.id">
              <ULink
                :to="`/prototypes/${prototype.id}`"
                class="underline"
                @click="emit('close')"
              >
                {{ prototype.title }}
              </ULink>
            </li>
          </ul>
        </div>
        <div
          v-if="operation === 'delete' && dependents.length"
          class="grid gap-2"
        >
          <p>{{ t('systems.deleteDialog.depend', { name }) }}</p>
          <ul class="max-h-48 list-disc overflow-auto pl-5">
            <li v-for="prototype in dependents" :key="prototype.id">
              <ULink
                :to="`/prototypes/${prototype.id}`"
                class="underline"
                @click="emit('close')"
              >
                {{ prototype.title }}
              </ULink>
              <template v-if="prototype.archived">
                {{ ` ${t('systems.deleteDialog.archived')}` }}
              </template>
              <template v-if="prototype.pending">
                {{ ` ${t('systems.deleteDialog.pending')}` }}
              </template>
            </li>
          </ul>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <template v-if="blocked">
          <UButton
            color="neutral"
            variant="outline"
            :label="t('systems.archiveDialog.close')"
            @click="emit('close')"
          />
        </template>
        <template v-else-if="operation === 'restore'">
          <UButton
            color="neutral"
            variant="outline"
            :disabled="busy || checking || !allowed"
            :label="t('systems.restoreDialog.systemOnly')"
            @click="confirm(false)"
          />
          <UButton
            :disabled="busy || checking || !allowed"
            :loading="busy"
            :label="
              busy
                ? t('systems.restoreDialog.working')
                : t('systems.restoreDialog.withPrototypes')
            "
            @click="confirm(true)"
          />
        </template>
        <template v-else>
          <UButton
            color="neutral"
            variant="outline"
            :disabled="busy"
            :label="t('systems.archiveDialog.cancel')"
            @click="emit('close')"
          />
          <UButton
            :color="operation === 'delete' ? 'error' : 'primary'"
            :disabled="busy || checking || !allowed"
            :loading="busy"
            :label="
              busy
                ? t(`systems.${operation}Dialog.working`)
                : t(`systems.${operation}Dialog.confirm`)
            "
            @click="confirm()"
          />
        </template>
      </div>
    </template>
  </UModal>
</template>
