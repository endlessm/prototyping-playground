<template>
  <p v-if="userBadge" :class="`${userBadge}-tag`">
    {{ $t(userBadge) }}
  </p>
</template>

<script>
// Every badge with a matching -tag style rule. Anything else renders bare.
const BADGES = ['mentor', 'leader', 'facilitator']

export default {
  inject: {
    roleSets: {
      default: () => ({
        mentorIds: new Set(),
        leaderIds: new Set(),
      }),
    },
  },
  props: {
    userId: {
      type: Number,
      default: null,
    },
    /** A badge the caller has already worked out, such as a role that only
     *  it can read. Falls back to the roles this page provides. */
    badge: {
      type: String,
      default: null,
      validator: (value) => BADGES.includes(value),
    },
  },
  computed: {
    userBadge() {
      if (this.badge) return this.badge
      if (!this.userId) return null
      if (this.roleSets.mentorIds.has(this.userId)) return 'mentor'
      if (this.roleSets.leaderIds.has(this.userId)) return 'leader'
      return null
    },
  },
}
</script>

<style scoped>
@reference "~/assets/css/main.css";
.mentor-tag,
.leader-tag,
.facilitator-tag {
  font-size: 9px;
  max-height: 16px;
  @apply flex items-center justify-center py-2	px-1.5 font-semibold text-white bg-blue-sea rounded-md;
}
</style>
