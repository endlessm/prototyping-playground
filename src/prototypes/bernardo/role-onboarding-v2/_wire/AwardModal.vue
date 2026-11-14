<script setup lang="ts">
import { usePrototypeNavigate } from '#studio/prototype'
import { ref } from 'vue'
import Button from './Button.vue'
import Field from './Field.vue'
import Marker from './Marker.vue'
import Modal from './Modal.vue'
import { teams } from './world'
import s from './wire.module.css'

// Give a role to people by email. The same modal serves every role: `roles` holds only what this viewer may award,
// and Send invites goes to the screen after it. Team Owner, from the Organization, also needs the Team.
const props = defineProps<{
  title: string
  roles: string[]
  emails: string[]
  next: string
  /** Roles shown but not offered yet, such as Team Owner before any Team exists. */
  off?: string[]
  flow?: number
  note?: number
}>()
const emit = defineEmits<{ close: [] }>()

const navigate = usePrototypeNavigate()
const chosen = ref(props.roles[0])
</script>

<template>
  <Modal :title="title" :width="480" @close="emit('close')">
    <Field label="Emails">
      <template v-if="flow !== undefined && note" #note><Marker :flow="flow" :n="note" /></template>
      <div :class="s.roChips">
        <span v-for="email in emails" :key="email" :class="s.chip">{{ email }} <span>×</span></span>
        <input aria-label="Add an email" placeholder="Add an email" />
      </div>
    </Field>
    <Field v-if="roles.length > 1" label="Role">
      <select v-model="chosen" :class="s.input">
        <option v-for="role in roles" :key="role" :disabled="off?.includes(role)">{{ role }}</option>
      </select>
    </Field>
    <Field v-if="chosen === 'Team Owner'" label="Team">
      <select :class="s.input">
        <option v-for="team in teams" :key="team.name">{{ team.name }}</option>
      </select>
    </Field>
    <Field label="Note (optional)">
      <textarea :class="s.input" rows="3" style="height: auto; padding: 8px 12px" placeholder="Add a note to the invite" />
    </Field>
    <template #footer>
      <Button variant="secondary" @click="emit('close')">Cancel</Button>
      <Button @click="navigate(next)">Send Invites</Button>
    </template>
  </Modal>
</template>
