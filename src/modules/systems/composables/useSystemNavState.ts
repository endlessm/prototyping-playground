export const BRANCHES = [
  'context',
  'skills',
  'theme',
  'assets',
  'components',
] as const
export type Branch = (typeof BRANCHES)[number]

interface NavState {
  branches: Record<Branch, boolean>
  /** Context folders, by path; open unless closed. */
  folders: Record<string, boolean>
}

// Which branches and folders of each system's navigation are open, kept for
// the browser session's life in this page (not across reloads), so moving
// between a system's pages, or to another system and back, keeps them.
const states = new Map<string, NavState>()

export function useSystemNavState(systemId: () => string) {
  return computed(() => {
    const id = systemId()
    let state = states.get(id)
    if (!state) {
      state = reactive({
        branches: Object.fromEntries(
          BRANCHES.map((branch) => [branch, true]),
        ) as Record<Branch, boolean>,
        folders: {},
      })
      states.set(id, state)
    }
    return state
  })
}
