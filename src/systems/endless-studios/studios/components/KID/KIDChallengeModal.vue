<script setup lang="ts">
import KIDCodeChallenge from './KIDCodeChallenge.vue'
import KIDEmailOption from './KIDEmailOption.vue'
import KIDQRCodeOption from './KIDQRCodeOption.vue'
import { REQUEST_PARENTAL_CONSENT } from '~/graphql_schemas/parentalConsent'
import { useBackendError } from '~/composables/useBackendError'
import { useParentalConsentPolling } from '~/composables/useParentalConsentPolling'

export type KidChallengeModalResult = {
  outcome: 'granted' | 'denied' | 'dismissed'
}

interface ParentalConsentChallenge {
  challengeId: string
  oneTimePassword: string
  type: string
  url: string
  otpExpiresAt: string
}

const { action } = defineProps<{
  action: string
}>()

const emit = defineEmits<{
  close: [result?: KidChallengeModalResult]
}>()

const { t } = useI18n()
const toast = useToast()
const { $graphqlRequest } = useNuxtApp()
const { showBackendErrorToast } = useBackendError()

const isOpen = ref(true)
const challenge = ref<ParentalConsentChallenge | null>(null)
const loading = ref(false)

const pollingEnabled = computed(() => isOpen.value && challenge.value != null)
const challengeId = computed(() => challenge.value?.challengeId)

// Start (or resume) the k-ID challenge so the dialog shows a live OTP and QR
// URL. requestParentalConsent reuses an existing challenge and refreshes an
// expired OTP, so it is safe to call each time the overlay mounts this modal.
async function loadChallenge() {
  loading.value = true
  try {
    const { data } = await $graphqlRequest.mutate<{
      requestParentalConsent: ParentalConsentChallenge
    }>(REQUEST_PARENTAL_CONSENT)
    challenge.value = data.requestParentalConsent
  } catch (err) {
    showBackendErrorToast(err instanceof Error ? err.message : undefined)
  } finally {
    loading.value = false
  }
}

function closeModal(result?: KidChallengeModalResult) {
  isOpen.value = false
  emit('close', result)
}

useParentalConsentPolling({
  enabled: pollingEnabled,
  challengeId,
  onGranted: () => closeModal({ outcome: 'granted' }),
  onDenied: () => {
    toast.add({ title: t('kid_challenge.consent_denied'), color: 'error' })
    challenge.value = null
    loadChallenge()
  },
})

onMounted(() => {
  loadChallenge()
})
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :ui="{
      header: 'hidden',
      body: '!p-0',
      content: 'w-full max-w-[57.75rem] p-6 pb-0 bg-gating-gradient',
    }"
    @update:open="(open) => !open && closeModal({ outcome: 'dismissed' })"
  >
    <template #body>
      <div>
        <div class="relative z-1">
          <h3 class="text-xl font-bold text-highlighted text-center">
            {{ $t('kid_challenge.title') }}
          </h3>
          <i18n-t
            keypath="kid_challenge.description"
            tag="p"
            class="text-sm text-muted text-center mt-2"
          >
            <template #action>
              <span class="font-bold">{{ action }}</span>
            </template>
          </i18n-t>
          <div v-if="loading || !challenge" class="flex justify-center py-16">
            <UIcon
              name="i-lucide-loader-circle"
              class="size-8 animate-spin text-teal-600"
            />
          </div>
          <section
            v-else
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-[1.5rem]"
          >
            <KIDEmailOption />
            <KIDQRCodeOption :qr-code-url="challenge.url" />
            <KIDCodeChallenge
              :code="challenge.oneTimePassword"
              :challenge-url="challenge.url"
            />
          </section>
          <div class="flex justify-end mt-6 border-t border-slate-200 py-4">
            <UButton
              class="border border-teal-500/50 text-teal-700"
              size="xl"
              variant="outline"
              color="kids"
              @click="closeModal({ outcome: 'dismissed' })"
              >{{ $t('kid_challenge.do_this_later') }}</UButton
            >
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
