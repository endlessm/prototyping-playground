<template>
  <div class="group flex max-[480px]:mx-0 max-[480px]:mb-5">
    <NuxtLink
      :to="`/profile/${userName}/`"
      class="mr-3.5 shrink-0 no-underline"
    >
      <img
        :src="resolveProfilePic(userImage)"
        class="w-10 h-10 rounded-full object-cover"
        alt="user image"
      />
    </NuxtLink>
    <div class="w-full">
      <span class="flex flex-row items-center gap-1">
        <NuxtLink
          :to="`/profile/${userName}/`"
          class="shrink-0 font-bold text-sm truncate max-w-[200px] no-underline"
        >
          {{ userName }}
        </NuxtLink>
        <UserBadge :user-id="comment.user.id" />
        <div class="ml-2 font-normal text-xs text-gray-2">{{ timeSince }}</div>

        <div
          v-if="showDeleteBtn"
          class="ml-auto transition-all opacity-0 group-hover:opacity-100"
          @click="$emit('remove')"
        >
          <UTooltip
            :text="$t('delete_this_comment')"
            :content="{ side: 'top' }"
          >
            <img
              class="w-5 h-5 p-0.5 cursor-pointer bg-white rounded-full"
              src="~/assets/images/Icons/trash.svg"
              style="box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.1)"
            />
          </UTooltip>
        </div>
      </span>

      <PostText
        class="mt-2 text-sm text-gray-light font-light break-all"
        :html="comment.description"
      />
    </div>
  </div>
</template>

<script>
import UserBadge from '~/components/Generic/UserBadge.vue'
import PostText from '~/components/CommunityFeed/PostText.vue'

export default {
  components: {
    UserBadge,
    PostText,
  },
  props: {
    comment: {
      type: Object,
      required: true,
    },
  },
  emits: ['remove'],
  computed: {
    userImage() {
      return this.comment.user?.metadata?.image_url || null
    },
    userName() {
      return this.comment?.user?.username || this.$t('user_name')
    },
    userId() {
      return this.comment?.user?.id || this.$t('user_name')
    },
    showDeleteBtn() {
      if (!this.$auth.loggedIn) {
        return false
      }
      return this.comment.user === this.$auth.user.id || this.$auth.isAdmin
    },
    timeSince() {
      return this.$dayjs(this.comment.created_at).from(this.$dayjs())
    },
  },
}
</script>
