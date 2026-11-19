<script setup lang="ts">
import { computed, ref } from 'vue'
import { useOrgChart, type Member, type Place, type Position } from './district'

// What opens from a person on the chart: who they are, every position they hold in the Organization, how they came
// to this one, and Remove for the positions the viewer may take away. The trigger is the slot.
const props = defineProps<{ place: Place; position: Position; member: Member }>()

const chart = useOrgChart()
const open = ref(false)
const removal = computed(() => chart.removal(props.position, props.member))
const held = computed(() => chart.rolesOf(props.member.email))

function remove() {
  open.value = false
  chart.remove(props.place, props.position, props.member)
}
</script>

<template>
  <UPopover v-model:open="open" :content="{ side: 'bottom', align: 'start' }" :ui="{ content: 'w-72 p-4' }">
    <slot />
    <template #content>
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <UAvatar :text="member.initials" :alt="member.name" size="lg" class="bg-secondary-50 text-secondary-700" />
          <div class="min-w-0">
            <p class="text-sm font-semibold text-highlighted">
              {{ member.name }}<span v-if="member.you" class="font-normal text-muted"> (you)</span>
            </p>
            <p class="email text-sm text-muted">{{ member.email }}</p>
          </div>
        </div>

        <ul class="held">
          <li v-for="h in held" :key="`${h.place}/${h.role}`" class="text-sm">
            <span class="flex-none font-medium text-highlighted">{{ h.role }}</span>
            <span class="text-muted">{{ h.place }}</span>
          </li>
        </ul>

        <div class="flex items-center gap-2 text-sm text-muted">
          <UBadge v-if="member.invited" color="info" variant="soft">Invited</UBadge>
          <span>{{ member.how }}</span>
        </div>

        <UButton
          v-if="removal === 'allowed'"
          color="error"
          variant="soft"
          size="sm"
          icon="i-lucide-user-minus"
          class="justify-center"
          @click="remove"
        >
          {{ member.invited ? 'Cancel Invite' : `Remove as ${position.role}` }}
        </UButton>
        <UTooltip v-else-if="removal === 'lastOwner'" :text="`Add another ${position.role} first`" :delay-duration="150">
          <span class="flex">
            <UButton color="neutral" variant="soft" size="sm" icon="i-lucide-user-minus" class="flex-1 justify-center" disabled>
              Remove as {{ position.role }}
            </UButton>
          </span>
        </UTooltip>
      </div>
    </template>
  </UPopover>
</template>

<style scoped>
.email {
  word-break: break-all;
}

.held {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.held li {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
</style>
