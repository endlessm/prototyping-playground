<script setup lang="ts">
import { usePrototypeNavigate } from '#studio/prototype'
import { computed, ref } from 'vue'
import Avatar from './Avatar.vue'
import Button from './Button.vue'
import Field from './Field.vue'
import Marker from './Marker.vue'
import Modal from './Modal.vue'
import { candidatesFor, type Person } from './world'
import s from './wire.module.css'

// Give one role to people. Each add button opens it for its own role, so there is no role to choose. One field takes
// everyone: typing searches the people who could take the role (`candidatesFor`, minus whoever already holds it) in a
// dropdown under it, which also offers to invite a typed email nobody on the list has. Each pick becomes a chip.
// Send Invites goes to the screen after it, or closes when there is none.
const props = defineProps<{
  role: string
  /** The button's own words when they aren't "Add <role>s", such as Invite Facilitators. */
  title?: string
  /** People already holding the role here, left out of the search. */
  holders?: { email: string }[]
  /** Emails already in the field when the modal opens. */
  picked?: string[]
  /** What is already typed when the modal opens, so the dropdown shows on the flow's screen. */
  query?: string
  next?: string
  flow?: number
  note?: number
}>()
const emit = defineEmits<{ close: [] }>()

const navigate = usePrototypeNavigate()
const held = new Set((props.holders ?? []).map((p) => p.email))
const people: Person[] = candidatesFor(props.role).filter((p) => !held.has(p.email))

const chosen = ref<string[]>([...(props.picked ?? [])])
const text = ref(props.query ?? '')
const focused = ref(false)

const byEmail = (email: string) => people.find((p) => p.email === email)
const typed = computed(() => text.value.trim().toLowerCase())
const matches = computed(() =>
  people.filter(
    (p) => !chosen.value.includes(p.email) && (p.name.toLowerCase().includes(typed.value) || p.email.includes(typed.value)),
  ),
)
const isEmail = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(typed.value))
const newEmail = computed(() => isEmail.value && !people.some((p) => p.email === typed.value) && !chosen.value.includes(typed.value))
const open = computed(() => (focused.value || typed.value !== '') && (matches.value.length > 0 || newEmail.value))

function add(email: string) {
  chosen.value = [...chosen.value, email]
  text.value = ''
}

function drop(email: string) {
  chosen.value = chosen.value.filter((e) => e !== email)
}

function enter() {
  if (newEmail.value) add(typed.value)
  else if (typed.value && matches.value[0]) add(matches.value[0].email)
}

function send() {
  if (props.next) navigate(props.next)
  else emit('close')
}
</script>

<template>
  <Modal :title="title ?? `Add ${role}s`" :width="480" overflow @close="emit('close')">
    <div :class="[s.stack, s.tight]">
      <span :class="[s.row, s.label]">
        Name or email
        <Marker v-if="flow !== undefined && note" :flow="flow" :n="note" />
      </span>
      <div :class="s.roChips" style="position: relative">
        <span v-for="email in chosen" :key="email" :class="s.chip">
          {{ byEmail(email)?.name ?? email }}
          <span role="button" aria-label="Remove" style="cursor: pointer" @click="drop(email)">×</span>
        </span>
        <input
          v-model="text"
          aria-label="Search people or type an email"
          placeholder="Search people or type an email"
          @focus="focused = true"
          @blur="focused = false"
          @keydown.enter.prevent="enter"
        />
        <div
          v-if="open"
          role="listbox"
          :class="s.roRows"
          style="position: absolute; top: calc(100% + 4px); left: -1px; right: -1px; z-index: 10; box-shadow: 0 4px 12px rgb(0 0 0 / 12%)"
        >
          <button
            v-for="p in matches"
            :key="p.email"
            type="button"
            role="option"
            style="width: 100%; border: 0; background: #fff; text-align: left; font: inherit; cursor: pointer"
            @mousedown.prevent="add(p.email)"
          >
            <Avatar>{{ p.initials }}</Avatar>
            <span :class="s.grow">
              {{ p.name }}
              <span :class="s.small" style="display: block">{{ p.email }}</span>
            </span>
          </button>
          <button
            v-if="newEmail"
            type="button"
            role="option"
            style="width: 100%; border: 0; background: #fff; text-align: left; font: inherit; cursor: pointer"
            @mousedown.prevent="add(typed)"
          >
            <Avatar>+</Avatar>
            <span :class="s.grow">Invite {{ typed }}</span>
          </button>
        </div>
      </div>
    </div>
    <Field label="Note (optional)">
      <textarea :class="s.input" rows="3" style="height: auto; padding: 8px 12px" placeholder="Add a note to the invite" />
    </Field>
    <template #footer>
      <Button variant="secondary" @click="emit('close')">Cancel</Button>
      <Button @click="send">Send Invites</Button>
    </template>
  </Modal>
</template>
