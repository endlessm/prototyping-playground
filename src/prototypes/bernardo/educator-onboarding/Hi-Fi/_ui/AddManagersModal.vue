<script setup lang="ts">
import Avatar from './Avatar.vue'
import Button from './Button.vue'
import Modal from './Modal.vue'
import Small from './Small.vue'
import { members } from './team'
import s from './ui.module.css'

// The team's other members, to tick the ones who manage this cohort with its creator.
const emit = defineEmits<{ close: [] }>()

const others = members.filter((member) => member.role !== 'Team Leader')
</script>

<template>
  <Modal title="Add Managers" lead="Managers can see and run this cohort." :width="480" @close="emit('close')">
    <div :class="s.list" style="border: 1px solid var(--es-border); border-radius: 16px; padding: 0 12px">
      <label v-for="(member, index) in others" :key="member.email" style="cursor: pointer">
        <span :class="s.row">
          <Avatar>{{ member.initials }}</Avatar>
          <span>
            <span style="display: block">{{ member.name }}</span>
            <Small>{{ member.email }}</Small>
          </span>
        </span>
        <UCheckbox :default-value="index === 0" :aria-label="member.name" />
      </label>
    </div>
    <template #footer>
      <Button variant="ghost" @click="emit('close')">Cancel</Button>
      <Button @click="emit('close')">Add Managers</Button>
    </template>
  </Modal>
</template>
