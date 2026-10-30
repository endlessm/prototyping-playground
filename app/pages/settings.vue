<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import AppNotFound from '../components/AppNotFound.vue'
import SettingsDiscardModal from '../components/settings/SettingsDiscardModal.vue'

interface SettingsData {
  config: Record<string, unknown>
  revision: string
  instance: string
  role: 'admin' | 'contributor' | null
  adminProblem?: string | null
  systems: { key: string; studioId: string | null; status: string }[]
  modules: {
    id: string
    label: string
    description: string
    enabled: boolean
    required: boolean
  }[]
}
const { t } = useI18n()
const studio = useStudioConfig()
const local = import.meta.dev
const url = `${useRuntimeConfig().app.baseURL}_studio/settings`
const data = shallowRef<SettingsData>()
const draft = reactive({
  name: '',
  tagline: '',
  defaultSystem: 'none',
  modules: {} as Record<string, boolean>,
})
const failure = ref('')
const conflict = ref(false)
const saving = ref(false)
const loading = ref(false)
const restarting = ref(false)
const modal = useOverlay().create(SettingsDiscardModal)
const changes = computed(() =>
  Object.fromEntries(
    Object.entries(draft).filter(
      ([key, value]) =>
        JSON.stringify(value) !==
        JSON.stringify(
          key === 'defaultSystem'
            ? (data.value?.config[key] ?? 'none')
            : data.value?.config[key],
        ),
    ),
  ),
)
const dirty = computed(
  () => !!data.value && Object.keys(changes.value).length > 0,
)
const editable = computed(() => data.value?.role === 'admin')
const systems = computed(() => [
  { label: t('settings.none'), value: 'none' },
  ...(data.value?.systems ?? [])
    .filter((system) => system.status === 'active' && system.studioId)
    .map((system) => ({ label: system.key, value: system.studioId! })),
])
const groups = computed(() => {
  const categories = [
    {
      label: t('settings.prototypeTools'),
      ids: ['prototypes', 'view', 'canvas', 'diagrams', 'document'],
    },
    { label: t('settings.systemResources'), ids: ['systems', 'text'] },
    {
      label: t('settings.studioTeam'),
      ids: ['onboarding', 'documentation', 'contributors'],
    },
    { label: t('settings.other'), ids: [] as string[] },
  ]
  return categories.map((category, index) => ({
    label: category.label,
    modules: (data.value?.modules ?? []).filter((module) =>
      index === 3
        ? !categories.slice(0, 3).some((group) => group.ids.includes(module.id))
        : category.ids.includes(module.id),
    ),
  }))
})
function discard() {
  if (!data.value) return
  draft.name = String(data.value.config.name ?? '')
  draft.tagline = String(data.value.config.tagline ?? '')
  draft.defaultSystem = String(data.value.config.defaultSystem ?? 'none')
  draft.modules = { ...(data.value.config.modules as Record<string, boolean>) }
}
async function load() {
  if (dirty.value && !window.confirm(t('settings.reloadConfirm'))) return
  loading.value = true
  try {
    const response = await fetch(url, { cache: 'no-store' })
    const body = await response.json()
    if (!response.ok) throw new Error(body.error)
    data.value = body
    discard()
    failure.value = ''
    conflict.value = false
  } catch (error) {
    failure.value = (error as Error).message
  } finally {
    loading.value = false
  }
}
async function save() {
  if (!dirty.value || !editable.value || conflict.value) return
  saving.value = true
  try {
    const patch: Record<string, unknown> = { ...changes.value }
    if (patch.defaultSystem === 'none') patch.defaultSystem = null
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revision: data.value!.revision, changes: patch }),
    })
    const body = await response.json()
    if (!response.ok) {
      conflict.value = response.status === 409
      throw new Error(body.error)
    }
    restarting.value = true
    sessionStorage.setItem('design-studio:settings-saved', '1')
  } catch (error) {
    failure.value = (error as Error).message
  } finally {
    saving.value = false
  }
}
onBeforeRouteLeave(
  async () =>
    !dirty.value || restarting.value || Boolean(await modal.open().result),
)
useEventListener(window, 'beforeunload', (event) => {
  if (dirty.value && !restarting.value) event.preventDefault()
})
onMounted(() => {
  if (local) void load()
})
useHead({
  title: local ? `${t('settings.title')} — ${studio.name}` : studio.name,
})
</script>

<template>
  <UDashboardPanel id="settings">
    <template v-if="local" #header
      ><UDashboardNavbar :title="t('settings.title')" :toggle="false"
    /></template>
    <template #body>
      <AppNotFound v-if="!local" />
      <div v-else class="mx-auto w-full max-w-3xl space-y-6 py-6">
        <UPageHeader
          :title="t('settings.title')"
          :description="t('settings.description')"
        >
          <template #links
            ><UBadge
              :label="
                t(
                  data?.role === 'admin'
                    ? 'settings.admin'
                    : data?.role === 'contributor'
                      ? 'settings.contributor'
                      : 'settings.unregistered',
                )
              "
          /></template>
        </UPageHeader>
        <p v-if="loading" role="status">{{ t('settings.loading') }}</p>
        <div v-if="failure" role="alert">
          <p>{{ failure }}</p>
          <UButton :label="t('settings.reload')" @click="load" />
        </div>
        <template v-if="data">
          <p v-if="!editable">
            {{ t(data.role ? 'settings.readOnly' : 'settings.register') }}
          </p>
          <NuxtLink to="/contributors" class="text-sm underline">{{
            t('settings.people')
          }}</NuxtLink>
          <p v-if="data.adminProblem" role="alert">
            {{ t('settings.needsAdmin') }}
          </p>
          <UForm :state="draft" class="space-y-6" @submit="save">
            <UPageCard :title="t('settings.general')">
              <UFormField :label="t('settings.name')" name="name" required
                ><UInput
                  v-model="draft.name"
                  :disabled="!editable"
                  class="w-full"
              /></UFormField>
              <UFormField
                :label="t('settings.tagline')"
                :description="t('settings.taglineHint')"
                name="tagline"
                ><UInput
                  v-model="draft.tagline"
                  :disabled="!editable"
                  :maxlength="140"
                  class="w-full"
              /></UFormField>
              <UFormField
                :label="t('settings.system')"
                :description="t('settings.pinned')"
                name="defaultSystem"
                ><USelect
                  v-model="draft.defaultSystem"
                  :items="systems"
                  :disabled="!editable"
                  class="w-full"
              /></UFormField>
            </UPageCard>
            <UPageCard
              :title="t('settings.modules')"
              :description="t('settings.keepsFiles')"
            >
              <section
                v-for="group in groups"
                v-show="group.modules.length"
                :key="group.label"
                class="space-y-4"
              >
                <h3 class="font-semibold">{{ group.label }}</h3>
                <div
                  v-for="module in group.modules"
                  :key="module.id"
                  class="flex items-center justify-between gap-4"
                >
                  <div>
                    <p>
                      {{ module.label }}
                      <UBadge
                        v-if="module.required"
                        :label="
                          t(
                            module.id === 'contributors'
                              ? 'settings.requiredTeam'
                              : 'settings.required',
                          )
                        "
                        size="sm"
                      />
                    </p>
                    <p class="text-sm text-muted">{{ module.description }}</p>
                  </div>
                  <USwitch
                    v-model="draft.modules[module.id]"
                    :aria-label="module.label"
                    :disabled="!editable || module.required"
                  />
                </div>
              </section>
            </UPageCard>
            <p role="status">
              {{
                t(
                  restarting
                    ? 'settings.restarting'
                    : dirty
                      ? 'settings.unsaved'
                      : 'settings.current',
                )
              }}
            </p>
            <p class="text-sm text-muted">{{ t('settings.local') }}</p>
            <div class="flex gap-2">
              <UButton
                :label="t('settings.discard')"
                variant="outline"
                :disabled="!dirty || saving || restarting"
                @click="discard"
              /><UButton
                type="submit"
                :label="t(saving ? 'settings.saving' : 'settings.save')"
                :loading="saving"
                :disabled="
                  !editable ||
                  !!data.adminProblem ||
                  !dirty ||
                  !draft.name.trim() ||
                  draft.tagline.length > 140 ||
                  conflict ||
                  restarting
                "
              />
            </div>
          </UForm>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
