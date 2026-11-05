<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePrototypeNavigate } from '#studio/prototype'
import Bullets from './Bullets.vue'
import Button from './Button.vue'
import { type CohortStart, context, programs, starts, steps } from './cohort'
import Fact from './Fact.vue'
import Facts from './Facts.vue'
import Field from './Field.vue'
import Icon from './Icon.vue'
import Marker from './Marker.vue'
import Panel from './Panel.vue'
import ProgramDetails from './ProgramDetails.vue'
import Segmented from './Segmented.vue'
import StepHeading from './StepHeading.vue'
import Testimonial from './Testimonial.vue'
import TextLink from './TextLink.vue'
import Wizard from './Wizard.vue'
import s from './wire.module.css'

const props = defineProps<{ start: CohortStart; team: string }>()
const emit = defineEmits<{ close: [] }>()

const navigate = usePrototypeNavigate()
const step = ref(starts[props.start].step)
const program = ref(starts[props.start].program)
const name = ref(starts[props.start].name)
const school = ref(starts[props.start].school)
const schoolName = ref('')
const tried = ref(starts[props.start].tried)

const chosen = computed(() => (program.value === null ? null : programs[program.value]))
const missing = computed(() => (step.value === 0 && !chosen.value) || (step.value === 1 && !name.value.trim()))
const last = computed(() => step.value === steps.length - 1)
const classType = computed(() =>
  school.value
    ? `Closed school class${schoolName.value.trim() ? ` · ${schoolName.value.trim()}` : ''}`
    : 'Open class',
)

function goTo(next: number) {
  tried.value = false
  step.value = next
}

function next() {
  if (missing.value) {
    tried.value = true
    return
  }
  if (step.value < steps.length - 1) return goTo(step.value + 1)
  navigate(school.value ? 'Lo-Fi/4 Create Cohort/4.4 In Review' : 'Lo-Fi/4 Create Cohort/4.5 Ready')
}
</script>

<template>
  <Wizard title="Create a class" :steps="steps" :current="step" @step="goTo" @close="emit('close')">
    <template v-if="step === 0">
      <StepHeading
        title="Choose a program"
        lead="What your class will make together. Pick one; you can create more classes later."
      />
      <div
        v-if="start === 'link' && program === 0"
        :class="[s.panel, s.row]"
        style="border: 1px solid #ccc; font-size: 12px; color: #333"
      >
        <Icon square />
        <span :class="s.grow">Explore: Threadbare is selected from the link you followed.</span>
        <Marker :flow="4" :n="1" />
      </div>
      <div style="display: grid; grid-template-columns: 190px minmax(0, 1fr); gap: 14px; align-items: start">
        <div :class="[s.stack, s.tight]" role="radiogroup" aria-label="Program">
          <button
            v-for="(option, i) in programs"
            :key="option.name"
            type="button"
            role="radio"
            :aria-checked="program === i"
            :class="[s.card, s.row, program === i && s.selected]"
            style="padding: 9px 10px; font: inherit; text-align: left; cursor: pointer"
            @click="program = i"
          >
            <span
              :class="s.icon"
              :style="program === i ? { background: '#000' } : { background: 'none', border: '1px solid #999' }"
            />
            <span :class="s.grow">
              <span style="display: block">{{ option.name }}</span>
              <span :class="s.small" style="display: block">{{ option.short }}</span>
            </span>
          </button>
          <TextLink>Show 2 more</TextLink>
        </div>
        <ProgramDetails :program="chosen" />
      </div>
      <span v-if="tried && !chosen" :class="[s.error, s.row]">
        Choose a program to continue.
        <Marker :flow="4" :n="5" />
      </span>
    </template>

    <template v-if="step === 1">
      <StepHeading
        title="Name your class"
        lead="Suggested from the season. Change it to anything your learners will recognize."
        :note="2"
      />
      <div :class="[s.stack, s.tight]">
        <span :class="s.label">Class name</span>
        <input
          v-model="name"
          :class="[s.input, s.inputActive]"
          placeholder="e.g. Spring Game Makers"
          aria-label="Class name"
        />
        <span v-if="tried && !name.trim()" :class="s.error">Give your class a name to continue.</span>
        <span v-else :class="s.small">Learners will see it.</span>
      </div>
      <div :class="[s.stack, s.tight]">
        <span :class="s.label">How learners will see it</span>
        <div :class="[s.card, s.row]" style="padding: 12px; background: #fafafa">
          <span :class="s.avatar">MO</span>
          <span :class="s.grow">
            <span style="display: block">
              {{ team }} invited you to <strong>{{ name.trim() || 'your class' }}</strong>
            </span>
            <span :class="s.small">{{ chosen?.name }}</span>
          </span>
          <span :class="s.badge">Join class</span>
        </div>
      </div>
    </template>

    <template v-if="step === 2">
      <StepHeading
        title="Where do you teach?"
        lead="This decides who can see your class and how learners join."
        :note="3"
      />
      <Field label="Is this class part of a US school?" hint="Homeschool groups, co-ops and clubs: choose No.">
        <Segmented
          :options="[
            { label: 'No', on: !school, onClick: () => (school = false) },
            { label: 'Yes', on: school, onClick: () => (school = true) },
          ]"
        />
      </Field>
      <template v-if="school">
        <Panel>
          <div :class="s.row">
            <strong style="color: #333; font-size: 12px">Closed school class (NDPA)</strong>
            <Marker :flow="4" :n="6" />
          </div>
          <Bullets
            :items="[
              'Restricted learner accounts: nothing leaves the class.',
              'No gallery, no outside contact.',
              'Endless reviews it before learners can join.',
            ]"
          />
        </Panel>
        <label :class="[s.stack, s.tight]">
          <span :class="s.label">School name</span>
          <input v-model="schoolName" :class="s.input" placeholder="e.g. Columbus Alternative High School" />
        </label>
      </template>
      <Panel v-else>
        <strong style="color: #333; font-size: 12px">Open class</strong>
        <Bullets
          :items="['Learners can share their games in the Endless gallery.', 'They join with a link or an email invite from you.']"
        />
      </Panel>
    </template>

    <template v-if="step === 3 && chosen">
      <StepHeading title="Review your class" lead="Check the details, then create it." />
      <Facts>
        <Fact label="Program" :value="chosen.name"><TextLink @click="goTo(0)">Change</TextLink></Fact>
        <Fact label="Class name" :value="name.trim()"><TextLink @click="goTo(1)">Change</TextLink></Fact>
        <Fact label="Class type" :value="classType"><TextLink @click="goTo(2)">Change</TextLink></Fact>
      </Facts>
      <Panel>
        <div :class="s.row">
          <strong style="color: #333">What your learners get</strong>
          <Marker :flow="4" :n="4" />
        </div>
        <Bullets
          :items="
            school
              ? ['A closed class only you and they can see', 'Explore: Threadbare, the only program reviewed for school use']
              : ['An open class: they can share games in the Endless gallery', chosen.unlocks, 'A join link or an email invite from you']
          "
        />
        <span :class="s.small" style="font-size: 12px">
          {{ school ? 'Next: Endless reviews it.' : 'Next: invite your learners.' }}
        </span>
      </Panel>
    </template>

    <template #aside>
      <div :class="[s.stack, s.tight]">
        <strong style="color: #333">{{ context[step].title }}</strong>
        <span :class="s.small" style="font-size: 12px">{{ context[step].body }}</span>
      </div>
      <Testimonial :quote="context[step].quote" :who="context[step].who" />
    </template>

    <template #footer>
      <Button v-if="step > 0" variant="ghost" @click="goTo(step - 1)">Back</Button>
      <Button v-else variant="ghost" @click="emit('close')">Cancel</Button>
      <div :class="s.row">
        <span :class="s.small">Step {{ step + 1 }} of {{ steps.length }}</span>
        <Button @click="next">{{ last ? (school ? 'Send for Review' : 'Create Class') : 'Continue' }}</Button>
      </div>
    </template>
  </Wizard>
</template>
