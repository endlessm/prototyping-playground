<script setup lang="ts">
import { requestJson } from '../../../../app/utils/studioRequest'
import SourceDiscardModal from '../../../../app/components/source/SourceDiscardModal.vue'
import ContributorsProfileModal from '../components/ContributorsProfileModal.vue'

interface Person {
  key: string
  studioId: string
  name: string
  github: string
  you: boolean
  email?: string
  emails?: string[]
  revision?: string
}
interface Permissions {
  revision: string
  config: { admins: string[]; systemMaintainers: Record<string, string[]> }
  systems: { key: string; studioId: string | null; status: string }[]
  role: string | null
}
const { t } = useI18n()
const studio = useStudioConfig()
useHead({ title: () => `${t('people.title')} — ${studio.name}` })
const base = useRuntimeConfig().app.baseURL
const people = ref<Person[]>([])
const saved = ref<Permissions>()
const admins = ref<string[]>([])
const maintainers = ref<Record<string, string[]>>({})
const error = ref('')
const busy = ref(false)
const restarted = ref(false)
const toast = useStudioToast()
const overlay = useOverlay()
const discard = overlay.create(SourceDiscardModal)
const profileModal = overlay.create(ContributorsProfileModal)
const dirty = computed(
  () =>
    !!saved.value &&
    JSON.stringify([admins.value, maintainers.value]) !==
      JSON.stringify([
        saved.value.config.admins,
        saved.value.config.systemMaintainers,
      ]),
)
const canEdit = computed(() => saved.value?.role === 'admin')
const systems = computed(
  () =>
    saved.value?.systems.filter(
      (system) => system.status === 'active' && system.studioId,
    ) ?? [],
)
function reset() {
  admins.value = [...(saved.value?.config.admins ?? [])]
  maintainers.value = JSON.parse(
    JSON.stringify(saved.value?.config.systemMaintainers ?? {}),
  )
}
async function load() {
  error.value = ''
  try {
    const [directory, permissions] = await Promise.all([
      requestJson<{ people: Person[] }>(`${base}_studio/people`),
      requestJson<Permissions>(`${base}_studio/settings`),
    ])
    people.value = directory.people
    saved.value = permissions
    reset()
  } catch (cause) {
    error.value = (cause as Error).message
  }
}
async function reload() {
  if (!dirty.value || (await discard.open({ path: t('people.title') }).result))
    await load()
}
function grant(list: string[], id: string, checked: boolean) {
  return checked
    ? [...new Set([...list, id])]
    : list.filter((value) => value !== id)
}
async function save() {
  busy.value = true
  error.value = ''
  try {
    await requestJson(`${base}_studio/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        revision: saved.value!.revision,
        changes: { admins: admins.value, systemMaintainers: maintainers.value },
      }),
    })
    saved.value!.config = {
      admins: [...admins.value],
      systemMaintainers: JSON.parse(JSON.stringify(maintainers.value)),
    }
    toast.success(t('people.saved'))
    restarted.value = true
  } catch (cause) {
    error.value = (cause as Error).message
  } finally {
    busy.value = false
  }
}
async function edit(person: Person) {
  if (await profileModal.open({ person }).result) {
    if (!dirty.value) await load()
    else {
      const directory = await requestJson<{ people: Person[] }>(
        `${base}_studio/people`,
      )
      people.value = directory.people
    }
  }
}
onBeforeRouteLeave(
  async () =>
    !dirty.value ||
    Boolean(await discard.open({ path: t('people.title') }).result),
)
useEventListener(window, 'beforeunload', (event: BeforeUnloadEvent) => {
  if (dirty.value) event.preventDefault()
})
onMounted(load)
// Keep clean pages current without replacing a person's unsaved draft.
async function refresh() {
  if (!dirty.value && !busy.value && !restarted.value) await load()
}
onMounted(() => {
  import.meta.hot?.on('studio:identity', refresh)
  import.meta.hot?.on('vite:ws:connect', refresh)
})
onScopeDispose(() => {
  import.meta.hot?.off('studio:identity', refresh)
  import.meta.hot?.off('vite:ws:connect', refresh)
})
</script>

<template>
  <UDashboardPanel id="contributors">
    <template #body>
      <div class="mx-auto w-full max-w-4xl space-y-6 px-2 py-10">
        <h1 class="text-2xl font-semibold">{{ t('people.title') }}</h1>
        <UAlert
          v-if="restarted"
          :title="t('people.restartTitle')"
          :description="t('people.restartDescription')"
          icon="i-lucide-refresh-cw"
        />
        <template v-else>
          <p v-if="!saved && !error" role="status" class="text-sm text-muted">
            {{ t('people.loading') }}
          </p>
          <p class="text-muted">{{ t('people.shared') }}</p>
          <UAlert
            v-if="error"
            color="error"
            :title="error"
            :actions="[{ label: t('people.reload'), onClick: reload }]"
          />
          <p v-if="saved && !canEdit" class="text-muted">
            {{
              t(
                people.some((person) => person.you)
                  ? 'people.readonly'
                  : 'people.register',
              )
            }}
          </p>
          <UForm
            :state="{ admins, maintainers }"
            class="space-y-6"
            @submit="save"
          >
            <section
              v-for="person in people"
              :key="person.studioId"
              class="space-y-3 rounded-lg border border-default p-4"
              :aria-label="person.name"
            >
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <NuxtLink
                    :to="{
                      path: '/prototypes',
                      query: { contributor: person.key },
                    }"
                    class="font-semibold text-highlighted hover:underline"
                    >{{ person.name }}</NuxtLink
                  >
                  <UBadge v-if="person.you" class="ml-2" variant="subtle">{{
                    t('people.you')
                  }}</UBadge>
                  <p class="text-sm text-muted">
                    {{ person.key }}
                    <span v-if="person.github">@{{ person.github }}</span>
                  </p>
                </div>
                <UButton
                  v-if="person.revision"
                  :label="t('people.edit')"
                  variant="outline"
                  @click="edit(person)"
                />
              </div>
              <UCheckbox
                :label="t('people.admin')"
                :model-value="admins.includes(person.studioId)"
                :disabled="
                  !canEdit ||
                  busy ||
                  (admins.includes(person.studioId) && admins.length === 1)
                "
                @update:model-value="
                  (value) =>
                    (admins = grant(admins, person.studioId, value === true))
                "
              />
              <p
                v-if="admins.includes(person.studioId)"
                class="text-sm text-muted"
              >
                {{ t('people.fullAccess') }}
              </p>
              <div v-else class="flex flex-wrap gap-4">
                <UCheckbox
                  v-for="system in systems"
                  :key="system.key"
                  :label="t('people.maintainer', { system: system.key })"
                  :model-value="
                    (maintainers[system.studioId!] ?? []).includes(
                      person.studioId,
                    )
                  "
                  :disabled="!canEdit || busy"
                  @update:model-value="
                    (value) =>
                      (maintainers[system.studioId!] = grant(
                        maintainers[system.studioId!] ?? [],
                        person.studioId,
                        value === true,
                      ))
                  "
                />
              </div>
            </section>
            <div v-if="canEdit" class="flex justify-end gap-2">
              <UButton
                :label="t('people.discard')"
                variant="outline"
                :disabled="!dirty || busy"
                @click="reset"
              />
              <UButton
                :label="t('people.save')"
                :loading="busy"
                :disabled="!dirty"
                type="submit"
              />
            </div>
          </UForm>
          <section class="space-y-3 text-sm">
            <h2 class="text-lg font-semibold">{{ t('people.levels') }}</h2>
            <p>{{ t('people.contributorAccess') }}</p>
            <p>{{ t('people.maintainerAccess') }}</p>
            <p>{{ t('people.adminAccess') }}</p>
            <p class="text-muted">{{ t('people.repository') }}</p>
          </section>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
