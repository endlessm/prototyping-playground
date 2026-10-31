<script setup lang="ts">
import directory from '#studio/directory'

// The welcome: a few short steps for the Endless team, one idea each. The
// Endless Studios and canvas steps appear only when the studio has them.
// "Explore my studio", "Skip introduction", Escape and a click outside all
// finish it; it was recorded as shown when it opened. Opened through
// useOverlay from Home.
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const studio = useStudioConfig()
const manual = !!useStudioModule('documentation')

const steps = [
  {
    id: 'welcome',
    icon: 'i-lucide-sparkles',
    title: t('welcome.welcome.title', { name: studio.name }),
  },
  ...(directory.systems.some(({ key }) => key === 'endless-studios')
    ? [{ id: 'screens', icon: 'i-lucide-app-window' }]
    : []),
  ...(useStudioModule('canvas')
    ? [{ id: 'canvas', icon: 'i-lucide-layout-dashboard' }]
    : []),
  { id: 'agent', icon: 'i-lucide-message-square-text' },
  { id: 'explore', icon: 'i-lucide-compass' },
].map((step) => ({
  ...step,
  title: 'title' in step ? step.title : t(`welcome.${step.id}.title`),
  text: t(`welcome.${step.id}.text`),
}))
const index = ref(0)
const step = computed(() => steps[index.value]!)
const last = computed(() => index.value === steps.length - 1)
const finish = () => emit('close')
function back() {
  index.value -= 1
}
function forward() {
  if (last.value) finish()
  else index.value += 1
}
</script>

<template>
  <UModal
    :title="step.title"
    :close="false"
    :ui="{
      content: 'divide-y-0 sm:max-w-lg',
      header: 'flex-col-reverse items-start gap-5 sm:px-8 sm:pt-8',
      title: 'text-2xl font-semibold tracking-tight',
      body: 'sm:px-8',
      footer: 'justify-between sm:px-8 sm:pb-8',
    }"
    @update:open="(open: boolean) => !open && finish()"
  >
    <template #actions>
      <div
        role="progressbar"
        :aria-label="t('welcome.progress')"
        aria-valuemin="1"
        :aria-valuemax="steps.length"
        :aria-valuenow="index + 1"
        :aria-valuetext="step.title"
        class="flex h-2 items-center gap-2"
      >
        <span
          v-for="(item, i) in steps"
          :key="item.id"
          aria-hidden="true"
          class="h-1.5 rounded-full transition-all motion-reduce:transition-none"
          :class="
            i === index
              ? 'w-6 bg-inverted'
              : i < index
                ? 'w-1.5 bg-inverted/40'
                : 'w-1.5 bg-accented'
          "
        />
      </div>
    </template>
    <template #body>
      <div class="flex min-h-56 flex-col justify-center gap-6">
        <UIcon :name="step.icon" class="size-12 text-muted" />
        <p class="text-base leading-relaxed text-default">{{ step.text }}</p>
        <p v-if="step.id === 'agent' && manual" class="text-sm">
          <ULink
            to="/documentation/manual/agent"
            class="text-primary underline underline-offset-4"
            @click="finish"
          >
            {{ t('welcome.agent.manual') }}
          </ULink>
        </p>
        <p
          v-if="step.id === 'explore' && manual"
          class="text-base leading-relaxed text-default"
        >
          {{ t('welcome.explore.manual') }}
        </p>
      </div>
    </template>
    <template #footer>
      <UButton
        color="neutral"
        variant="ghost"
        :label="t('welcome.skip')"
        @click="finish"
      />
      <div class="flex gap-2">
        <UButton
          v-if="index > 0"
          color="neutral"
          variant="ghost"
          :label="t('welcome.back')"
          @click="back"
        />
        <UButton
          :label="
            index === 0
              ? t('welcome.start')
              : last
                ? t('welcome.finish')
                : t('welcome.next')
          "
          trailing-icon="i-lucide-arrow-right"
          @click="forward"
        />
      </div>
    </template>
  </UModal>
</template>
