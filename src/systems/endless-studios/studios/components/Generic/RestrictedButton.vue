<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'

defineOptions({ inheritAttrs: false })

const {
  restrictedPartner = false,
  vpc = false,
  vpcAction = '',
} = defineProps<{
  restrictedPartner?: boolean
  vpc?: boolean
  vpcAction?: string
}>()

const emit = defineEmits<{
  vpcGranted: []
}>()

const attrs = useAttrs()
const { $auth } = useNuxtApp()
const { t } = useI18n()

const overlay = useOverlay()
const asyncRestrictedPartnerInfoModal = defineAsyncComponent(
  () =>
    import(
      '~/components/RestrictedPartnerAccount/RestrictedPartnerInfoModal.vue'
    ),
)
const asyncKidChallengeModal = defineAsyncComponent(
  () => import('~/components/KID/KIDChallengeModal.vue'),
)
const restrictedPartnerModal = overlay.create(asyncRestrictedPartnerInfoModal)
const kidChallengeModal = overlay.create(asyncKidChallengeModal)

function handleRestrictedClick(event: MouseEvent) {
  event.preventDefault()
  restrictedPartnerModal.open({
    institution: $auth.user?.institutions?.[0]?.name,
  })
}

async function handleVpcClick(event: MouseEvent) {
  event.preventDefault()
  const result = await kidChallengeModal.open({ action: vpcAction })
  if (result?.outcome === 'granted') {
    emit('vpcGranted')
  }
}

const isRestricted = computed(() => restrictedPartner || vpc)

const tooltipText = computed(() => {
  if (restrictedPartner) {
    return t(
      'restricted_partner_data.restricted_feature_click_for_more_information',
    )
  }
  if (vpc) {
    return t('kid_challenge.restricted_feature_click_for_more_information')
  }
  return ''
})

const restrictedAttrs = computed<ButtonProps>(() => {
  if (restrictedPartner || vpc) {
    return {
      variant: 'gating',
      color: 'kids',
      trailingIcon: vpc ? 'i-lucide-shield' : 'i-lucide-lock',
      onClick: vpc ? handleVpcClick : handleRestrictedClick,
    }
  }
  return {}
})
</script>

<template>
  <UTooltip
    :disabled="!isRestricted"
    :text="tooltipText"
    :delay-duration="0"
    :content="{ side: 'top' }"
  >
    <UButton v-bind="{ ...attrs, ...restrictedAttrs }">
      <slot />
    </UButton>
  </UTooltip>
</template>
