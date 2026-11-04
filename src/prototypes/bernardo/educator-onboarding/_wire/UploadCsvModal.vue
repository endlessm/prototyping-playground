<script setup lang="ts">
import { ref } from 'vue'
import Button from './Button.vue'
import type { CsvStep } from './csv'
import Logic from './Logic.vue'
import Marker from './Marker.vue'
import Modal from './Modal.vue'
import Panel from './Panel.vue'
import TextLink from './TextLink.vue'
import s from './wire.module.css'

// Learners from a class list instead of the link. Nothing is added until Maya confirms the rows she sees.
const props = defineProps<{ step?: CsvStep; walkthrough?: boolean }>()
const emit = defineEmits<{ close: [] }>()

const step = ref<CsvStep>(props.step ?? 'choose')

const columns = ['First Name', 'Last Name', 'Email (optional)']
const learners = [
  ['Ada', 'Okafor', 'ada.okafor@gmail.com'],
  ['Tobi', 'Okafor', ''],
  ['Lena', 'Fischer', 'lena.fischer@outlook.com'],
  ['Priya', 'Raman', 'r.raman@icloud.com'],
  ['Marcus', 'Hill', 'marcus.hill@yahoo.com'],
]
const problems = [
  { row: 5, text: 'r.raman.icloud.com is missing an @. Fix the email or leave it empty.' },
  { row: 7, text: 'Over the 5 seats. Raise Seats on the class or remove a row.' },
]
</script>

<template>
  <Modal title="Upload a Class List" lead="Add learners from a spreadsheet instead of sharing the link." :width="560" @close="emit('close')">
    <template v-if="step === 'choose'">
      <div
        :class="[s.stack, s.tight]"
        style="align-items: center; padding: 28px 16px; border: 1px dashed #999; text-align: center"
      >
        <span :class="s.label" style="font-size: 13px">Drop a CSV file here</span>
        <span :class="s.small">or</span>
        <Button variant="secondary" @click="step = 'ready'">Choose File</Button>
      </div>
      <div :class="[s.stack, s.tight]">
        <span :class="[s.row, s.label]">
          One learner per row, with these columns:
          <Marker v-if="walkthrough" :flow="5" :n="4" />
        </span>
        <span :class="s.small" style="font-size: 12px">{{ columns.join(' · ') }}</span>
        <span :class="s.small" style="font-size: 12px">
          Up to 5 learners, the class's seats. <TextLink>Download the template</TextLink>
        </span>
      </div>
    </template>

    <template v-else>
      <div :class="[s.row, s.spread]" style="border: 1px solid #ccc; padding: 8px 12px; font-size: 12px">
        <span>
          <strong>spring-game-makers.csv</strong> ·
          {{ step === 'ready' ? '5 learners' : '6 rows, 2 need a fix' }}
        </span>
        <TextLink @click="step = 'choose'">Replace</TextLink>
      </div>

      <table v-if="step === 'ready'" :class="s.table">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column">{{ column }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="[first, last, email] in learners" :key="first">
            <td>{{ first }}</td>
            <td>{{ last }}</td>
            <td>{{ email || '—' }}</td>
          </tr>
        </tbody>
      </table>

      <Panel v-else>
        <span :class="[s.row, s.label]">
          Rows to fix
          <Marker v-if="walkthrough" :flow="5" :n="5" />
        </span>
        <span v-for="problem in problems" :key="problem.row" :class="s.error">
          Row {{ problem.row }}: {{ problem.text }}
        </span>
        <span :class="s.small">The other 4 rows are ready.</span>
      </Panel>

      <span :class="s.small" style="font-size: 12px">
        Each learner gets their own invitation to finish signing up. Age and parent consent stay on their side.
      </span>
    </template>

    <Logic
      v-if="walkthrough"
      title="After Add"
      :rows="[
        { label: 'Open class → invitations sent → Team Dashboard', to: '5 Invite Students/5.5 Team Dashboard' },
        { label: 'NDPA class → restricted accounts made after Endless reviews the class', to: '4 Create Cohort/4.4 In Review' },
      ]"
    />

    <template #footer>
      <Button variant="ghost" @click="emit('close')">Cancel</Button>
      <Button v-if="step === 'choose'" variant="disabled">Add Learners</Button>
      <Button v-else-if="step === 'ready'" to="5 Invite Students/5.5 Team Dashboard">Add 5 Learners</Button>
      <template v-else>
        <Button variant="secondary" to="5 Invite Students/5.5 Team Dashboard">Add the 4 Ready</Button>
        <Button @click="step = 'ready'">Upload Fixed File</Button>
      </template>
    </template>
  </Modal>
</template>
