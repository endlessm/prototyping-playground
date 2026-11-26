<template>
  <section
    :id="id"
    class="w-full pb-3 sm:pb-0 sm:border-1 sm:border-gray-200 sm:rounded-2xl bg-white post-card"
  >
    <!-- header -->
    <div class="relative flex flex-row items-center pt-4 sm:pl-4">
      <UserCard class="flex-1 min-w-0" :user="post.user">
        <template #badge>
          <UserBadge :user-id="post.user.id" />
        </template>
        <NuxtLink
          v-if="showSourceLink && feedSource"
          class="feedsource text-secondary"
          :to="feedSource.path"
        >
          {{ feedSource.name }}
        </NuxtLink>
      </UserCard>

      <!-- post type / time stamp / options dropdown -->
      <div class="flex gap-x-2 items-center rounded-md sm:pr-2">
        <span class="text-xs font-medium">{{ postTypeLabel }}</span>
        <span class="font-normal text-xs text-muted">{{ timeSince }}</span>
        <div v-if="post.is_pinned">
          <img
            class="object-fill"
            src="~/assets/images/Icons/pin-fill.svg"
            alt="pin"
            loading="lazy"
          />
        </div>
        <UDropdownMenu :items="menuItems" :content="{ align: 'end' }">
          <UButton
            icon="i-lucide-ellipsis"
            color="neutral"
            variant="ghost"
            @click.stop
          />
        </UDropdownMenu>
      </div>
    </div>

    <!--  thumbnail image  -->
    <div class="w-full mt-4 sm:px-2">
      <img
        v-if="post.image_url"
        class="max-h-52 sm:max-h-96 rounded-2xl object-cover"
        :src="post.image_url"
        alt="Post Image"
        loading="lazy"
      />
    </div>

    <!-- description -->

    <PostText
      class="sm:px-5 mt-3 mb-3 post-card-video"
      :html="post.description"
    />

    <!-- attachments -->
    <div
      v-if="post.files.length > 0 || post.links.length > 0"
      class="ml-7 mt-2"
    >
      <ProgressAttachment
        :links="post.links"
        :files="post.files"
        :is-display-only="true"
      />
    </div>

    <!-- tags -->
    <div
      v-if="tags.length > 0"
      class="flex flex-row flex-wrap gap-2 items-center sm:px-5 mt-4 mb-4"
    >
      <div
        v-for="tag in tags"
        :key="`${tag}-${post.id}`"
        class="px-2.5 py-1 font-bold text-xxs text-gray-light border border-gray-2 rounded-lg"
      >
        {{ tag }}
      </div>
    </div>

    <!-- like/comment  likeCount/commentCount -->
    <section
      :class="{ 'border-b-1': !isCommentsPanelOpen && previewComment }"
      class="mt-4 sm:mx-5 h-12 border-t-1 border-gray-border flex flex-row"
    >
      <div class="flex flex-row flex-1 h-full gap-2 items-center">
        <RestrictedButton
          :restricted-partner="
            likePermission === ProjectPostPermission.RESTRICTED_PARTNER
          "
          :leading-icon="isLiked ? 'mdi-thumb-up' : 'mdi-thumb-up-outline'"
          size="sm"
          variant="ghost"
          class="px-3 h-fit"
          :class="isLiked ? 'text-orange-endless' : 'text-gray-light'"
          color="neutral"
          @click="handleLike"
        >
          {{ $t('like') }}
        </RestrictedButton>

        <!--  comment action buttons -->
        <RestrictedButton
          :restricted-partner="
            commentPermission === ProjectPostPermission.RESTRICTED_PARTNER
          "
          leading-icon="mdi-message-outline"
          size="sm"
          variant="ghost"
          color="neutral"
          class="px-3 h-fit text-gray-light"
          @click="toggleComponentState"
        >
          {{ $t('comment') }}
        </RestrictedButton>
      </div>

      <div class="flex flex-row h-full">
        <!--  like counts -->
        <div class="h-full flex flex-row items-center">
          <img
            class="h-3 w-3 mr-2"
            loading="lazy"
            src="~/assets/images/Icons/likes-icon.svg"
            alt="likes"
          />
          <div class="font-medium text-gray-light text-xs">
            {{ likesCount }}
          </div>
        </div>

        <!--  comment counts -->
        <div
          class="h-full flex flex-row items-center ml-5 cursor-pointer max-md:ml-3"
          @click="toggleComponentState"
        >
          <img
            class="h-3 w-3 mr-1.5"
            loading="lazy"
            src="~/assets/images/Icons/comments-icon.svg"
            alt="comments"
          />
          <div class="sm:mr-4 font-medium text-gray-light text-xs">
            {{ commentsCount }}
          </div>
        </div>
      </div>
    </section>

    <!-- comments panel   -->
    <div
      v-if="isCommentsPanelOpen"
      class="sm:mx-5 pt-4 border-t-1 border-gray-border"
    >
      <div
        v-if="commentPermission === ProjectPostPermission.ALLOWED"
        class="flex flex-row items-center mb-6"
      >
        <img
          loading="lazy"
          class="h-10 w-10 rounded-full ml-0 sm:ml-2 object-cover"
          :src="resolveProfilePic(userImage)"
          alt="profile pic"
        />
        <div
          class="flex flex-row gap-x-1 items-center justify-between w-3/4 ml-3 flex-1 rounded-2xl border-1 border-gray-border py-2 px-3.5"
        >
          <Mentionable
            class="w-full"
            :keys="['@']"
            offset="3"
            insert-space
            filtering-disabled
            :items="mentionUsers"
            @open="updateMentionUsers()"
            @search="updateMentionUsers($event)"
            @apply="moveCursorToEnd()"
          >
            <textarea
              :id="`comment-${post.id}`"
              ref="mentionArea"
              v-model="commentInput"
              class="w-5/6 text-sm sm:text-base resize-none outline-hidden h-6"
              name="comment"
              rows="1"
              tabindex="1"
              :placeholder="$t('what_are_your_thoughts')"
              @input="increaseTextAreaHeight"
            />
            <template #no-result>
              <div v-if="loadingMentions" class="mx-2 my-1 text-gray-light">
                {{ $t('mentions_loading') }}
              </div>
              <div v-else class="mx-2 my-1 text-gray-light">
                {{ $t('mentions_no_results') }}
              </div>
            </template>
          </Mentionable>
          <div
            class="rounded-xl px-3 py-1.5 sm:px-6 sm:py-3 text-white text-xs font-bold"
            tabindex="2"
            :class="
              commentButtonEnabled
                ? 'bg-purple-primary cursor-pointer'
                : 'bg-purple-primary/50 cursor-default'
            "
            @click="addComment"
          >
            {{ $t('comment') }}
          </div>
        </div>
      </div>
      <Comment
        v-for="c in comments"
        :key="c.id"
        :comment="c"
        class="mb-7 mx-2"
        @remove="() => askToRemoveComment(c)"
      />
    </div>

    <div v-else-if="previewComment" class="sm:mx-5 pt-4">
      <Comment
        :comment="previewComment"
        class="mb-7 mx-2"
        @remove="() => askToRemoveComment(previewComment)"
      />
      <div
        v-if="comments && comments.length > 1"
        class="mb-4 mx-2 font-semibold text-sm text-gray-light cursor-pointer"
        @click="toggleComponentState"
      >
        {{ $t('see_all') }} {{ comments.length }} {{ $t('comments') }}
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { gql } from 'graphql-request'
import { defineAsyncComponent, defineComponent } from 'vue'
// @ts-expect-error vue-mention ships no type declarations
import { Mentionable } from 'vue-mention'
import { GET_USER_ID_BY_USER_NAME } from '~/graphql_schemas/user'
import {
  CREATE_OBJECT_FEED_COMMENT,
  CREATE_OBJECT_FEED_LIKE,
  DELETE_OBJECT_FEED_COMMENT,
  DELETE_OBJECT_FEED_LIKE,
  FLAG_POST,
  UNFLAG_POST,
  PIN_POST,
} from '~/graphql_schemas/communityFeed'
import UserBadge from '../Generic/UserBadge.vue'
import UserCard from '~/components/Generic/UserCard.vue'
import Comment from '~/components/CommunityFeed/Comment.vue'
import PostText from '~/components/CommunityFeed/PostText.vue'
import ProgressAttachment from '~/components/Task/FileUploadStates/ProgressAttachments.vue'
import projectMixin from '~/mixins/projectMixin.js'
import RestrictedButton from '~/components/Generic/RestrictedButton.vue'
import { ProjectPostPermission } from '~/types/permissions'

const GET_COMMENT_MENTION_USERS = gql`
  query GET_COMMENT_MENTION_USERS($objectId: Int!, $username: String!) {
    users: getUsersAssociatedToObject(
      input: { object_id: $objectId, username: $username, limit: 10 }
    ) {
      username
    }
  }
`

const MENTION_REGEX = /@(\w+)/g

// The Vuex store is untyped. Rather than type the whole store here, describe
// only the state fields this component reads.
type StoreWithAdminPrograms = {
  state: { user?: { adminForProgramsIdSet?: number[] } }
}

interface ObjectFeedLike {
  id: number
  object_feed_id: number
  user_id: number
  like_type: string
}

interface ObjectFeedComment {
  id: number
  object_feed_id: number
  user_id: number
  description: string
  image_url: string | null
  created_at: string
  mentions: unknown[]
}

export default defineComponent({
  name: 'PostCard',
  components: {
    UserBadge,
    UserCard,
    ProgressAttachment,
    Comment,
    PostText,
    Mentionable,
    RestrictedButton,
  },
  mixins: [projectMixin],
  props: {
    id: {
      type: String,
      required: true,
    },
    post: {
      type: Object,
      required: true,
    },
    enablePinning: {
      type: Boolean,
      default: false,
    },
    // Link to the post's source (program, project or main feed) under the
    // author's name. Feeds where the source is evident from the surrounding
    // page can turn this off.
    showSourceLink: {
      type: Boolean,
      default: true,
    },
    showCommentsFromStart: {
      type: Boolean,
      default: false,
    },
    commentPermission: {
      type: String,
      default: ProjectPostPermission.ALLOWED,
      validator: (value: ProjectPostPermission) =>
        Object.values(ProjectPostPermission).includes(value),
    },
    likePermission: {
      type: String,
      default: ProjectPostPermission.ALLOWED,
      validator: (value: ProjectPostPermission) =>
        Object.values(ProjectPostPermission).includes(value),
    },
  },
  emits: ['postFlagChange', 'pinnedPostChange', 'edit', 'delete'],
  setup() {
    const overlay = useOverlay()
    const asyncConfirmationModal = defineAsyncComponent(
      () => import('~/components/Generic/UConfirmationModal.vue'),
    )
    const deleteCommentModal = overlay.create(asyncConfirmationModal)

    return {
      deleteCommentModal,
      ProjectPostPermission,
      toast: useToast(),
    }
  },
  data() {
    return {
      // start comments panel closed
      isCommentsPanelOpen: false,

      // comments related
      commentInput: '',
      comments: this.post.comments,
      commentsCount: this.post.comments.length,

      // likes related
      like: {} as Partial<ObjectFeedLike>,
      isLiked: false,
      likesCount: this.post.likes.length,

      loadingMentions: false,
      mentionUsers: [] as { value: string; label: string }[],
    }
  },
  computed: {
    canDeletePost() {
      const userPost = this.post.user.id
      const userLoggedIn = this.$auth.user?.id
      const isTheAuthor = userPost === userLoggedIn
      return this.$auth.isAdmin || isTheAuthor
    },
    userImage() {
      return this.$auth?.user?.metadata?.image_url || null
    },
    showOptionsBtn() {
      return this.isLeaderOrOwner || this.isCurrentUserAdminForParentProgram
    },
    isLeaderOrOwner() {
      return (
        this.$auth.isAdmin || this.$auth.isEditor || this.isCurrentUserOwner
      )
    },
    isCurrentUserAdminForParentProgram() {
      if (!this.$auth.loggedIn || !this.isPostRelatedToProgram) {
        return false
      }
      return (
        this.$store as StoreWithAdminPrograms
      ).state.user?.adminForProgramsIdSet?.includes(
        this.post.related_object?.id,
      )
    },
    isPostRelatedToProgram() {
      return (
        this.post.related_object?.resource_name === 'program' ||
        this.post.related_object?.resource_name === 'cohort'
      )
    },

    isCurrentUserOwner() {
      if (!this.$auth.loggedIn) {
        return false
      }
      return this.$auth.user!.id === this.post.user.id
    },
    canUnflag() {
      return this.isModerator && (this.post.flagged_by_user ?? false)
    },
    tags() {
      if (this.post?.tags) {
        return [...new Set([...this.post.tags.split(',')])]
      }
      return []
    },
    timeSince() {
      return this.$dayjs(this.post.created_at).from(this.$dayjs())
    },
    commentButtonEnabled() {
      return this.commentInput && this.commentInput.trim().length > 0
    },
    feedSource() {
      if (!this.post?.related_object) {
        return null
      }
      switch (this.post.related_object.resource_name) {
        case 'page':
          return { name: 'Main Feed', path: '/' }
        case 'program':
          return {
            name: this.post.related_object.name,
            path: `/programs/${this.post.related_object.id}/`,
          }
        case 'cohort':
          return {
            name: this.post.related_object.name,
            path: `/programs/${this.post.related_object.id}/?cohort=${this.post.related_object.association_id}`,
          }
        case 'project':
          return {
            name: this.post.related_object.name,
            path: `/games/${this.post.related_object.association_id}/`,
          }
        default:
          return null
      }
    },
    postTypeLabel() {
      const POST_TYPES: Record<string, string> = {
        announcement: this.$t('announcement'),
        progress: this.$t('progress_update'),
        question: this.$t('question'),
        tip: this.$t('tip'),
        misc: this.$t('misc'),
        feedback: this.$t('feedback'),
      }
      return POST_TYPES[this.post.object_feed_type_id]
    },
    previewComment() {
      return this.comments?.[0]
    },
    menuItems() {
      const items: {
        label?: string
        type?: 'separator'
        icon?: string
        onSelect?: () => void
      }[] = [
        {
          label: this.$t('copy_link'),
          onSelect: () => this.copyUrl(),
        },
      ]

      if (this.showOptionsBtn) {
        if (this.enablePinning || this.post.is_pinned) {
          items.push({
            label: this.post.is_pinned ? this.$t('unpin') : this.$t('pin'),
            onSelect: () => this.pinPost(!this.post.is_pinned),
          })
        }

        items.push({
          label: this.$t('edit'),
          onSelect: () => this.$emit('edit'),
        })

        if (this.canDeletePost) {
          items.push({
            label: this.$t('delete'),
            onSelect: () => this.$emit('delete'),
          })
        }
      }

      if (this.canUnflag || this.$auth.loggedIn) {
        items.push({ type: 'separator' })
      }

      if (this.canUnflag) {
        items.push({
          label: this.$t('drop_report'),
          onSelect: () => this.flagPost(false),
        })
      } else if (this.$auth.loggedIn) {
        items.push({
          label: this.$t('report'),
          icon: 'i-lucide-flag',
          onSelect: () => this.flagPost(true),
        })
      }

      return items
    },
  },
  mounted() {
    this.setIsLiked()
    if (this.showCommentsFromStart) this.isCommentsPanelOpen = true
  },
  methods: {
    async updateMentionUsers(searchTerm?: string) {
      this.loadingMentions = true
      const result = await this.$graphqlRequest.query<{
        users: { username: string }[]
      }>(GET_COMMENT_MENTION_USERS, {
        objectId: this.post.object_id,
        username: searchTerm || '',
      })
      this.mentionUsers = result.data.users.map((user) => ({
        value: user.username,
        label: user.username,
      }))
      this.loadingMentions = false
    },
    toggleComponentState() {
      // Without comment permission there's no entry widget, so opening the
      // panel on a post with no comments would render just an empty divider.
      const opening = !this.isCommentsPanelOpen
      if (
        opening &&
        this.commentPermission !== ProjectPostPermission.ALLOWED &&
        this.comments.length === 0
      ) {
        return
      }
      this.isCommentsPanelOpen = !this.isCommentsPanelOpen
    },
    increaseTextAreaHeight() {
      const element = document.getElementById(`comment-${this.post.id}`)
      if (!element) {
        return
      }
      element.style.height = '1px'
      element.style.height = 1 + element.scrollHeight + 'px'
    },
    resetTextAreaHeight() {
      const element = document.getElementById(`comment-${this.post.id}`)
      if (!element) {
        return
      }
      element.style.height = '24px'
    },
    setIsLiked() {
      if (!this.$auth.loggedIn) {
        this.isLiked = false
        return
      }
      this.like = this.post.likes.find(
        (like: { user_id: unknown }) => like.user_id === this.$auth.user!.id,
      )
      this.isLiked = !!this.like
    },
    pushComment(comment: Record<string, unknown>) {
      this.comments.push(comment)
      this.commentsCount++
    },
    async handleLike() {
      if (this.$auth.requireLogin()) {
        return
      }

      this.isLiked = !this.isLiked
      try {
        if (this.isLiked) {
          this.likesCount++
          const response = await this.$graphqlRequest.mutate<{
            createObjectFeedLike: ObjectFeedLike
          }>(CREATE_OBJECT_FEED_LIKE, {
            input: {
              object_feed_id: this.post.id,
              user_id: this.$auth.user!.id,
              like_type: 'THUMBS_UP',
            },
          })
          this.like = response.data.createObjectFeedLike
        } else {
          this.likesCount--
          await this.$graphqlRequest.mutate(DELETE_OBJECT_FEED_LIKE, {
            input: {
              object_feed_like_id: this.like.id,
            },
          })
        }
      } catch {
        // Continue execution
      }
    },
    async addComment() {
      if (this.$auth.requireLogin()) {
        return
      }
      if (!this.commentButtonEnabled) {
        return
      }
      try {
        const input = {
          object_feed_id: this.post.id,
          user_id: this.$auth.user!.id,
          description: this.commentInput,
          mentions: await this.getMentionsFromText(this.commentInput),
        }

        const response = await this.$graphqlRequest.mutate<{
          createObjectFeedComment: ObjectFeedComment
        }>(CREATE_OBJECT_FEED_COMMENT, { input })
        this.pushComment({
          ...response.data.createObjectFeedComment,
          user: this.$auth.user,
        })

        this.commentInput = ''
        this.resetTextAreaHeight()
      } catch (e) {
        console.log(e)
      }
    },
    async askToRemoveComment(comment: Record<string, unknown>) {
      const confirmed = await this.deleteCommentModal.open({
        title: this.$t('are_you_sure_you_want_to_delete_this_comment'),
        confirmText: this.$t('yes'),
        cancelText: this.$t('cancel'),
      })
      if (!confirmed) {
        return
      }
      await this.removeComment(comment)
    },
    async removeComment(comment: Record<string, unknown>) {
      try {
        await this.$graphqlRequest.mutate(DELETE_OBJECT_FEED_COMMENT, {
          input: {
            object_feed_comment_id: comment.id,
          },
        })
        this.commentsCount--
        this.comments = this.comments.filter(
          (currentComment: Record<string, unknown>) =>
            currentComment.id !== comment.id,
        )
      } catch {
        // Continue execution
      }
    },
    async flagPost(flagged: boolean) {
      const input = {
        id: this.post.id,
        object_id: this.post.object_id,
      }
      try {
        if (flagged) {
          await this.$graphqlRequest.mutate(FLAG_POST, { input })
        } else {
          await this.$graphqlRequest.mutate(UNFLAG_POST, { input })
        }
        const updatedPost = {
          ...this.post,
          flagged_by_user: flagged
            ? { username: this.$auth.user!.username }
            : null,
        }
        this.$emit('postFlagChange', updatedPost)
      } catch (err) {
        console.log(err)
      }
    },
    async pinPost(pinned: boolean) {
      await this.$graphqlRequest.mutate(PIN_POST, {
        input: {
          id: this.post.id,
          object_id: this.post.object_id,
          is_pinned: pinned,
        },
      })

      const updatedPost = { ...this.post, is_pinned: pinned }

      this.$emit('pinnedPostChange', updatedPost)
    },
    moveCursorToEnd() {
      this.$nextTick(() => {
        const textarea = this.$refs.mentionArea as HTMLTextAreaElement
        textarea.selectionStart = textarea.selectionEnd = textarea.value.length
        textarea.focus()
      })
    },
    async copyUrl() {
      const postRoute = this.$router.resolve(`/posts/${this.post.id}/`)
      const postUrl = new URL(postRoute.href, window.location.href)
      try {
        await navigator.clipboard.writeText(postUrl.toString())
        this.toast.add({ title: this.$t('link_copied'), color: 'success' })
      } catch (err) {
        console.log(err)
      }
    },
    async getMentionsFromText(text: string) {
      const usernames = text
        .matchAll(MENTION_REGEX)
        .map(([_match, username]: string[]) => username!)

      // Turn our list of usernames into the list of user IDs that the API
      // expects.
      // FIXME: This is insane buywork and we should be able to simply pass a
      //        list of usernames to the API.
      const mentions = (
        await Promise.all(
          usernames.map(
            async (username: string) =>
              (
                (
                  await this.$graphqlRequest.query(GET_USER_ID_BY_USER_NAME, {
                    userName: username,
                  })
                ).data as { getUserIdByUsername: number | null }
              ).getUserIdByUsername,
          ),
        )
      ).filter((id) => id != null)

      // The API returns an error if we provide an empty list of mentions, so
      // return null here instead.
      return mentions.length > 0 ? mentions : null
    },
  },
})
</script>

<style scoped>
@reference "~/assets/css/main.css";
.post-card {
  @media (width <= 480px) {
    @apply px-3;
    margin-left: -12px;
    margin-right: -12px;
    width: auto;
  }
}

.post-card-video:deep(iframe) {
  width: 100%;
  min-height: 300px;
}

.feedsource {
  max-width: 200px;
}
</style>

<style>
.mention-item {
  color: #808191;
  padding: 4px 10px;
  border-radius: 4px;
}

.mention-selected {
  cursor: pointer;
  background-color: #d3e1eb;
}

.tooltip-inner.popover-inner {
  padding: 12px;
}
</style>
