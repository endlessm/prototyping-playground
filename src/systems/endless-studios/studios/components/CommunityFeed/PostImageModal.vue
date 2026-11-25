<template>
  <ModalTemplate
    :id="id"
    :show-mobile-close-btn="false"
    modal-classes="rounded-2xl"
    @close="closeModals"
    @click-outside="closeModals"
  >
    <div class="w-2xl min-h-full max-w-2xl">
      <img
        class="w-full object-contain"
        :src="imageUrl"
        alt="post-attached-image"
      />
    </div>
  </ModalTemplate>
</template>

<script>
import ModalTemplate from '~/components/Generic/ModalTemplate.vue'

export default {
  components: {
    ModalTemplate,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: false,
      default: '',
    },
  },
}
</script>
