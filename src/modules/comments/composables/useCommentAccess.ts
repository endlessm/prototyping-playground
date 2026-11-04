import { useMe } from '../../../../app/composables/useMe'
import { requestJson } from '../../../../app/utils/studioRequest'
import type { CommentAccess } from '../threads'

// What the person may do on a prototype, as the service says: the sentence
// that keeps them from writing there (not registered, archived), who they
// write as and whether they are an Admin. Asked again when who is working or
// the prototype's status changes. Null until the dev server answers; the
// page then offers everything, and the service still checks each write.
export function useCommentAccess(
  prototype: () => { id: string; status?: string },
) {
  const { me } = useMe()
  const access = shallowRef<CommentAccess | null>(null)
  const url = `${useRuntimeConfig().app.baseURL}_studio/modules/comments/threads`
  let asked = 0

  async function load() {
    const ask = ++asked
    try {
      const answer = await requestJson<CommentAccess>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'access', prototype: prototype().id }),
      })
      if (ask === asked) access.value = answer
    } catch {
      // The dev server is restarting; the next change asks again.
    }
  }
  watch(
    () => [prototype().id, prototype().status, me.value.key, me.value.role],
    () => void load(),
    { immediate: true },
  )
  return access
}
