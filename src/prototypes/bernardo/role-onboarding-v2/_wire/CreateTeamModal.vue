<script setup lang="ts">
import { usePrototypeNavigate } from '#studio/prototype'
import { ref } from 'vue'
import Button from './Button.vue'
import Field from './Field.vue'
import Input from './Input.vue'
import Marker from './Marker.vue'
import Modal from './Modal.vue'
import { createsOrgTeams, INDIE_TEAM, ORG, TEAM, type RoleKey } from './world'
import s from './wire.module.css'

// Create a Team, from the Organization's Teams tab or from "Create a Team" in the place switcher. Everyone can create
// an Independent Team; only the Organization's roles that create Teams also get the Organization as a choice. Org
// Owners and Org Managers can name the new Team's owners right away, since they award Team Owner.
const props = defineProps<{
  viewer: RoleKey
  where?: 'org' | 'independent'
  next?: string
  name?: string
  owners?: string[]
  flow?: number
  note?: number
}>()
const emit = defineEmits<{ close: [] }>()

const navigate = usePrototypeNavigate()
const canOrg = createsOrgTeams.includes(props.viewer)
const where = ref(canOrg ? (props.where ?? 'org') : 'independent')
const awardsOwners = props.viewer === 'orgOwner' || props.viewer === 'orgManager'

function create() {
  if (props.next) navigate(props.next)
  else emit('close')
}
</script>

<template>
  <Modal title="Create a Team" :width="480" @close="emit('close')">
    <Field label="Team name">
      <template v-if="flow !== undefined && note" #note><Marker :flow="flow" :n="note" /></template>
      <Input :value="name ?? (where === 'org' ? TEAM : INDIE_TEAM)" active />
    </Field>
    <div :class="[s.stack, s.tight]">
      <span :class="s.label">Belongs to</span>
      <label v-if="canOrg" :class="[s.card, s.row, where === 'org' && s.selected]" style="padding: 10px 12px">
        <input v-model="where" type="radio" value="org" :class="s.checkbox" />
        <span :class="s.grow">
          {{ ORG }}
          <span :class="s.small" style="display: block">Programs open to everyone, plus the district's custom Programs</span>
        </span>
      </label>
      <label :class="[s.card, s.row, where === 'independent' && s.selected]" style="padding: 10px 12px">
        <input v-model="where" type="radio" value="independent" :class="s.checkbox" />
        <span :class="s.grow">
          Independent
          <span :class="s.small" style="display: block">Programs open to everyone</span>
        </span>
      </label>
    </div>
    <Field v-if="awardsOwners && where === 'org'" label="Team Owners (optional)">
      <div :class="s.roChips">
        <span v-for="email in owners ?? []" :key="email" :class="s.chip">{{ email }} <span>×</span></span>
        <input aria-label="Add an email" placeholder="Add an email" />
      </div>
    </Field>
    <template #footer>
      <Button variant="secondary" @click="emit('close')">Cancel</Button>
      <Button @click="create">Create Team</Button>
    </template>
  </Modal>
</template>
