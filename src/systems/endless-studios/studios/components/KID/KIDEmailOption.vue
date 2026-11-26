<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import { useBackendError } from '~/composables/useBackendError'
import { SEND_PARENTAL_CONSENT_EMAIL } from '~/graphql_schemas/parentalConsent'

const { t } = useI18n()
const toast = useToast()
const { $graphqlRequest } = useNuxtApp()
const { showBackendErrorToast } = useBackendError()
const RESEND_COOLDOWN_SECONDS = 60
const schema = z.object({
  email: z.string().email(t('invalid_email_address')),
})

type Schema = z.output<typeof schema>

const state = reactive({
  email: '',
  loading: false,
  timeLeft: 0,
  timer: null as ReturnType<typeof setInterval> | null,
})

function startTimer() {
  if (state.timer) {
    clearInterval(state.timer)
  }

  state.timeLeft = RESEND_COOLDOWN_SECONDS

  state.timer = setInterval(() => {
    if (state.timeLeft > 0) {
      state.timeLeft -= 1
    }

    if (state.timeLeft <= 0 && state.timer) {
      clearInterval(state.timer)
      state.timer = null
    }
  }, 1000)
}

async function sendEmail(email: string) {
  state.loading = true
  try {
    await $graphqlRequest.mutate(SEND_PARENTAL_CONSENT_EMAIL, { email })
    toast.add({ title: t('email_sent_successfully'), color: 'success' })
    state.timeLeft = RESEND_COOLDOWN_SECONDS
    startTimer()
  } catch (err) {
    showBackendErrorToast(err instanceof Error ? err.message : undefined)
  } finally {
    state.loading = false
  }
}

function onSubmit(event: FormSubmitEvent<Schema>) {
  sendEmail(event.data.email)
}
</script>
<template>
  <UCard :ui="{ root: 'border border-default shadow-none' }">
    <template #default>
      <div class="mb-6">
        <p class="text-xs font-bold text-dimmed">
          {{ $t('kid_challenge.option', { number: 1 }) }}
        </p>
        <p class="text-sm font-medium mt-1">
          {{ $t('kid_challenge.email_option_description') }}
        </p>
      </div>
      <UForm :schema="schema" :state="state" class="" @submit="onSubmit">
        <UFormField
          :label="$t('email')"
          name="email"
          :ui="{
            label: 'text-xs text-toned',
          }"
        >
          <UInput
            v-model="state.email"
            :placeholder="$t('email_address')"
            icon="i-lucide-mail"
            class="w-full"
            :ui="{
              leadingIcon: 'text-highlighted',
            }"
          />
        </UFormField>
        <p v-if="state.timeLeft > 0" class="text-xs text-muted mt-1">
          {{ $t('resend_email_in_seconds', { timeLeft: state.timeLeft }) }}
        </p>
        <UButton
          class="mt-4 bg-teal-600"
          type="submit"
          color="kids"
          size="xl"
          :loading="state.loading"
          :disabled="state.timeLeft > 0"
        >
          {{ state.loading ? $t('sending') : $t('submit') }}
        </UButton>
      </UForm>
    </template>
  </UCard>
</template>
