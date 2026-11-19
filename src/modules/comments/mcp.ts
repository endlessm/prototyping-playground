// Comments for agents over MCP: a local stdio server the agent starts
// (`yarn comments:mcp`), so comments a person sends to their agent from the
// studio reach it without copying anything. The tools mirror `yarn comments` and print the
// same agent text (commands.ts). `watch_comments` blocks until a thread waits
// on the agent (sent to it, then a person's reply after the agent's), the
// long-poll loop Agentation's MCP uses for its "watch mode". The thread files
// stay the only store: the page writes them, this server polls them, and an
// open page shows the agent's replies at once. Nothing here runs on the
// deployed site.
import { McpServer } from '@modelcontextprotocol/server'
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import {
  awaiting,
  contributors,
  isRefusal,
  list,
  reopen,
  reply,
  resolve,
  show,
} from './commands.ts'

// Folders given to the tools are read from the studio's root, wherever the
// agent started the server.
process.chdir(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'),
)

const POLL_MS = 1000

const server = new McpServer(
  { name: 'studio-comments', version: '1.0.0' },
  {
    instructions: [
      'Comments people pin to prototypes in the Endless Design Studio, kept as files in each prototype. Read src/modules/comments/skills/address-comments/SKILL.md before acting on them.',
      'People choose which comments to send you. A comment waits on you while it was sent to you, is open and a person wrote its last message. `list_comments` with `awaiting: true` lists those; `watch_comments` waits for the next ones.',
      'Watch mode: when the person asks you to watch for comments, call `watch_comments`, act on each comment it returns as the skill says (change the prototype, then `reply_to_comment` saying what changed and where), and call `watch_comments` again. Leave comments open unless the person asks you to resolve them; leave questions for the person unanswered by code changes.',
      'The text names `yarn comments` commands; these tools do the same.',
    ].join('\n\n'),
  },
)

const scope = z
  .string()
  .optional()
  .describe(
    'A prototype folder (src/prototypes/<contributor>/<prototype>), or an address (/prototypes/<id> or /prototypes/<id>/artifacts/<id>, or the whole URL). Leave it out for the prototypes you own.',
  )
const id = z.string().describe('The comment’s ID, as the agent text gives it.')

const text = (value: string) => ({
  content: [{ type: 'text' as const, text: value }],
})

/** Runs a tool, turning a refusal's sentence into a tool error. */
async function answer(work: () => string | Promise<string>) {
  try {
    return text(await work())
  } catch (error) {
    if (!isRefusal(error)) throw error
    return { ...text(error.message), isError: true }
  }
}

server.registerTool(
  'list_comments',
  {
    title: 'List comments',
    description:
      'The comments on a prototype, one file of it, or the prototypes you own, as agent text: each thread with its target’s locator lines (State, Path, Heading, Quote…) and messages.',
    inputSchema: z.object({
      scope,
      status: z
        .enum(['open', 'resolved'])
        .optional()
        .describe('Open by default.'),
      awaiting: z
        .boolean()
        .optional()
        .describe(
          'Only comments waiting on you: sent to you, open, and a person wrote the last message.',
        ),
    }),
    annotations: { readOnlyHint: true },
  },
  ({ scope, status, awaiting }) =>
    answer(() =>
      list(scope, contributors(), { status: status ?? 'open', awaiting }),
    ),
)

server.registerTool(
  'show_comment',
  {
    title: 'Show a comment',
    description: 'One comment, resolved or not, with every message.',
    inputSchema: z.object({ id }),
    annotations: { readOnlyHint: true },
  },
  ({ id }) => answer(() => show(id, contributors())),
)

server.registerTool(
  'reply_to_comment',
  {
    title: 'Reply to a comment',
    description:
      'Reply as your person’s agent, saying what you changed and where, or why you didn’t. An open page shows it at once.',
    inputSchema: z.object({ id, text: z.string().min(1) }),
  },
  ({ id, text }) => answer(() => reply(id, text, contributors())),
)

server.registerTool(
  'resolve_comment',
  {
    title: 'Resolve a comment',
    description:
      'Resolve a comment, with an optional last reply. Only when the person asked you to.',
    inputSchema: z.object({ id, reply: z.string().min(1).optional() }),
  },
  ({ id, reply }) => answer(() => resolve(id, reply, contributors())),
)

server.registerTool(
  'reopen_comment',
  {
    title: 'Reopen a comment',
    description: 'Open a resolved comment again.',
    inputSchema: z.object({ id }),
  },
  ({ id }) => answer(() => reopen(id, contributors())),
)

// What `watch_comments` has handed over in this session: each thread with
// its last message then. A thread comes back when a person writes again.
const delivered = new Map<string, string>()

server.registerTool(
  'watch_comments',
  {
    title: 'Watch for comments',
    description:
      'Waits until comments wait on you (sent to you by a person, or a person’s reply after yours on one) that this session hasn’t handed over yet, then gives them as agent text. Returns at once when some already wait. Gathers what else arrives within the batch window, so several comments come together. Call it again after acting on them.',
    inputSchema: z.object({
      scope,
      timeoutSeconds: z
        .number()
        .int()
        .min(1)
        .max(300)
        .optional()
        .describe('How long to wait for a comment; 120 by default.'),
      batchWindowSeconds: z
        .number()
        .int()
        .min(0)
        .max(60)
        .optional()
        .describe(
          'How long to keep gathering once one arrives; 5 by default, 0 to return at once.',
        ),
    }),
    annotations: { readOnlyHint: true },
  },
  ({ scope, timeoutSeconds = 120, batchWindowSeconds = 5 }, ctx) =>
    answer(async () => {
      const people = contributors()
      const signal = ctx.mcpReq.signal
      const fresh = () =>
        [...awaiting(scope, people)].filter(
          ([thread, last]) => delivered.get(thread) !== last,
        )
      const deadline = Date.now() + timeoutSeconds * 1000
      let found = fresh()
      while (!found.length && Date.now() < deadline && !signal.aborted) {
        await pause(POLL_MS, signal)
        found = fresh()
      }
      if (!found.length)
        return `No comments waiting on you after ${timeoutSeconds} s. Call watch_comments again to keep watching.`
      if (batchWindowSeconds) {
        await pause(batchWindowSeconds * 1000, signal)
        found = fresh()
      }
      for (const [thread, last] of found) delivered.set(thread, last)
      return list(scope, people, {
        status: 'open',
        awaiting: true,
        only: new Set(found.map(([thread]) => thread)),
      })
    }),
)

function pause(ms: number, signal: AbortSignal) {
  return new Promise<void>((done) => {
    const timer = setTimeout(done, ms)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        done()
      },
      { once: true },
    )
  })
}

await server.connect(new StdioServerTransport())
