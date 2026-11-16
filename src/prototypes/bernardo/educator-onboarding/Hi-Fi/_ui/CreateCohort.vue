<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { usePrototypeNavigate } from '#studio/prototype'
import Button from './Button.vue'
import { type CohortStart, context, programs, starts } from './cohort'
import Field from './Field.vue'
import Icon from './Icon.vue'
import IconButton from './IconButton.vue'
import Input from './Input.vue'
import Marker from './Marker.vue'
import ProgramDetails from './ProgramDetails.vue'
import StepHeading from './StepHeading.vue'
import Testimonial from './Testimonial.vue'
import { useEscape } from './useEscape'
import s from './ui.module.css'

// Create Cohort on one page that any page can open over itself: the class's name, start date and seats, then
// the program, whose card says what learners get; the context column sits beside them. The join link's expiry
// follows the start date and can be changed later in the cohort's Settings. Where the class is taught (US school, NDPA) is left for later.
const props = defineProps<{ start: CohortStart }>()
const emit = defineEmits<{ close: [] }>()

const navigate = usePrototypeNavigate()
const titleId = useId()
useEscape(() => emit('close'))

const program = ref(starts[props.start].program)
const name = ref(starts[props.start].name)
const tried = ref(starts[props.start].tried)

const chosen = computed(() => (program.value === null ? null : programs[program.value]))

function create() {
  if (!chosen.value || !name.value.trim()) {
    tried.value = true
    return
  }
  navigate('Hi-Fi/4 Create Cohort/4.5 Ready')
}
</script>

<template>
  <div role="dialog" aria-modal="true" :aria-labelledby="titleId" :class="s.takeover">
    <div :class="s.wizardHeader">
      <h2 :id="titleId" :class="s.subtitle">Create a class</h2>
      <IconButton label="Close" icon="i-lucide-x" @click="emit('close')" />
    </div>
    <div :class="s.wizardBody">
      <div :class="[s.wizardMain, s.stack]" style="gap: 32px">
        <section :class="s.stack">
          <StepHeading
            title="Class details"
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
            <span v-if="tried && !name.trim()" :class="s.error">Give your class a name to create it.</span>
          </div>
          <div :class="s.columns" style="gap: 14px; align-items: start">
            <Field label="Start date">
              <Input value="Mar 2, 2027" />
            </Field>
            <Field label="Seats" hint="How many learners can join with the link.">
              <Input value="5" />
            </Field>
          </div>
          <span :class="s.small">The join link expires a week after the start date. You can change it later.</span>
        </section>
        <section :class="s.stack">
          <StepHeading
            title="Choose a program"
            lead="What your class will make together. Pick one; you can create more classes later."
          />
          <div style="display: grid; grid-template-columns: 250px minmax(0, 1fr); gap: 14px; align-items: start">
            <div :class="[s.stack, s.tight]" role="radiogroup" aria-label="Program">
              <button
                v-for="(option, i) in programs"
                :key="option.name"
                type="button"
                role="radio"
                :aria-checked="program === i"
                :class="[s.card, s.row, program === i && s.selected]"
                style="padding: 12px 14px; border-radius: 16px; font: inherit; text-align: left; cursor: pointer"
                @click="program = i"
              >
                <span
                  :class="s.icon"
                  style="border-radius: 50%; width: 18px; height: 18px"
                  :style="
                    program === i
                      ? { border: '5px solid var(--es-orange-500)', background: '#fff' }
                      : { border: '2px solid var(--es-border-accented)', background: '#fff' }
                  "
                />
                <span :class="s.grow">
                  <span style="display: block">{{ option.name }}</span>
                  <span :class="s.small" style="display: block">{{ option.short }}</span>
                </span>
              </button>
            </div>
            <!-- The link's note sits inside the details card, so choosing another program moves nothing. -->
            <ProgramDetails :program="chosen">
              <div
                v-if="start === 'link' && program === starts.link.program"
                :class="[s.panel, s.row]"
                style="border: 1px solid var(--es-border); border-radius: 16px; color: var(--es-text)"
              >
                <Icon name="i-lucide-link" />
                <span :class="s.grow">Selected from the link you followed.</span>
                <Marker :flow="4" :n="1" />
              </div>
            </ProgramDetails>
          </div>
          <span v-if="tried && !chosen" :class="[s.error, s.row]">
            Choose a program to create your class.
            <Marker :flow="4" :n="4" />
          </span>
        </section>


      </div>

      <aside :class="[s.wizardAside, s.stack]">
        <div v-for="entry in context" :key="entry.title" :class="[s.stack, s.tight]">
          <strong style="color: var(--es-text)">{{ entry.title }}</strong>
          <span :class="s.small">{{ entry.body }}</span>
        </div>
        <Testimonial :quote="context[0].quote" :who="context[0].who" />
      </aside>
    </div>
    <div :class="s.wizardFooter">
      <Button variant="ghost" @click="emit('close')">Cancel</Button>
      <Button @click="create">Create Class</Button>
    </div>
  </div>
</template>
