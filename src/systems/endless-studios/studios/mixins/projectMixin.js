export default {
  computed: {
    isLeaderOrCreator() {
      if (!this.$auth.user) return false
      const isCreator = this.$auth.user.id === this.project.created_by
      return this.isProjectLeader || isCreator
    },
    isProjectLeader() {
      if (!this.$auth.user) return false
      return this.project?.leaders?.some(
        (leader) => leader.id === this.$auth.user.id,
      )
    },
    isModerator() {
      return this.$auth.isAdmin || this.$auth.isProgramAdmin
    },
    suggestedGamesURL() {
      // If this game is part of a program, suggest playtesting games from within the program.
      // Otherwise go to the global games page.
      return this.project.program?.id
        ? `/programs/${this.project.program.id}/?progTab=Games`
        : '/games/all'
    },
  },
}
