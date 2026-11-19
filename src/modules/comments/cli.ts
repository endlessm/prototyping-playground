// Comments from the command line, for agents that have no browser:
//
//   yarn comments [prototype folder | address] [--resolved] [--json]
//                                                  the open comments, as text
//   yarn comments show <id>                        one thread, every message
//   yarn comments reply <id> "<text>"              reply as your agent
//   yarn comments resolve <id> [--reply "<text>"]  resolve, with a last reply
//   yarn comments reopen <id>                      open a resolved one again
//
// With no folder or address it lists the prototypes you own. The text is the
// agent text Copy for agent gives (`agentText.ts`), except that the command
// can't render a page, so it never knows a target is gone: it prints the
// stored anchor. Writes go through the same service as the page's, as the
// agent of the contributor your Git identity resolves to; an open page shows
// them at once. The work itself is in commands.ts, shared with the MCP
// server (mcp.ts).
import {
  CommandStop,
  contributors,
  isRefusal,
  list,
  reopen,
  reply,
  resolve,
  show,
  type ListOptions,
} from './commands.ts'

const USAGE = [
  'yarn comments [prototype folder | address] [--resolved] [--json]',
  'yarn comments show <id>',
  'yarn comments reply <id> "<text>"',
  'yarn comments resolve <id> [--reply "<text>"]',
  'yarn comments reopen <id>',
].join('\n')

const fail = (message: string): never => {
  throw new CommandStop(message)
}

async function main(argv: string[]) {
  const positional: string[] = []
  let last: string | undefined
  const options: ListOptions = {
    status: 'open',
    json: false,
    warn: (problem) => console.error(`Warning: ${problem}`),
  }
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]!
    if (arg === '--reply')
      last = argv[++index] ?? fail('--reply needs the text of the reply.')
    else if (arg.startsWith('--reply=')) last = arg.slice('--reply='.length)
    else if (arg === '--resolved') options.status = 'resolved'
    else if (arg === '--json') options.json = true
    else if (arg === '--help' || arg === 'help') return USAGE
    else if (arg.startsWith('--')) fail(`Unknown option ${arg}.\n${USAGE}`)
    else positional.push(arg)
  }
  const people = contributors()
  const [command, id, text] = positional
  if (command === 'show') {
    if (!id) fail(`Name the comment to show.\n${USAGE}`)
    return show(id!, people)
  }
  if (command === 'reply') {
    if (!id || text === undefined)
      fail(`Name the comment and the reply.\n${USAGE}`)
    return reply(id!, text!, people)
  }
  if (command === 'resolve') {
    if (!id) fail(`Name the comment to resolve.\n${USAGE}`)
    return resolve(id!, last, people)
  }
  if (command === 'reopen') {
    if (!id) fail(`Name the comment to reopen.\n${USAGE}`)
    return reopen(id!, people)
  }
  if (positional.length > 1) fail(USAGE)
  return list(command, people, options)
}

try {
  const output = await main(process.argv.slice(2))
  if (output) console.log(output)
} catch (error) {
  if (!isRefusal(error)) throw error
  console.error(error.message)
  process.exitCode = 1
}
