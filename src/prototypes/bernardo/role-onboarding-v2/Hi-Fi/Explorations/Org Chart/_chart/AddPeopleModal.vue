<script setup lang="ts">
import { computed, ref } from 'vue'
import { candidatesFor, type Person } from '../../../../_wire/world'
import type { Place, Position } from './district'

// The Hi-Fi kit's add modal, copied for the exploration so it can hand back who was picked: one position, one search
// field for a name or an email, and the place under the title, since a chart has the same position in many places.
const props = defineProps<{ place: Place; position: Position }>()
const emit = defineEmits<{ send: [people: Person[]]; close: [] }>()

const open = ref(true)
const held = new Set(props.position.members.map((m) => m.email))
const candidates = candidatesFor(props.position.role).filter((p) => !held.has(p.email))
const known = new Map(candidates.map((p) => [p.email, p]))

type Item = { label: string; value: string; email: string; avatar: { text?: string; icon?: string } }
const items = ref<Item[]>(
  candidates.map((p) => ({ label: p.name, value: p.email, email: p.email, avatar: { text: p.initials } })),
)
const chosen = ref<string[]>([])
const search = ref('')
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
  emit(
    'send',
    chosen.value.map((email) => known.get(email) ?? { name: email, initials: email.slice(0, 2).toUpperCase(), email }),
  )
}
</script>

<template>
  <UModal :open="open" :title="position.add" :description="place.name" :ui="{ content: 'max-w-lg' }" @update:open="close">
    <template #body>
      <div class="flex flex-col gap-5">
        <UFormField label="Name or email" name="people">
          <UInputMenu
            v-model="chosen"
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
        <UFormField label="Note" hint="Optional" name="note">
          <UTextarea placeholder="Add a note to the invite" :rows="3" autoresize class="w-full" />
        </UFormField>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="outline" @click="close(false)">Cancel</UButton>
        <UButton icon="i-lucide-send" :disabled="!chosen.length" @click="send">Send Invites</UButton>
      </div>
    </template>
  </UModal>
</template>
