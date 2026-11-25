<template>
  <div class="flex flex-wrap gap-y-2">
    <div v-for="attachment in attachments" :key="attachment.id">
      <UrlCard
        v-if="attachment.type === 'url'"
        :id="attachment.id"
        class="mr-2 w-28 h-19"
        :url="attachment.data"
        :is-only-display="attachment.isOnlyDisplay"
        :is-removeable="attachment.isRemoveable"
        @delete="
          (id) => {
            urlsCounts--
            deleteCard(id)
          }
        "
      />
      <FileCard
        v-else
        :id="attachment.id"
        class="mr-2 w-28 h-19"
        :file="attachment.data"
        :is-only-display="attachment.isOnlyDisplay"
        :is-removeable="attachment.isRemoveable"
        @uploaded="addFileInstanceId"
        @error="addFileUploadError"
        @delete="deleteCard"
      />
    </div>
    <DropZone
      v-if="showDropZone"
      id="drop-zone"
      class="w-28 h-19"
      :step="0"
      :dont-allow-files="dontAllowFiles"
      :dont-allow-linkes="dontAllowLinkes"
      @input="addAttachment"
    />
  </div>
</template>

<script>
import DropZone from '~/components/Task/FileUploadStates/DropZone.vue'
import UrlCard from '~/components/Task/FileUploadStates/UrlCard.vue'
import FileCard from '~/components/Task/FileUploadStates/FileCard.vue'

export default {
  components: {
    DropZone,
    UrlCard,
    FileCard,
  },
  props: {
    links: {
      type: Array,
      required: false,
      default: () => [],
    },
    files: {
      type: Array,
      required: false,
      default: () => [],
    },
    isDisplayOnly: {
      type: Boolean,
      required: false,
      default: false,
    },
    dontAllowFiles: {
      type: Boolean,
      required: false,
      default: false,
    },
    dontAllowLinkes: {
      type: Boolean,
      required: false,
      default: false,
    },
    limit: {
      type: Number,
      required: false,
      default: -1,
    },
    isRemoveable: {
      type: Boolean,
      required: false,
      default: false,
    },
    fileId: {
      type: String,
      required: false,
      default: '',
    },
    urlId: {
      type: String,
      required: false,
      default: '',
    },
  },
  emits: ['delete', 'uploadState'],
  data() {
    return {
      attachmentsNextId: 0,
      attachments: [],
      uploadedFileInstanceIds: [],
      addedURL: [],
      fileUploadErrorsCount: 0,
      urlsCounts: 0,
      inputFileInstanceIds: [],
      inputUrlsInstanceIds: [],
    }
  },
  computed: {
    showDropZone() {
      return (
        !this.isDisplayOnly &&
        (this.limit === -1 ||
          this.limit >
            this.attachments.length + this.uploadedFileInstanceIds.length)
      )
    },
  },
  watch: {
    isDisplayOnly() {
      this.restAttachments()
    },

    links() {
      this.restAttachments()
    },

    files() {
      this.restAttachments()
    },
  },
  mounted() {
    if (this.links.length) {
      this.links.forEach((link) => {
        this.attachments.push({
          type: 'url',
          data: this.generateURL(link),
          isOnlyDisplay: this.isDisplayOnly,
          id: this.generateURLId(link),
          isRemoveable: !this.isDisplayOnly && this.isRemoveable,
        })
        this.inputUrlsInstanceIds.push(this.generateURLId(link))
        this.attachmentsNextId++
      })
    }
    if (this.files.length) {
      this.files.forEach((file) => {
        this.attachments.push({
          type: 'file',
          data: file,
          isOnlyDisplay: this.isDisplayOnly,
          id: this.generateFileId(file),
          isRemoveable: !this.isDisplayOnly && this.isRemoveable,
        })
        this.inputFileInstanceIds.push(this.generateFileId(file))
        this.attachmentsNextId++
      })
    }
  },
  methods: {
    restAttachments() {
      this.attachments = []
      this.inputFileInstanceIds = []
      this.inputUrlsInstanceIds = []
      this.uploadedFileInstanceIds = []
      this.addedURL = []
      if (this.links.length) {
        this.links.forEach((link) => {
          this.attachments.push({
            type: 'url',
            data: this.generateURL(link),
            isOnlyDisplay: this.isDisplayOnly,
            id: this.generateURLId(link),
            isRemoveable: !this.isDisplayOnly && this.isRemoveable,
          })
          this.inputUrlsInstanceIds.push(this.generateURLId(link))
          this.attachmentsNextId++
        })
      }
      if (this.files.length) {
        this.files.forEach((file) => {
          this.attachments.push({
            type: 'file',
            data: file,
            isOnlyDisplay: this.isDisplayOnly,
            id: this.generateFileId(file),
            isRemoveable: !this.isDisplayOnly && this.isRemoveable,
          })
          this.inputFileInstanceIds.push(this.generateFileId(file))
          this.attachmentsNextId++
        })
      }
    },
    generateFileId(file) {
      return this.fileId ? file[this.fileId] : this.attachmentsNextId
    },
    generateURLId(url) {
      return this.urlId ? url[this.urlId] : this.attachmentsNextId
    },

    generateURL(url) {
      if (typeof url === 'object') {
        return url.link
      }
      return url
    },

    addSlot() {
      this.attachmentsNextId++
    },
    addAttachment(data) {
      if (data.type === 'url') {
        this.addedURL.push(data.data)
        this.urlsCounts++
      }
      this.attachments.push({ ...data, id: this.attachmentsNextId })
      this.attachmentsNextId++
      this.validate()
    },
    addFileInstanceId(fileInstanceId) {
      this.uploadedFileInstanceIds.push(fileInstanceId)
      this.validate()
    },
    addFileUploadError() {
      this.fileUploadErrorsCount++
      this.validate()
    },
    deleteCard(id) {
      this.attachments = this.attachments.filter(
        (attachment) => attachment.id !== id,
      )
      if (this.inputFileInstanceIds.find((currentId) => id === currentId)) {
        this.$emit('delete', {
          type: 'file',
          id,
        })
      }

      if (this.inputUrlsInstanceIds.find((currentId) => id === currentId)) {
        this.$emit('delete', {
          type: 'url',
          id,
        })
      }

      this.validate()
    },
    validate() {
      const totalAssignmentsCount =
        this.addedURL.length +
        this.uploadedFileInstanceIds.length +
        this.fileUploadErrorsCount +
        this.inputFileInstanceIds.length +
        this.inputUrlsInstanceIds.length

      if (totalAssignmentsCount === this.attachments.length) {
        this.$emit('uploadState', {
          isReady: true,
          data: { filesId: this.uploadedFileInstanceIds, urls: this.addedURL },
        })
      } else {
        this.$emit('uploadState', false)
      }
    },
  },
}
</script>
