<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { TEAM, type Person } from '../../../../_wire/world'
import OwnerPicker from './OwnerPicker.vue'

// Create a Team drawn inside the page instead of a modal. It is made for people of the Organization, so the Team always
// belongs to it and the form asks only its name and its Team Owner, chosen as a card. The Team Owner is
// optional, since the Org Owner acts as Team Owner in every Team of the Organization; Team Managers come after, from
// the Team itself. Each part is marked to rise in, in order, when the form takes the place of what was there. The name
// is a model, so the list beside the form can show it while it's typed.
const name = defineModel<string>('name', { required: true })
const emit = defineEmits<{
  create: [team: { name: string; owners: Person[] }]
  cancel: []
}>()
// `framed` is the form that replaces the empty state: two columns, the Team Owner card on the left, held at `height`
// so the card around it keeps its size. `centered` draws the framed form as one centered column instead: title, two
// lines, the name and the Team Owner card peeking up from the bottom edge, with the buttons in the corner.
defineProps<{ framed?: boolean; centered?: boolean; height?: number }>()

const owner = ref<Person | null>(null)
const creating = ref(false)
const input = ref<{ inputRef?: HTMLInputElement }>()

// The centered form answers as it fills: the second line says who will run the Team once someone is picked, and the
// Create Team button gives a small pop the moment a name makes it usable.
const ready = computed(() => !!name.value.trim())
const pop = ref(0)
watch(ready, (now) => now && pop.value++)
const ownerLine = computed(() =>
  owner.value
    ? `${owner.value.name.split(' ')[0]} will run ${name.value.trim() || 'the Team'}.`
    : 'If you want, you can choose your Team Owner later.',
)

// The button holds for a beat, as a real request would, before the page turns into the new Team.
function create() {
  if (!name.value.trim() || creating.value) return
  creating.value = true
  setTimeout(
    () =>
      emit('create', {
        name: name.value.trim(),
        owners: owner.value ? [owner.value] : [],
      }),
    550,
  )
}

onMounted(() => setTimeout(() => nextTick(() => input.value?.inputRef?.focus({ preventScroll: true })), 380))
</script>

<template>
  <UForm
    v-if="framed && centered"
    :state="{ name }"
    class="tc-form"
    :style="{ height: `${height ?? 396}px` }"
    @submit="create"
  >
    <div class="flex flex-col items-center gap-2 text-center" data-enter style="--d: 0">
      <h3 class="text-2xl font-semibold text-highlighted">Create a Team</h3>
      <p class="text-base text-muted">
        Choose the Team Owner to manage the Team and create classes.<br />
        <Transition name="tc-line" mode="out-in">
          <span :key="ownerLine" class="inline-block">{{ ownerLine }}</span>
        </Transition>
      </p>
    </div>

    <div class="tc-name" data-enter style="--d: 1">
      <UInput
        ref="input"
        v-model="name"
        size="lg"
        placeholder="My Team Name"
        aria-label="Team name"
        :ui="{ base: 'text-center' }"
        class="w-full"
      />
    </div>

    <div class="tc-owner" data-enter style="--d: 2">
      <OwnerPicker v-model="owner" fill solid class="h-full" />
    </div>

    <div class="tc-actions" data-enter style="--d: 3">
      <UButton color="neutral" variant="outline" size="lg" :disabled="creating" @click="emit('cancel')">Cancel</UButton>
      <UButton :key="pop" type="submit" size="lg" :loading="creating" :disabled="!ready" :class="{ 'tc-pop': pop }">
        Create Team
      </UButton>
    </div>
  </UForm>

  <UForm
    v-else-if="framed"
    :state="{ name }"
    class="tt-split"
    :style="{ height: `${height ?? 396}px` }"
    @submit="create"
  >
    <div class="tt-split-owner" data-enter style="--d: 2">
      <OwnerPicker v-model="owner" fill class="min-h-0 flex-1" />
    </div>

    <div class="tt-split-main">
      <div class="flex flex-col gap-1" data-enter style="--d: 0">
        <h3 class="text-2xl font-semibold text-highlighted">Create a Team</h3>
        <p class="text-base text-muted">A Team runs its own Cohorts. Give it a name and choose who runs it.</p>
      </div>

      <UFormField label="Team name" name="name" data-enter style="--d: 1">
        <UInput ref="input" v-model="name" size="lg" :placeholder="TEAM" class="w-full" />
      </UFormField>

      <ul class="flex flex-col gap-2 text-sm text-muted" data-enter style="--d: 3">
        <li class="flex gap-2">
          <UIcon name="i-lucide-user-round-check" class="mt-0.5 size-4 flex-none text-dimmed" />
          The Team Owner runs the Team and invites Team Managers. You can leave it empty and run it yourself.
        </li>
        <li class="flex gap-2">
          <UIcon name="i-lucide-mail" class="mt-0.5 size-4 flex-none text-dimmed" />
          Someone not in the Organization yet gets an email invite.
        </li>
      </ul>

      <div class="mt-auto flex justify-end gap-2" data-enter style="--d: 4">
        <UButton color="neutral" variant="outline" size="lg" :disabled="creating" @click="emit('cancel')">Cancel</UButton>
        <UButton type="submit" size="lg" :loading="creating" :disabled="!name.trim()">Create Team</UButton>
      </div>
    </div>
  </UForm>

  <UForm v-else :state="{ name }" class="flex flex-col gap-6" @submit="create">
    <div class="flex flex-col gap-1" data-enter style="--d: 0">
      <h3 class="text-2xl font-semibold text-highlighted">Create a Team</h3>
      <p class="text-sm text-muted">A Team runs its own Cohorts. You can add people now or later.</p>
    </div>

    <UFormField label="Team name" name="name" data-enter style="--d: 1">
      <UInput ref="input" v-model="name" size="lg" :placeholder="TEAM" class="w-full" />
    </UFormField>

    <div class="flex flex-col gap-3" data-enter style="--d: 2">
      <p class="text-sm text-muted">Who runs this Team. They bring in its Team Managers later.</p>
      <OwnerPicker v-model="owner" />
    </div>

    <div class="flex justify-end gap-2" data-enter style="--d: 3">
      <UButton color="neutral" variant="outline" :disabled="creating" @click="emit('cancel')">Cancel</UButton>
      <UButton type="submit" :loading="creating" :disabled="!name.trim()">Create Team</UButton>
    </div>
  </UForm>
</template>

<style scoped>
/* Centered: one column, the Team Owner card cut by the bottom edge so it reads as the next thing to do; it rises
   fully into view under the pointer, on focus, or once someone is picked. */
.tc-form {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: clip;
  padding: 40px 32px 0;
}
.tc-name {
  width: 260px;
  margin-top: 28px;
  transition: width 320ms cubic-bezier(0.23, 1, 0.32, 1);
}
.tc-name:focus-within {
  width: 300px;
}
.tc-owner {
  width: 240px;
  height: 204px;
  margin-top: 36px;
  flex: none;
  transform: translateY(0);
  transition: transform 420ms cubic-bezier(0.34, 1.36, 0.64, 1);
}
@media (hover: hover) and (pointer: fine) {
  .tc-owner:hover {
    transform: translateY(-16px);
  }
}
.tc-owner:focus-within,
.tc-owner:has(.op-card:not(.op-add)) {
  transform: translateY(-16px);
}
.tc-actions {
  position: absolute;
  right: 24px;
  bottom: 24px;
  display: flex;
  gap: 8px;
}
.tc-pop {
  animation: tc-pop 380ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes tc-pop {
  40% {
    transform: scale(1.08);
  }
}
.tc-line-enter-active,
.tc-line-leave-active {
  transition:
    opacity 180ms ease-out,
    transform 220ms cubic-bezier(0.23, 1, 0.32, 1);
}
.tc-line-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.tc-line-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
@media (prefers-reduced-motion: reduce) {
  .tc-name,
  .tc-owner,
  .tc-pop,
  .tc-line-enter-active,
  .tc-line-leave-active {
    animation: none !important;
    transition: none !important;
  }
}

.tt-split {
  display: grid;
  grid-template-columns: minmax(200px, 240px) minmax(0, 1fr);
  gap: 32px;
  padding: 28px 32px;
}
.tt-split-owner {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 8px;
}
.tt-split-main {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 20px;
}
</style>
