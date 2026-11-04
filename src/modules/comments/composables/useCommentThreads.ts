import { useModuleData } from '../../../../app/composables/useModuleData'
import { requestJson } from '../../../../app/utils/studioRequest'
import type { CommentThread, CommentsData } from '../threads'

// A prototype's threads in the browser: the module's build data, which the
// dev server refreshes whenever a thread file changes, whoever changed it.
// Writes go to the module's handler, which resolves who is asking; the page
// never writes files. A write's answer shows at once (a deleted thread is
// gone at once), until the build data that includes it arrives.
export function useCommentThreads(prototypeId: () => string) {
  const { data, error } = useModuleData<CommentsData>('comments', 'threads')
  /** Threads as the last write left them; null for one just deleted. */
  const written = shallowRef(new Map<string, CommentThread | null>())
  watch(data, (next) => {
    if (!written.value.size || !next) return
    const known = new Set(
      (next.prototypes[prototypeId()] ?? []).map(({ id }) => id),
    )
    written.value = new Map(
      [...written.value].filter(([id, thread]) =>
        thread ? !known.has(id) : known.has(id),
      ),
    )
  })

  const threads = computed(() => {
    const stored = data.value?.prototypes[prototypeId()] ?? []
    const ids = new Set(stored.map(({ id }) => id))
    return [
      ...stored.flatMap((thread) => {
        const now = written.value.has(thread.id)
          ? written.value.get(thread.id)
          : thread
        return now ? [now] : []
      }),
      ...[...written.value.values()].filter((thread): thread is CommentThread =>
        Boolean(thread && !ids.has(thread.id)),
      ),
    ]
  })

  const url = `${useRuntimeConfig().app.baseURL}_studio/modules/comments/threads`
  const ask = <T>(request: Record<string, unknown>) =>
    requestJson<T>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
  async function send(request: Record<string, unknown>) {
    const thread = await ask<CommentThread>(request)
    written.value = new Map(written.value).set(thread.id, thread)
    return thread
  }

  return {
    threads,
    error,
    create: (request: {
      artifact: string
      artifactTitle: string
      anchor: unknown
      body: string
    }) => send({ action: 'create', prototype: prototypeId(), ...request }),
    reply: (thread: string, body: string) =>
      send({ action: 'reply', thread, body }),
    resolve: (thread: string) => send({ action: 'resolve', thread }),
    reopen: (thread: string) => send({ action: 'reopen', thread }),
    edit: (thread: string, message: string, body: string) =>
      send({ action: 'edit', thread, message, body }),
    deleteMessage: (thread: string, message: string) =>
      send({ action: 'delete-message', thread, message }),
    async deleteThread(thread: string) {
      await ask({ action: 'delete', thread })
      written.value = new Map(written.value).set(thread, null)
    },
  }
}
