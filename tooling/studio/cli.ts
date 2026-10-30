// yarn studio <command>: the one entry point for managing the studio. Agents
// run these when people ask in plain words. Every command that changes files
// prints what it would do and changes nothing until it runs again with --yes;
// enable and disable apply right away. Shared changes (the configuration and
// modules) need an Admin. `--as <key>` runs one command as your own profile
// after a Git email change.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { nodeVersionWarning } from '../check-node.ts'
import { componentDocs } from './component-docs.ts'
import { join, profile, whoami } from './contributors.ts'
import { deletePrototype } from './delete-prototype.ts'
import { dev } from './dev.ts'
import { identify, identityAudit } from './identity.ts'
import {
  createModule,
  disableModule,
  enableModule,
  listModules,
  removeModule,
} from './modules.ts'
import { Refusal, type Flags } from './output.ts'
import { newPrototype } from './new.ts'
import { requireAdmin } from './permissions.ts'
import { preferences } from './preferences.ts'
import { context, status } from './status.ts'
import { configure } from './configure.ts'
import { sync, syncInFreshProcess } from './sync.ts'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

interface Command {
  usage: string
  summary: string
  run: (root: string, args: string[], flags: Flags) => Promise<void> | void
  /** A shared change: `always` applies right away, `yes` with --yes. */
  shared?: 'always' | 'yes'
}

const COMMANDS: Record<string, Command> = {
  configure: {
    usage:
      'configure [--name <name>] [--tagline <text>] [--system <key|id|none>] [--admins <key,key>] [--maintainers <system=key,key>] [--recovery] [--yes]',
    summary:
      'preview or apply studio settings and roles; recovery uses repository access',
    run: configure,
  },
  sync: {
    usage: 'sync [--check]',
    summary:
      'refresh module guidance and skill adapters, or check without writing',
    run: sync,
  },
  status: {
    usage: 'status [--json]',
    summary:
      'the studio, who you are, the default system, modules, systems and problems',
    run: status,
  },
  context: {
    usage: 'context src/prototypes/<contributor>/<prototype> [--json]',
    summary:
      'before editing a prototype: its owner, system, pending rebuild and whether you can edit it',
    run: context,
  },
  new: {
    usage: 'new "Prototype Name" [--system <id> | --no-system] (also yarn new)',
    summary:
      'create a prototype in your own space, with the default system unless you choose another or none',
    run: newPrototype,
  },
  'delete-prototype': {
    usage:
      'delete-prototype src/prototypes/<contributor>/<prototype> [--yes] [--json]',
    summary:
      'see what deleting a prototype would break or lose, then delete it for good with --yes (owner or Admin)',
    run: deletePrototype,
  },
  whoami: {
    usage: 'whoami [--json]',
    summary: 'the contributor your Git identity resolves to',
    run: whoami,
  },
  join: {
    usage:
      'join [--key <key>] [--name <name>] [--email <email>] [--github <user>] [--link <key>] [--yes]',
    summary:
      'register yourself as a contributor, or link a new Git email to your profile',
    run: join,
  },
  profile: {
    usage:
      'profile [--name <name>] [--add-email <email>] [--remove-email <email>] [--primary-email <email>] [--github <user>] [--yes]',
    summary: 'show your profile, or change your name, emails or GitHub account',
    run: profile,
  },
  preferences: {
    usage:
      'preferences [--module <id>] --plan <file>  |  preferences --apply <file>',
    summary:
      "Admins: save a plan that adds modules' missing preference sections to every profile, then apply it",
    run: preferences,
  },
  dev: {
    usage: 'dev status [--json] | dev restart [--json] | dev stop',
    summary:
      "this studio's recorded dev server: see it, restart it on its port, stop it or clear a stale record",
    run: dev,
  },
  identify: {
    usage: 'identify src/prototypes/<contributor>/<prototype> [--yes] [--json]',
    summary:
      'after writing files directly: give the files of your prototype the permanent IDs they are missing',
    run: identify,
  },
  'identity-audit': {
    usage: 'identity-audit [--json]',
    summary:
      'count every resource and report missing, malformed and duplicate permanent IDs',
    run: identityAudit,
  },
  list: {
    usage: 'list',
    summary: 'each module and whether it is on, and the design systems',
    run: listModules,
  },
  enable: {
    usage: 'enable <module>',
    summary: 'turn a module on in studio.config.json',
    run: enableModule,
    shared: 'always',
  },
  disable: {
    usage: 'disable <module>',
    summary: 'turn a module off; its files stay',
    run: disableModule,
    shared: 'always',
  },
  remove: {
    usage: 'remove <module> [--content] [--force] [--yes]',
    summary: "delete a module's folder; --content deletes its content too",
    run: removeModule,
    shared: 'yes',
  },
  'component-docs': {
    usage:
      'component-docs <system> [component] [--yes] (also yarn component-docs)',
    summary:
      'add the examples file and page a component is missing, from templates',
    run: componentDocs,
  },
  'create-module': {
    usage: 'create-module <id> [--label <name>] [--yes]',
    summary: 'make a module with a page, a rail button, a README and a skill',
    run: createModule,
    shared: 'yes',
  },
}

const SWITCHES = new Set([
  '--recovery',
  '--check',
  '--yes',
  '--content',
  '--force',
  '--json',
  '--no-system',
])
const VALUES = new Set([
  '--tagline',
  '--admins',
  '--label',
  '--key',
  '--name',
  '--email',
  '--github',
  '--link',
  '--primary-email',
  '--as',
  '--plan',
  '--apply',
  '--module',
  '--system',
])
const LISTS = new Set(['--add-email', '--remove-email', '--maintainers'])

function usage() {
  return [
    'Usage: yarn studio <command>',
    '',
    ...Object.values(COMMANDS).flatMap(({ usage, summary }) => [
      `  ${usage}`,
      `      ${summary}`,
    ]),
    '',
    'Commands that change files preview first; run them again with --yes.',
    'Add --as <your key> to run one command as your profile after a Git email change.',
  ].join('\n')
}

function parse(rest: string[]) {
  const flags: Flags = {}
  const args: string[] = []
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i]!
    if (arg === '--') continue
    if (SWITCHES.has(arg)) flags[arg.slice(2)] = true
    else if (VALUES.has(arg) || LISTS.has(arg)) {
      const value = rest[++i]
      if (value === undefined) throw new Refusal(`${arg} needs a value.`)
      const name = arg.slice(2)
      const listed = flags[name]
      flags[name] = LISTS.has(arg)
        ? [...(Array.isArray(listed) ? listed : []), value]
        : value
    } else if (arg.startsWith('--')) throw new Refusal(`Unknown option ${arg}.`)
    else args.push(arg)
  }
  return { flags, args }
}

const { engines } = JSON.parse(
  readFileSync(path.join(ROOT, 'package.json'), 'utf8'),
)
const warning = nodeVersionWarning(process.version, engines.node)
if (warning) console.warn(`Warning: ${warning}`)

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
    if (command.shared === 'always' || (command.shared === 'yes' && flags.yes))
      requireAdmin(ROOT, flags)
    await command.run(ROOT, args, flags)
    if (
      name !== 'sync' &&
      (command.shared === 'always' ||
        flags.yes ||
        flags.apply ||
        name === 'new')
    )
      syncInFreshProcess(ROOT)
  }
} catch (error) {
  if (!(error instanceof Refusal)) throw error
  console.error(error.message)
  process.exitCode = 1
}
