<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
import { people } from '../../../../_wire/world'
import type { Member } from '../../Org Chart/_chart/district'
import { flyFace } from './flyFace'

// A position's people as a row of faces, the Avatars option from the Figma exploration. Each face carries its first
// name; an invited one is dashed with a mail badge, and pointing at a face shows a remove badge, since a click takes
// the person off. Add, last in the row, opens the Organization's people with a search that also takes an email:
// clicking a row adds or removes that person, and an email nobody has becomes Invite. The list stays open for more.
// A person added from the list flies from their row into the row of faces.
const members = defineModel<Member[]>({ required: true })
const props = defineProps<{ role: string; title: string }>()

const district = [people.daniel, people.kevin, people.ben, people.aisha, people.priya, people.sofia, people.marcus, people.linda]

const uid = useId()
const open = ref(false)
const query = ref('')
const input = ref<{ inputRef?: HTMLInputElement }>()

const term = computed(() => query.value.trim().toLowerCase())
const isEmail = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(term.value))
const held = (email: string) => members.value.some((m) => m.email === email)

// Everyone the list can offer: the Organization's people, plus anyone already holding the position from outside it.
const everyone = computed(() => [
  ...district,
  ...members.value.filter((m) => !district.some((p) => p.email === m.email)),
])
const found = computed(() =>
  everyone.value.filter((p) => !term.value || `${p.name} ${p.email}`.toLowerCase().includes(term.value)),
)
const offerInvite = computed(() => isEmail.value && !everyone.value.some((p) => p.email === term.value))

watch(open, async (isOpen) => {
  if (!isOpen) return
  query.value = ''
  await nextTick()
  input.value?.inputRef?.focus()
})

function toggle(person: (typeof everyone.value)[number], event?: Event) {
  if (held(person.email)) {
    members.value = members.value.filter((m) => m.email !== person.email)
  } else {
    const from = (event?.currentTarget as HTMLElement | undefined)?.querySelector('.ap-row-face')
    members.value = [...members.value, { ...person, invited: true, how: 'Invited by you just now' }]
    flyFace(from, () => from?.ownerDocument.querySelector<HTMLElement>(`[data-face="${uid}-${person.email}"] .ap-circle`))
  }
  input.value?.inputRef?.focus({ preventScroll: true })
}

function invite() {
  const email = term.value
  const words = email
    .split('@')[0]!
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
  members.value = [
    ...members.value,
    {
      name: words.join(' ') || email,
      initials: words.map((w) => w[0]).join('').slice(0, 2) || email.slice(0, 2).toUpperCase(),
      email,
      invited: true,
      how: 'Invited by you just now',
    },
  ]
  query.value = ''
  input.value?.inputRef?.focus()
}

function submit() {
  if (offerInvite.value) invite()
  else if (found.value.length) toggle(found.value[0]!)
}

const first = (m: Member) => m.name.split(' ')[0]
</script>

<template>
  <TransitionGroup tag="ul" name="ap" class="ap-row" :aria-label="title">
    <li v-for="m in members" :key="m.email" class="ap-item" :data-face="`${uid}-${m.email}`">
      <button
        type="button"
        class="ap-face"
        :aria-label="`Remove ${m.name} as ${props.role}${m.invited ? ', invited' : ''}`"
        @click="members = members.filter((x) => x.email !== m.email)"
      >
        <span class="ap-circle" :class="{ 'ap-invited': m.invited }">
          <UAvatar
            :src="m.photo"
            :text="m.initials"
            :alt="m.name"
            size="3xl"
            class="size-12 bg-secondary-50 text-secondary-700"
            :ui="{ fallback: 'text-sm font-medium' }"
          />
        </span>
        <span v-if="m.invited" class="ap-badge ap-mail" aria-hidden="true"><UIcon name="i-lucide-mail" class="size-2.5" /></span>
        <span class="ap-badge ap-x" aria-hidden="true"><UIcon name="i-lucide-x" class="size-2.5" /></span>
        <span class="ap-name">{{ first(m) }}</span>
      </button>
    </li>

    <li key="__add" class="ap-item">
      <UPopover
        v-model:open="open"
        :content="{ side: 'bottom', align: 'start', sideOffset: 8 }"
        :ui="{ content: 'w-80 p-0 overflow-hidden' }"
      >
        <button type="button" class="ap-face ap-add" :data-open="open" :aria-label="`Add ${title}`">
          <span class="ap-circle ap-add-circle"><UIcon name="i-lucide-plus" class="ap-add-icon size-5" /></span>
          <span class="ap-name">Add</span>
        </button>

        <template #content>
          <form class="flex flex-col gap-2 border-b border-default p-3" @submit.prevent="submit">
            <UInput
              ref="input"
              v-model="query"
              icon="i-lucide-search"
              placeholder="Search a name or type an email"
              :aria-label="`Search the Organization or type an email to add ${title}`"
              class="w-full"
            />
          </form>

          <div class="max-h-72 overflow-y-auto">
            <template v-if="offerInvite">
              <p class="ap-section">Not in the Organization yet</p>
              <button type="button" class="ap-row-item" @click="invite">
                <span class="flex size-9 flex-none items-center justify-center rounded-full border border-dashed border-accented bg-elevated">
                  <UIcon name="i-lucide-mail" class="size-4 text-muted" />
                </span>
                <span class="flex min-w-0 flex-1 flex-col text-left">
                  <span class="truncate text-sm font-medium text-highlighted">{{ term }}</span>
                  <span class="truncate text-xs text-muted">We'll email them an invite</span>
                </span>
                <span class="ap-invite rounded-md px-2 py-0.5 text-xs font-medium">Invite</span>
              </button>
            </template>

            <template v-else-if="found.length">
              <p class="ap-section">In the Organization</p>
              <button
                v-for="p in found"
                :key="p.email"
                type="button"
                class="ap-row-item"
                :data-on="held(p.email)"
                :aria-pressed="held(p.email)"
                @click="toggle(p, $event)"
              >
                <UAvatar :src="p.photo" :text="p.initials" :alt="p.name" size="md" class="ap-row-face" />
                <span class="flex min-w-0 flex-1 flex-col text-left">
                  <span class="truncate text-sm font-medium text-highlighted">{{ p.name }}</span>
                  <span class="truncate text-xs text-muted">{{ p.email }}</span>
                </span>
                <span class="ap-check" aria-hidden="true">
                  <UIcon v-if="held(p.email)" name="i-lucide-check" class="size-3" />
                </span>
              </button>
            </template>

            <p v-else class="px-3 py-8 text-center text-sm text-muted">No one found. Type their email to invite them.</p>
          </div>
        </template>
      </UPopover>
    </li>
  </TransitionGroup>
</template>

<style scoped>
.ap-row {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 16px;
}
.ap-item {
  display: flex;
}

/* Faces and Add grow a little under the pointer and give a little when pressed, on a spring. */
.ap-face {
  position: relative;
  display: flex;
  width: 52px;
  cursor: pointer;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
@media (hover: hover) and (pointer: fine) {
  .ap-face:hover {
    transform: scale(1.05);
  }
}
.ap-face:active {
  transform: scale(0.95);
}
.ap-face:focus-visible {
  outline: none;
}
.ap-face:focus-visible .ap-circle {
  outline: 2px solid var(--ui-secondary);
  outline-offset: 2px;
}

.ap-circle {
  display: flex;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 999px;
}
.ap-invited {
  outline: 1.5px dashed color-mix(in oklab, var(--ui-text-highlighted) 45%, transparent);
  outline-offset: 2px;
}
.ap-name {
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  color: var(--ui-text-highlighted);
}

.ap-badge {
  position: absolute;
  top: 31px;
  right: 0;
  display: flex;
  width: 16px;
  height: 16px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--ui-text-highlighted);
  color: var(--ui-bg);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.15);
  transition:
    opacity 150ms ease-out,
    transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.ap-x {
  opacity: 0;
  transform: scale(0.5);
}
.ap-face:hover .ap-x,
.ap-face:focus-visible .ap-x {
  opacity: 1;
  transform: none;
}
.ap-face:hover .ap-mail,
.ap-face:focus-visible .ap-mail {
  opacity: 0;
}

.ap-add-circle {
  border: 2px dashed color-mix(in oklab, var(--ui-text-muted) 40%, transparent);
  color: var(--ui-text-muted);
  transition:
    border-color 200ms ease-out,
    background-color 200ms ease-out,
    color 200ms ease-out;
}
.ap-add .ap-name {
  color: var(--ui-text-muted);
}
@media (hover: hover) and (pointer: fine) {
  .ap-add:hover .ap-add-circle {
    border-color: color-mix(in oklab, var(--ui-text-muted) 60%, transparent);
    background: var(--ui-bg-elevated);
  }
}
.ap-add[data-open='true'] .ap-add-circle {
  border-color: var(--ui-text-highlighted);
  background: color-mix(in oklab, var(--ui-text-highlighted) 8%, transparent);
  color: var(--ui-text-highlighted);
}
.ap-add[data-open='true'] .ap-name {
  color: var(--ui-text-highlighted);
}
.ap-add-icon {
  transition: transform 200ms ease-out;
}
.ap-add[data-open='true'] .ap-add-icon {
  transform: rotate(45deg);
}

.ap-section {
  padding: 10px 12px 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  color: var(--ui-text-muted);
}
.ap-row-item {
  display: flex;
  width: 100%;
  cursor: pointer;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  transition: background-color 150ms ease-out;
}
.ap-row-item:hover,
.ap-row-item:focus-visible {
  background: var(--ui-bg-elevated);
  outline: none;
}
.ap-row-item[data-on='true'] {
  background: color-mix(in oklab, var(--ui-text-highlighted) 5%, transparent);
}
.ap-check {
  display: flex;
  width: 20px;
  height: 20px;
  flex: none;
  align-items: center;
  justify-content: center;
  border: 2px solid color-mix(in oklab, var(--ui-text-muted) 30%, transparent);
  border-radius: 999px;
  color: var(--ui-bg);
  transition:
    background-color 200ms ease-out,
    border-color 200ms ease-out;
}
.ap-row-item[data-on='true'] .ap-check {
  border-color: var(--ui-text-highlighted);
  background: var(--ui-text-highlighted);
}
.ap-invite {
  background: var(--ui-bg-elevated);
  color: var(--ui-text-highlighted);
  transition:
    background-color 150ms ease-out,
    color 150ms ease-out;
}
.ap-row-item:hover .ap-invite,
.ap-row-item:focus-visible .ap-invite {
  background: var(--ui-text-highlighted);
  color: var(--ui-bg);
}

/* A face pops in where it lands and shrinks away when removed; the rest slide over. */
.ap-enter-active {
  transition:
    opacity 200ms ease-out,
    transform 360ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.ap-leave-active {
  position: absolute;
  transition:
    opacity 150ms ease-in,
    transform 150ms ease-in;
}
.ap-enter-from,
.ap-leave-to {
  opacity: 0;
  transform: scale(0.6);
}
.ap-move {
  transition: transform 300ms cubic-bezier(0.34, 1.36, 0.64, 1);
}

@media (prefers-reduced-motion: reduce) {
  .ap-face,
  .ap-badge,
  .ap-add-circle,
  .ap-add-icon,
  .ap-check,
  .ap-enter-active,
  .ap-leave-active,
  .ap-move {
    transition: none !important;
  }
}
</style>
