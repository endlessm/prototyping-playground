import type { ModuleServerHandler } from '../../../../tooling/modules/contract.ts'
import {
  createThread,
  replyToThread,
  resolveThread,
  type CommentsContext,
} from '../service.ts'

// POST, the page's writes: `{ "action": "create", prototype, artifact,
// artifactTitle, anchor, body }`, `{ "action": "reply", thread, body }` or
// `{ "action": "resolve", thread, reply? }`. The dev server resolves who is
// asking; the page never names an author. Reading is the build data.
export default (({ root, contributorsFolder, me, method, body }) => {
  const request = body as Record<string, unknown> | undefined
  if (method !== 'POST' || !request || typeof request !== 'object')
    throw Object.assign(new Error('Invalid comment request.'), { status: 400 })
  const context: CommentsContext = { root, contributorsFolder }
  const actor = { key: me }
  switch (request.action) {
    case 'create':
      return createThread(context, actor, {
        prototype: String(request.prototype),
        artifact: String(request.artifact),
        artifactTitle: String(request.artifactTitle ?? ''),
        anchor: request.anchor,
        body: request.body,
      })
    case 'reply':
      return replyToThread(context, actor, {
        thread: String(request.thread),
        body: request.body,
      })
    case 'resolve':
      return resolveThread(context, actor, {
        thread: String(request.thread),
        reply: request.reply,
      })
    default:
      throw Object.assign(new Error('Invalid comment request.'), {
        status: 400,
      })
  }
}) satisfies ModuleServerHandler
