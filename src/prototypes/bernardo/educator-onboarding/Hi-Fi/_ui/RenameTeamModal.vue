<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from './Button.vue'
import Marker from './Marker.vue'
import Modal from './Modal.vue'
import TextLink from './TextLink.vue'
import s from './ui.module.css'

// Rename in a modal. A name over 40 characters gets a one-click shorter suggestion.
const props = defineProps<{ name: string }>()
const emit = defineEmits<{ save: [name: string]; close: [] }>()

const name = ref(props.name)
const empty = computed(() => name.value.trim().length === 0)
const tooLong = computed(() => name.value.length > 40)
const suggestion = computed(() => name.value.split('·')[0].trim())
</script>

<template>
  <Modal title="Rename team" @close="emit('close')">
    <div :class="[s.stack, s.tight]">
      <span :class="s.label">Team Name</span>
      <input v-model="name" :class="[s.input, s.inputActive]" aria-label="Team Name" />
      <span v-if="tooLong" :class="[s.error, s.row, s.wrap]">
        Keep it under 40 characters.
        <TextLink v-if="suggestion.length <= 40" @click="name = suggestion">Use “{{ suggestion }}”</TextLink>
        <Marker :flow="3" :n="4" />
      </span>
      <span v-else-if="empty" :class="s.error">Give your team a name.</span>
      <span v-else :class="s.small">Learners and parents see this name on invitations.</span>
    </div>
    <template #footer>
      <Button variant="ghost" @click="emit('close')">Cancel</Button>
      <Button :variant="empty || tooLong ? 'disabled' : 'primary'" @click="emit('save', name.trim())">Save</Button>
    </template>
  </Modal>
</template>
