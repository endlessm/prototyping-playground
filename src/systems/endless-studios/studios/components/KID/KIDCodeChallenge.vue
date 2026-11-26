<script setup lang="ts">
const toast = useToast()
const { t } = useI18n()

const { code, challengeUrl } = defineProps<{
  code: string
  /** The k-ID family link for this challenge, used to derive the portal to send the adult to. */
  challengeUrl: string
}>()

/**
 * Where the trusted adult goes to type the code in.
 *
 * k-ID runs a separate family portal per environment and a code only works on
 * the one that issued it, so we take the destination from the challenge link
 * k-ID just gave us instead of naming a portal here. Test and staging then
 * reach their own portal rather than a production one that has never heard of
 * the code.
 * We still show `asktoplay.com`, k-ID's parent-facing name for the portal: it
 * redirects to the same place in production, and it is friendlier to read out
 * to an adult than a bare hostname.
 */
const portal = computed(() => {
  const { origin, pathname } = new URL(challengeUrl)
  return `${origin}${pathname}`
})

const copyCode = async () => {
  await navigator.clipboard.writeText(code)
  toast.add({ title: t('copied_to_clipboard'), color: 'success' })
}
</script>
<template>
  <UCard :ui="{ root: 'border border-default shadow-none' }">
    <template #default>
      <div class="mb-6">
        <p class="text-xs font-bold text-dimmed">
          {{ $t('kid_challenge.option', { number: 3 }) }}
        </p>
        <i18n-t
          keypath="kid_challenge.code_option_description"
          tag="p"
          class="text-sm font-medium mt-1"
        >
          <template #url>
            <NuxtLink
              :to="portal"
              :external="true"
              target="_blank"
              class="font-medium text-teal-600 underline"
            >
              asktoplay.com
            </NuxtLink>
          </template>
        </i18n-t>
      </div>
      <div class="flex justify-center gap-4">
        <p class="text-teal-600 text-4xl">
          {{ code }}
        </p>
        <UButton
          size="xl"
          color="neutral"
          variant="outline"
          icon="i-lucide-copy"
          :aria-label="$t('copy')"
          @click="copyCode"
        />
      </div>
    </template>
  </UCard>
</template>
