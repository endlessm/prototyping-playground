// yarn studio <command>: the one entry point for managing the studio. Agents
// run these when people ask in plain words. Every command that changes files
// prints what it would do and changes nothing until it runs again with --yes;
// enable and disable apply right away.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Refusal, type Flags } from './output.ts'
import {
  createModule,
  disableModule,
  enableModule,
  listModules,
  removeModule,
} from './modules.ts'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

interface Command {
  usage: string
  summary: string
  run: (root: string, args: string[], flags: Flags) => Promise<void> | void
}

const COMMANDS: Record<string, Command> = {
  list: {
    usage: 'list',
    summary: 'each module and whether it is on, and the design systems',
    run: listModules,
  },
  enable: {
    usage: 'enable <module>',
    summary: 'turn a module on in studio.config.json',
    run: enableModule,
  },
  disable: {
    usage: 'disable <module>',
    summary: 'turn a module off; its files stay',
    run: disableModule,
  },
  remove: {
    usage: 'remove <module> [--content] [--force] [--yes]',
    summary: "delete a module's folder; --content deletes its content too",
    run: removeModule,
  },
  'create-module': {
    usage: 'create-module <id> [--label <name>] [--yes]',
    summary: 'make a module with a page, a rail button, a README and a skill',
    run: createModule,
  },
}

const SWITCHES = new Set(['--yes', '--content', '--force'])
const VALUES = new Set(['--label'])

function usage() {
  const width = Math.max(
    ...Object.values(COMMANDS).map(({ usage }) => usage.length),
  )
  return [
    'Usage: yarn studio <command>',
    '',
    ...Object.values(COMMANDS).map(
      ({ usage, summary }) => `  ${usage.padEnd(width)}  ${summary}`,
    ),
    '',
    'Commands that change files preview first; run them again with --yes.',
  ].join('\n')
}

function parse(rest: string[]) {
  const flags: Flags = {}
  const args: string[] = []
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i]!
    if (arg === '--') continue
    if (SWITCHES.has(arg)) flags[arg.slice(2)] = true
    else if (VALUES.has(arg)) {
      const value = rest[++i]
      if (value === undefined) throw new Refusal(`${arg} needs a value.`)
      flags[arg.slice(2)] = value
    } else if (arg.startsWith('--')) throw new Refusal(`Unknown option ${arg}.`)
    else args.push(arg)
  }
  return { flags, args }
}

const [name, ...rest] = process.argv.slice(2)
try {
  if (!name) console.log(usage())
  else {
    const command = Object.hasOwn(COMMANDS, name) ? COMMANDS[name] : undefined
    if (!command)
      throw new Refusal(
        `There's no command "${name}". Run yarn studio to list them.`,
      )
    const { flags, args } = parse(rest)
    await command.run(ROOT, args, flags)
  }
} catch (error) {
  if (!(error instanceof Refusal)) throw error
  console.error(error.message)
  process.exitCode = 1
}
