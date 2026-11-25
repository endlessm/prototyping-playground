<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
import { people, type Person } from '../../../../_wire/world'
import { flyFace } from './flyFace'

// The Team Owner as a card, the way the Figma exploration settled it. With nobody chosen there is one card, Add
// Team Owner; it opens a list of the Organization's people with a search that also takes an email, so someone not in
// the Organization yet can be invited. Choosing closes the list and the chosen person's card takes the Add card's
// place. A Team has one Team Owner here, so changing it means removing the card first, which brings Add back.
// `fill` grows the card to the column it sits in, for the form that takes the empty state's place. `solid` draws Add
// as a plain white card with a gray circle, for the centered form, and opens the list from the card's middle.
const owner = defineModel<Person | null>({ required: true })
const props = defineProps<{ fill?: boolean; solid?: boolean }>()

type Choice = Person & { invited?: boolean }

const district = [people.daniel, people.kevin, people.ben, people.aisha, people.priya, people.sofia, people.marcus, people.linda]

const uid = useId()
const open = ref(false)
const query = ref('')
const input = ref<{ inputRef?: HTMLInputElement }>()

const term = computed(() => query.value.trim().toLowerCase())
const isEmail = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(term.value))
const found = computed(() =>
  district.filter((p) => !term.value || `${p.name} ${p.email}`.toLowerCase().includes(term.value)),
)
const offerInvite = computed(() => isEmail.value && !district.some((p) => p.email === term.value))

watch(open, async (isOpen) => {
  if (!isOpen) return
  query.value = ''
  await nextTick()
  input.value?.inputRef?.focus()
})

// A person picked from the list flies from their row into the card that takes Add's place.
function choose(person: Choice, event?: Event) {
  const from = (event?.currentTarget as HTMLElement | undefined)?.querySelector('.op-list-face')
  owner.value = person
  open.value = false
  flyFace(from, () => from?.ownerDocument.querySelector<HTMLElement>(`[data-owner-face="${uid}"]`))
}

function invite() {
  const email = term.value
  const words = email
    .split('@')[0]!
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
  choose({
    name: words.join(' ') || email,
    initials: words.map((w) => w[0]).join('').slice(0, 2) || email.slice(0, 2).toUpperCase(),
    email,
    invited: true,
  })
}

function submit() {
  if (offerInvite.value) invite()
  else if (found.value.length) choose(found.value[0]!)
}

const chosen = computed(() => owner.value as Choice | null)
</script>

<template>
  <div class="op-row" :class="{ 'op-fill': fill, 'op-solid': solid }">
    <Transition name="op-swap" mode="out-in">
      <div v-if="chosen" :key="chosen.email" class="op-card group" :class="{ 'op-card-invited': chosen.invited }">
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="soft"
          size="xs"
          :aria-label="`Remove ${chosen.name} as Team Owner`"
          class="op-remove absolute top-2 right-2 rounded-full"
          @click="owner = null"
        />
        <UAvatar
          :src="chosen.photo"
          :text="chosen.initials"
          :alt="chosen.name"
          size="3xl"
          class="op-face"
          :data-owner-face="uid"
          :class="chosen.invited ? 'bg-secondary-50 text-secondary-700 outline-1 outline-secondary-300 outline-dashed' : ''"
        />
        <span class="flex w-full min-w-0 flex-col items-center gap-0.5">
          <span class="max-w-full truncate text-sm font-semibold text-highlighted" :title="chosen.name">{{ chosen.name }}</span>
          <span class="max-w-full truncate text-xs text-muted" :title="chosen.email">{{ chosen.email }}</span>
        </span>
        <UBadge v-if="chosen.invited" color="neutral" variant="outline" size="sm" icon="i-lucide-mail" class="rounded-full">
          Invited
        </UBadge>
        <UBadge v-else color="secondary" variant="soft" size="sm" class="rounded-full">Team Owner</UBadge>
      </div>

      <div v-else key="add" class="op-slot">
      <UPopover
        v-model:open="open"
        :content="{ side: 'bottom', align: props.solid ? 'center' : 'start', sideOffset: 8 }"
        :ui="{ content: 'w-80 p-0 overflow-hidden' }"
      >
        <button type="button" class="op-card op-add" :data-open="open" aria-label="Add the Team Owner">
          <span class="op-add-circle">
            <UIcon name="i-lucide-plus" class="op-add-icon size-6" />
          </span>
          <span class="flex flex-col items-center gap-0.5">
            <span class="text-sm font-semibold text-highlighted">{{ open ? 'Close' : 'Add Team Owner' }}</span>
            <span class="text-xs text-muted">Pick someone or invite by email</span>
          </span>
          <UBadge color="neutral" variant="subtle" size="sm">Optional</UBadge>
        </button>

        <template #content>
          <form class="flex flex-col gap-2 border-b border-default p-3" @submit.prevent="submit">
            <UInput
              ref="input"
              v-model="query"
              icon="i-lucide-search"
              placeholder="Search a name or type an email"
              aria-label="Search the Organization or type an email"
              class="w-full"
            />
          </form>

          <div class="max-h-72 overflow-y-auto">
            <template v-if="offerInvite">
              <p class="op-section">Not in the Organization yet</p>
              <button type="button" class="op-item" @click="invite">
                <span class="flex size-9 flex-none items-center justify-center rounded-full border border-dashed border-accented bg-elevated">
                  <UIcon name="i-lucide-mail" class="size-4 text-muted" />
                </span>
                <span class="flex min-w-0 flex-1 flex-col text-left">
                  <span class="truncate text-sm font-medium text-highlighted">{{ term }}</span>
                  <span class="truncate text-xs text-muted">We'll email them an invite</span>
                </span>
                <span class="op-invite rounded-md px-2 py-0.5 text-xs font-medium">Invite</span>
              </button>
            </template>

            <template v-else-if="found.length">
              <p class="op-section">In the Organization</p>
              <button v-for="p in found" :key="p.email" type="button" class="op-item" @click="choose(p, $event)">
                <UAvatar :src="p.photo" :text="p.initials" :alt="p.name" size="md" class="op-list-face" />
                <span class="flex min-w-0 flex-1 flex-col text-left">
                  <span class="truncate text-sm font-medium text-highlighted">{{ p.name }}</span>
                  <span class="truncate text-xs text-muted">{{ p.email }}</span>
                </span>
              </button>
            </template>

            <p v-else class="px-3 py-8 text-center text-sm text-muted">No one found. Type their email to invite them.</p>
          </div>
        </template>
      </UPopover>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.op-row {
  display: flex;
  min-height: 184px;
}

.op-card {
  position: relative;
  display: flex;
  width: 152px;
  height: 184px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px solid var(--ui-border);
  border-radius: 12px;
  background: var(--ui-bg);
  padding: 20px 14px 16px;
  text-align: center;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.04);
  transition:
    box-shadow 200ms ease-out,
    border-color 200ms ease-out,
    background-color 200ms ease-out;
}
@media (hover: hover) and (pointer: fine) {
  .op-card:hover {
    border-color: var(--ui-border-accented);
    box-shadow: 0 8px 20px -6px rgb(0 0 0 / 0.12);
  }
}
.op-card-invited {
  border-style: dashed;
}

.op-fill {
  height: 100%;
  min-height: 0;
}
.op-fill > *,
.op-fill .op-slot {
  width: 100%;
  height: 100%;
}
.op-fill .op-card {
  width: 100%;
  height: 100%;
  gap: 14px;
  padding: 24px 20px;
}
.op-fill .op-face {
  width: 88px;
  height: 88px;
  font-size: 28px;
}
.op-fill .op-add-circle {
  width: 72px;
  height: 72px;
}

.op-solid .op-add {
  border: 1px solid var(--ui-border-accented);
  background: var(--ui-bg);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.04);
}
.op-solid .op-add-circle {
  border: none;
  background: var(--ui-bg-elevated);
}

.op-add {
  cursor: pointer;
  border: 1.5px dashed color-mix(in oklab, var(--ui-text-muted) 40%, transparent);
  box-shadow: none;
}
.op-add:focus-visible {
  outline: 2px solid var(--ui-secondary);
  outline-offset: 2px;
}
.op-add[data-open='true'] {
  border-color: var(--ui-text-highlighted);
  background: color-mix(in oklab, var(--ui-text-highlighted) 4%, var(--ui-bg));
}
.op-add-circle {
  display: flex;
  width: 56px;
  height: 56px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--ui-bg-elevated);
  color: var(--ui-text-muted);
  transition:
    background-color 200ms ease-out,
    color 200ms ease-out;
}
.op-add[data-open='true'] .op-add-circle {
  background: var(--ui-text-highlighted);
  color: var(--ui-bg);
}
.op-add-icon {
  transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.op-add[data-open='true'] .op-add-icon {
  transform: rotate(45deg);
}

.op-section {
  padding: 10px 12px 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  color: var(--ui-text-muted);
}
.op-item {
  display: flex;
  width: 100%;
  cursor: pointer;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  transition: background-color 150ms ease-out;
}
.op-item:hover,
.op-item:focus-visible {
  background: var(--ui-bg-elevated);
  outline: none;
}
.op-invite {
  background: var(--ui-bg-elevated);
  color: var(--ui-text-highlighted);
  transition:
    background-color 150ms ease-out,
    color 150ms ease-out;
}
.op-item:hover .op-invite,
.op-item:focus-visible .op-invite {
  background: var(--ui-text-highlighted);
  color: var(--ui-bg);
}

/* The chosen card lands where Add was; removing it brings Add back the same way. */
.op-swap-enter-active {
  transition:
    opacity 220ms ease-out,
    transform 320ms cubic-bezier(0.34, 1.36, 0.64, 1);
}
.op-swap-leave-active {
  transition:
    opacity 120ms ease-in,
    transform 120ms ease-in;
}
.op-swap-enter-from {
  opacity: 0;
  transform: scale(0.92);
}
.op-swap-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

@media (prefers-reduced-motion: reduce) {
  .op-card,
  .op-add-circle,
  .op-add-icon,
  .op-swap-enter-active,
  .op-swap-leave-active {
    transition: none !important;
  }
}
</style>
