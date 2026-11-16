<script setup lang="ts">
import Button from './Button.vue'
import Chip from './Chip.vue'
import Modal from './Modal.vue'
import s from './ui.module.css'

// Facilitators are invited by email, one or more at a time.
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <Modal
    title="Invite Facilitators"
    lead="They run sessions and support the learners in this cohort."
    :width="480"
    @close="emit('close')"
  >
    <div :class="[s.stack, s.tight]">
      <span :class="s.label">Emails</span>
      <div
        :class="[s.row, s.wrap]"
        style="border: 1px solid var(--es-border); border-radius: 16px; padding: 6px; gap: 6px"
      >
        <Chip>lee.adeyemi@gmail.com</Chip>
        <input :class="s.grow" style="border: 0; outline: 0; font: inherit" aria-label="Facilitator email" />
      </div>
    </div>
    <template #footer>
      <Button variant="ghost" @click="emit('close')">Cancel</Button>
      <Button @click="emit('close')">Send Invites</Button>
    </template>
  </Modal>
</template>
