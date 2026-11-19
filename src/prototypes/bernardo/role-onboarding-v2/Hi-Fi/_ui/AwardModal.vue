<script setup lang="ts">
import { usePrototypeNavigate } from '#studio/prototype'
import { computed, nextTick, onMounted, ref } from 'vue'
import { candidatesFor } from '../../_wire/world'
import Marker from './Marker.vue'

// Give one role to people. Each add button opens it for its own role, so there is no role to choose. One Nuxt UI
// InputMenu takes everyone: typing searches the people who could take the role (`candidatesFor`, minus whoever holds
// it already), and a typed email nobody on the list has is offered as "Invite <email>". Each pick becomes a tag.
// Send Invites goes to the flow's next screen, or closes when there is none.
const props = defineProps<{
  role: string
  /** The button's own words when they aren't "Add <role>s", such as Invite Facilitators. */
  title?: string
  holders?: { email: string }[]
  picked?: string[]
  /** What is already typed when the modal opens, so the dropdown shows on the flow's screen. */
  query?: string
  next?: string
  flow?: number
  note?: number
}>()
const emit = defineEmits<{ close: [] }>()

const navigate = usePrototypeNavigate()
const open = ref(true)
const held = new Set((props.holders ?? []).map((p) => p.email))

type Item = { label: string; value: string; email: string; avatar: { text?: string; icon?: string } }
const items = ref<Item[]>(
  candidatesFor(props.role)
    .filter((p) => !held.has(p.email))
    .map((p) => ({ label: p.name, value: p.email, email: p.email, avatar: { text: p.initials } })),
)
const chosen = ref<string[]>([...(props.picked ?? [])])
const search = ref('')
// The menu clears its search as it opens, so the flow's half-typed name goes in once it's open.
onMounted(() => setTimeout(() => nextTick(() => (search.value = props.query ?? '')), 300))
const isEmail = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(search.value.trim()))

function invite(email: string) {
  const value = email.trim().toLowerCase()
  if (!items.value.some((i) => i.value === value)) {
    items.value.push({ label: value, value, email: value, avatar: { icon: 'i-lucide-mail' } })
  }
  chosen.value = [...chosen.value, value]
  search.value = ''
}

function close(value: boolean) {
  open.value = value
  if (!value) emit('close')
}

function send() {
  if (props.next) navigate(props.next)
  else close(false)
}
</script>

<template>
  <UModal :open="open" :title="title ?? `Add ${role}s`" :ui="{ content: 'max-w-lg' }" @update:open="close">
    <template #body>
      <div class="flex flex-col gap-5">
        <UFormField name="people">
          <template #label>
            <span class="flex items-center gap-2">
              Name or email
              <Marker v-if="flow !== undefined && note" :flow="flow" :n="note" />
            </span>
          </template>
          <UInputMenu
            v-model="chosen"
            v-model:search-term="search"
            :items="items"
            value-key="value"
            :filter-fields="['label', 'email']"
            multiple
            :default-open="!!query"
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
        <UFormField label="Note" hint="Optional" name="note">
          <UTextarea placeholder="Add a note to the invite" :rows="3" autoresize class="w-full" />
        </UFormField>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="outline" @click="close(false)">Cancel</UButton>
        <UButton icon="i-lucide-send" @click="send">Send Invites</UButton>
      </div>
    </template>
  </UModal>
</template>
