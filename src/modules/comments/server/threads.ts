import { resolveIdentity } from '../../../../tooling/contributors/identity.ts'
import { readContributors } from '../../../../tooling/contributors/profiles.ts'
import type { ModuleServerHandler } from '../../../../tooling/modules/contract.ts'
import {
  access,
  createThread,
  deleteMessage,
  deleteThread,
  editMessage,
  reopenThread,
  replyToThread,
  resolveThread,
  type CommentsContext,
} from '../service.ts'

// POST, the page's requests, each `{ "action": … }` with its fields:
// `create` (prototype, artifact, artifactTitle, anchor, body), `reply`
// (thread, body), `resolve` (thread, reply?), `reopen` (thread), `edit`
// (thread, message, body), `delete-message` (thread, message), `delete`
// (thread), and `access` (prototype): what the asker may do there. The dev
// server resolves who is asking; the page never names an author. Reading is
// the build data. Refusals answer with the service's sentence.
export default (({ root, contributorsFolder, me, method, body }) => {
  const request = body as Record<string, unknown> | undefined
  if (method !== 'POST' || !request || typeof request !== 'object')
    throw Object.assign(new Error('Invalid comment request.'), { status: 400 })
  const context: CommentsContext = { root, contributorsFolder }
  // Someone unregistered is told which Git email matched nobody, as the
  // command tells them.
  const actor = {
    key: me,
    ...(!me && {
      email: resolveIdentity(
        root,
        readContributors(root, contributorsFolder).contributors,
      ).email,
    }),
  }
  const thread = String(request.thread)
  switch (request.action) {
    case 'access':
      return access(context, actor, { prototype: String(request.prototype) })
    case 'create':
      return createThread(context, actor, {
        prototype: String(request.prototype),
        artifact: String(request.artifact),
        artifactTitle: String(request.artifactTitle ?? ''),
        anchor: request.anchor,
        body: request.body,
      })
    case 'reply':
      return replyToThread(context, actor, { thread, body: request.body })
    case 'resolve':
      return resolveThread(context, actor, { thread, reply: request.reply })
    case 'reopen':
      return reopenThread(context, actor, { thread })
    case 'edit':
      return editMessage(context, actor, {
        thread,
        message: String(request.message),
        body: request.body,
      })
    case 'delete-message':
      return deleteMessage(context, actor, {
        thread,
        message: String(request.message),
      })
    case 'delete':
      return deleteThread(context, actor, { thread })
    default:
      throw Object.assign(new Error('Invalid comment request.'), {
        status: 400,
      })
  }
}) satisfies ModuleServerHandler
