<script setup lang="ts">
import { usePrototypeNavigate } from '#studio/prototype'
import { computed, ref, watch } from 'vue'
import { candidatesFor, createsOrgTeams, INDIE_TEAM, ORG, people, TEAM, type RoleKey } from '../../_wire/world'
import Marker from './Marker.vue'

// Create a Team, the Hi-Fi of the Lo-Fi CreateTeamModal: from the Organization's Teams tab or from "Create an
// Independent Team" in the place switcher. Everyone can create an Independent Team; only the Organization's roles that
// create Teams also get the Organization as a choice. Org Owners and Org Managers award Team Owner, so for a Team in
// the Organization they can name its owners right away in the same search as the add modals; left empty, whoever
// creates the Team owns it. From the switcher, which sits above every place, the Team can only be Independent, so the
// modal says so instead of offering a choice.
const props = defineProps<{
  viewer: RoleKey
  where?: 'org' | 'independent'
  independentOnly?: boolean
  next?: string
  name?: string
  /** Team Owners already picked when the modal opens, by email. */
  owners?: string[]
  flow?: number
  note?: number
}>()
const emit = defineEmits<{ close: [] }>()

const navigate = usePrototypeNavigate()
const open = ref(true)
const createsInOrg = createsOrgTeams.includes(props.viewer)
const canOrg = !props.independentOnly && createsInOrg
const awardsOwners = props.viewer === 'orgOwner' || props.viewer === 'orgManager'

const everyone = Object.values(people)
const picked = (props.owners ?? []).map((email) => everyone.find((p) => p.email === email) ?? { name: email, initials: '', email })
const pool = [...picked, ...candidatesFor('Team Owner').filter((p) => !picked.some((o) => o.email === p.email))]

type Item = { label: string; value: string; email: string; avatar: { text?: string; icon?: string } }
const items = ref<Item[]>(
  pool.map((p) => ({ label: p.name, value: p.email, email: p.email, avatar: p.initials ? { text: p.initials } : { icon: 'i-lucide-mail' } })),
)
const where = ref<'org' | 'independent'>(canOrg ? (props.where ?? 'org') : 'independent')
const defaultName = (w: 'org' | 'independent') => props.name ?? (w === 'org' ? TEAM : INDIE_TEAM)
const state = ref({ name: defaultName(where.value), owners: picked.map((p) => p.email) })
// Switching where the Team belongs swaps the suggested name, unless the person already typed their own.
watch(where, (now, before) => {
  if (state.value.name === defaultName(before)) state.value.name = defaultName(now)
})

const whereItems = [
  { label: ORG, value: 'org', description: "Programs open to everyone, plus the district's custom Programs" },
  { label: 'Independent', value: 'independent', description: 'Programs open to everyone' },
]
const search = ref('')
const isEmail = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(search.value.trim()))

function invite(email: string) {
  const value = email.trim().toLowerCase()
  if (!items.value.some((i) => i.value === value)) {
    items.value.push({ label: value, value, email: value, avatar: { icon: 'i-lucide-mail' } })
  }
  state.value.owners = [...state.value.owners, value]
  search.value = ''
}

function close(value: boolean) {
  open.value = value
  if (!value) emit('close')
}

function create() {
  if (props.next) navigate(props.next)
  else close(false)
}
</script>

<template>
  <UModal
    :open="open"
    :title="independentOnly ? 'Create an Independent Team' : 'Create a Team'"
    :ui="{ content: 'max-w-lg' }"
    @update:open="close"
  >
    <template #body>
      <UForm :state="state" class="flex flex-col gap-5" @submit="create">
        <UFormField name="name">
          <template #label>
            <span class="flex items-center gap-2">
              Team name
              <Marker v-if="flow !== undefined && note" :flow="flow" :n="note" />
            </span>
          </template>
          <UInput v-model="state.name" size="lg" class="w-full" />
        </UFormField>
        <p v-if="independentOnly" class="text-sm text-muted">
          This Team stands on its own and belongs to no Organization. It uses the Programs open to everyone, and you are
          its Team Owner.
          <template v-if="createsInOrg">To create a Team in {{ ORG }}, use Create a Team on its Teams tab.</template>
        </p>
        <UFormField v-else label="Belongs to" name="where">
          <URadioGroup
            v-model="where"
            :items="canOrg ? whereItems : whereItems.slice(1)"
            variant="card"
            color="secondary"
            class="w-full"
          />
        </UFormField>
        <UFormField v-if="awardsOwners && where === 'org'" label="Team Owners" hint="Optional" name="owners">
          <UInputMenu
            v-model="state.owners"
            v-model:search-term="search"
            :items="items"
            value-key="value"
            :filter-fields="['label', 'email']"
            multiple
            :reset-search-term-on-blur="false"
            :create-item="isEmail ? 'always' : false"
            placeholder="Search people or type an email"
            icon="i-lucide-search"
            size="lg"
            class="w-full"
            @create="invite"
          >
            <template #item-label="{ item }">
              <span class="flex flex-col">
                <span class="text-sm text-highlighted">{{ item.label }}</span>
                <span class="text-xs text-muted">{{ item.email }}</span>
              </span>
            </template>
            <template #create-item-label="{ item }">Invite {{ item }}</template>
          </UInputMenu>
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="outline" @click="close(false)">Cancel</UButton>
        <UButton :disabled="!state.name.trim()" @click="create">Create Team</UButton>
      </div>
    </template>
  </UModal>
</template>
