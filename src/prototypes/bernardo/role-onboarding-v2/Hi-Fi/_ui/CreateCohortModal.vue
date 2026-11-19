<script setup lang="ts">
import { usePrototypeNavigate } from '#studio/prototype'
import { reactive, ref } from 'vue'
import { cohort } from '../../_wire/world'
import Marker from './Marker.vue'

// Create a Cohort, the Hi-Fi of the Lo-Fi Team page's modal: name, Program, start date and seats. With `filled`, it
// holds the flow's Cohort (Spring Game Makers), and Create Cohort goes to the flow's next screen; otherwise it closes.
// The Program list is what the district can run: the Programs open to everyone (no Partnership yet).
const props = defineProps<{
  filled?: boolean
  next?: string
  flow?: number
  note?: number
}>()
const emit = defineEmits<{ close: [] }>()

const navigate = usePrototypeNavigate()
const open = ref(true)
const programs = ['Explore: Threadbare', 'Explore: Godot', 'Core: Threadbare']
const state = reactive({
  name: props.filled ? cohort.name : '',
  program: props.filled ? cohort.program : undefined,
  starts: props.filled ? cohort.starts : '',
  seats: props.filled ? cohort.seats : undefined,
})

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
  <UModal :open="open" title="Create a Cohort" :ui="{ content: 'max-w-lg' }" @update:open="close">
    <template #body>
      <UForm :state="state" class="flex flex-col gap-5" @submit="create">
        <UFormField name="name">
          <template #label>
            <span class="flex items-center gap-2">
              Cohort name
              <Marker v-if="flow !== undefined && note" :flow="flow" :n="note" />
            </span>
          </template>
          <UInput v-model="state.name" size="lg" class="w-full" autofocus />
        </UFormField>
        <UFormField label="Program" name="program">
          <USelect v-model="state.program" :items="programs" placeholder="Choose a Program" size="lg" class="w-full" />
        </UFormField>
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Start date" name="starts">
            <UInput v-model="state.starts" icon="i-lucide-calendar" size="lg" class="w-full" />
          </UFormField>
          <UFormField label="Seats" name="seats">
            <UInput v-model="state.seats" type="number" size="lg" class="w-full" />
          </UFormField>
        </div>
      </UForm>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="outline" @click="close(false)">Cancel</UButton>
        <UButton :disabled="!state.name.trim()" @click="create">Create Cohort</UButton>
      </div>
    </template>
  </UModal>
</template>
