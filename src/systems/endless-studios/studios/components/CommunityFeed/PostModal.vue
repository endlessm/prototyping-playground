<template>
  <ModalTemplate
    :id="id"
    :show-mobile-close-btn="false"
    modal-classes="rounded-2xl"
    @close="closeModals"
    @click-outside="closeModals"
  >
    <div class="post">
      <div class="relative">
        <img
          src="~/assets/images/X.svg"
          class="absolute top-0 right-0 p-1 w-6 h-6 cursor-pointer bg-white rounded-full md:hidden"
          @click="closeModals"
        />
      </div>
      <h2 class="font-bold text-h5 leading-h5 truncate;">
        {{ $t('create_post') }}
      </h2>
      <div class="mt-8 form-group">
        <label class="label">{{ $t('post_type') }}</label>
        <select
          id="post-type"
          v-model="postData.type"
          class="form-control progress-options-menu input"
          aria-placeholder="Select"
        >
          <option value="" disabled selected>
            {{ $t('select_an_option') }}
          </option>
          <option v-if="$auth.isLeader" value="announcement">
            {{ $t('announcement') }}
          </option>
          <option value="progress">{{ $t('progress_updates') }}</option>
          <option value="question">{{ $t('questions') }}</option>
          <option value="tip">{{ $t('tip') }}</option>
          <option value="misc">{{ $t('misc') }}</option>
        </select>
      </div>

      <div class="form-group">
        <label class="label">{{ $t('description') }}</label>
        <section class="input">
          <client-only>
            <RichTextEditor
              id="post-description"
              v-model="postData.desc"
              class="input input__description mt-3"
              :placeholder="$t('description')"
              :mention-source="mentionSource"
            />
          </client-only>
        </section>
      </div>

      <div class="mt-5">
        <label class="label">{{ $t('post_image') }} </label>
        <div
          class="form-control attachement-field input cursor-pointer"
          @click="selectFile"
        >
          {{ postData.fileName }}

          <input
            id="post-image-input"
            class="hidden"
            type="file"
            accept="image/png, image/gif, image/jpeg"
            @change="onSelectImage"
          />
          <img
            class="ml-auto float-right"
            src="~/assets/images/Icons/file.svg"
            alt=""
          />
        </div>
      </div>

      <div class="mt-5">
        <label class="label">{{ $t('tags') }}</label>
        <div class="flex">
          <input
            id="post-tags"
            v-model="postData.tags"
            class="form-control attachement-field input"
            type="text"
            placeholder="Enter tags separated by commas"
          />
        </div>
      </div>

      <div class="mt-6 w-full flex justify-between items-center h-12">
        <section class="flex gap-1">
          <ProgramDropdown
            v-if="hasProgramSelector"
            class="mr-2"
            :default-option="$t('home_page')"
            @program-change="updateSelectedProgram"
          />
          <button
            id="submit"
            class="float-right w-44 py-3.25 px-3.5 tailwind-btn tailwind-btn-orange max-xsm:-mt-4"
            :disabled="isUploadButtonDisabled"
            @click="createPost()"
          >
            {{ $t('upload_post') }}
          </button>
        </section>
      </div>
    </div>
  </ModalTemplate>
</template>

<script>
import { gql } from 'graphql-request'
import RichTextEditor from '~/components/Generic/inputs/RichTextEditor.vue'
import ProgramDropdown from '~/components/dropdown/ProgramDropdown.vue'
import ModalTemplate from '~/components/Generic/ModalTemplate.vue'

const GET_POST_MENTION_USERS = gql`
  query GET_POST_MENTION_USERS($objectId: Int!, $username: String!) {
    users: getUsersAssociatedToObject(
      input: { object_id: $objectId, username: $username, limit: 10 }
    ) {
      id
      username
    }
  }
`

export default {
  components: {
    ModalTemplate,
    ProgramDropdown,
    RichTextEditor,
  },
  props: {
    id: {
      type: String,
      required: false,
      default: 'new-post',
    },
    post: {
      type: Object,
      default: undefined,
    },
    hasProgramSelector: {
      type: Boolean,
      required: false,
      default: false,
    },
    feedObjectId: {
      type: Number,
      required: false,
      default: null,
    },
  },
  emits: ['done'],
  data() {
    return {
      postData: {
        type: '',
        desc: '',
        file: null,
        tags: null,
        fileName: this.$t('select_your_image'),
      },
      submitButtomDisabled: false,
    }
  },

  computed: {
    isUploadButtonDisabled() {
      if (!this.postData.objectId && this.hasProgramSelector) {
        return true
      }
      if (this.postData.type.trim().length === 0) {
        return true
      }
      if (this.postData.desc.trim().length === 0) {
        return true
      }
      return this.submitButtomDisabled
    },
  },

  mounted() {
    if (this.post) {
      const image_url = this.post.image_url

      this.postData = {
        type: this.post.object_feed_type_id,
        desc: this.post.description,
        file: image_url || '',
        tags: this.post.tags,
        fileName: this.$t('change_image'),
      }
    }
  },
  methods: {
    async mentionSource(query) {
      if (this.feedObjectId === null) return []
      const result = await this.$graphqlRequest.query(GET_POST_MENTION_USERS, {
        objectId: this.feedObjectId,
        username: query,
      })
      return result.data.users.map((user) => ({
        id: user.id,
        label: user.username,
      }))
    },
    updateSelectedProgram(objectId) {
      this.postData = { ...this.postData, objectId }
    },
    selectFile() {
      document.getElementById('post-image-input')?.click()
    },
    onSelectImage(event) {
      this.postData.file = event.target.files[0]
      this.postData.fileName = event.target.files[0].name
    },
    createPost() {
      this.submitButtomDisabled = true
      this.$emit('done', this.postData)
      this.closeModals()
      this.submitButtomDisabled = false
      this.postData = {
        type: '',
        desc: '',
        file: null,
        tags: null,
        fileName: this.$t('select_your_image'),
      }
    },
  },
}
</script>

<style scoped>
@reference "~/assets/css/main.css";
.input {
  @apply mt-2.5! rounded-md!;
}
</style>

<style scoped>
@reference "~/assets/css/main.css";
.modal-dialog {
  @apply w-fit;
  min-width: fit-content;
  max-width: fit-content;
  @variant max-md {
    @apply max-w-full m-0;
  }
}

.post {
  @apply p-10 rounded-2xl;
  max-width: 764px;
  width: 764px;
  @media screen and (max-width: 764px) {
    @apply w-screen h-screen rounded-none;
    min-height: unset;
    flex-direction: column;
    background-color: #f8f8fb;
  }
}

.label {
  @apply font-medium text-title opacity-90;
}

#post-description {
  &:deep(.ql-vertical-line) {
    background-image: url('~/assets/images/Line.svg') !important;
    opacity: 0.54 !important;
    position: relative;
    background-repeat: no-repeat !important;
    top: -2px;
    left: 6px;
    pointer-events: none;
    width: 1px !important;
    padding: 0 !important;
  }
}
</style>

<style>
.test {
  &:deep(.ql-container) {
    min-height: 100px !important;
  }
}
</style>
