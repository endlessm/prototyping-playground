<template>
  <div
    class="p-1 border-1 border-gray-secondry rounded-xl"
    @mouseenter="showOptions"
    @mouseleave="hideOptions"
  >
    <PostImageModal
      v-if="isThisModalOpen(`attachment-image-view-${file.name}`)"
      :id="`attachment-image-view-${file.name}`"
      :image-url="file.file_url"
    />
    <div v-if="isHover">
      <img
        v-if="isOnlyDisplay && file.file_url"
        class="relative ml-auto w-7 h-7 p-1.5 option-image z-1"
        src="~/assets/images/Icons/download.svg"
        alt=""
        @click="downloadFile(file.file_url, file.name)"
      />

      <img
        v-else-if="isError"
        class="relative ml-auto w-7 h-7 p-1.5 option-image z-1"
        src="~/assets/images/Icons/retry.svg"
        alt=""
        @click="reUpload"
      />
      <img
        v-else
        class="relative ml-auto w-7 h-7 p-1.5 option-image z-1"
        src="~/assets/images/Icons/trash.svg"
        alt=""
        @click="deleteCard"
      />
    </div>

    <section
      class="flex flex-col items-center justify-center gap-1"
      :class="isHover ? '-mt-5 ' : 'mt-2'"
    >
      <CircularProgress
        v-if="!isDone && !isOnlyDisplay && !isRemoveable"
        class="w-7 h-7"
        :progress="progress"
        :is-error="isError"
      />
      <img
        v-else
        class="mt-1 w-6 h-6 p-1"
        src="~/assets/images/Icons/attachment.svg"
        alt=""
        @click="viewImage()"
      />
      <UTooltip
        :text="file.name"
        :disabled="!file.name"
        :content="{ side: 'top' }"
      >
        <p
          class="w-4/5 font-semibold text-caption-2 leading-caption-2 text-center truncate"
        >
          {{ file.name }}
        </p>
      </UTooltip>
    </section>
  </div>
</template>

<script>
import axios from 'axios'
import PostImageModal from '~/components/CommunityFeed/PostImageModal.vue'
import CircularProgress from '~/components/Generic/CircularProgress.vue'
import { uploadFileToS3 } from '~/plugins/custom/fileUpload.js'

const ACCEPTED_IMAGE_TYPES = ['image/gif', 'image/jpeg', 'image/png']

export default {
  components: {
    CircularProgress,
    PostImageModal,
  },
  props: {
    id: {
      type: Number,
      required: true,
    },
    file: {
      type: Object,
      required: true,
    },
    isOnlyDisplay: {
      type: Boolean,
      required: false,
      default: false,
    },
    isRemoveable: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  emits: ['delete', 'uploaded', 'error'],
  data() {
    return {
      isHover: false,
      isDone: false,
      isError: false,
      progress: 0,
      request: axios.CancelToken.source(),
    }
  },

  mounted() {
    if (!this.isOnlyDisplay && !this.isRemoveable) {
      this.upload()
    }
  },
  unmounted() {
    this.request.cancel('canceled')
  },

  methods: {
    showOptions() {
      this.isHover = true
    },
    hideOptions() {
      this.isHover = false
    },
    deleteCard() {
      this.$emit('delete', this.id)
    },
    reUpload() {
      this.upload()
    },
    viewImage() {
      if (!ACCEPTED_IMAGE_TYPES.includes(this.file.mime_type)) {
        return
      }
      this.openModal(`attachment-image-view-${this.file.name}`)
    },

    async upload() {
      this.isError = false

      try {
        const fileInstanceId = await uploadFileToS3(
          this.file,
          this.$graphqlRequest,
          this.updateProgress,
          this.request.token,
        )
        this.$emit('uploaded', fileInstanceId)
      } catch {
        this.isError = true
        this.$emit('error', this.id)
      }
    },

    updateProgress(progressEvent) {
      this.progress = parseInt(
        Math.round((progressEvent.loaded / progressEvent.total) * 100),
      )
      if (this.progress === 100) {
        setTimeout(() => {
          this.isDone = true
        }, 400)
      }
    },
  },
}
</script>

<style scoped>
@reference "~/assets/css/main.css";
.option-image {
  @apply rounded-full object-cover cursor-pointer;
  &:hover {
    background-color: rgba(0, 0, 0, 0.06);
  }
}
.input {
  @apply border rounded-md flex;
  width: 271px;
}
</style>
