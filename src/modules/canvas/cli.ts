// The canvas tools on a canvas file, from the command line, for agents that
// have no browser:
//
//   yarn canvas <file.excalidraw> <tool> '<json>'             run a tool on a canvas
//   yarn canvas <file.excalidraw> <tool> --json-file <path>   the arguments from a file
//   yarn canvas <file.excalidraw> <tool> -                    the arguments from standard input
//   yarn canvas <file.excalidraw> states '{"artifact":"Home.vue"}'  every state of a view, side by side
//   yarn canvas help [tool]                                    list the tools, or explain one
//
// These are the same tools as in the open canvas (`tools/tools.ts`), with the
// same arguments. The result is JSON on stdout; a change is written to the
// file, and an open canvas takes it in as it happens. Nothing is run from
// the arguments. Before a tool runs, every file of the prototype needs its
// permanent identity; if one hasn't, the command that fixes it is named, and
// --identify runs it and continues. Imports only Node and `tooling/`.
import { spawnSync } from 'node:child_process'
import {
  existsSync,
  readFileSync,
  realpathSync,
  renameSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  permissionRefusal,
  refusalMessage,
} from '../../../tooling/contributors/roles.ts'
import { auditIdentities } from '../../../tooling/identity/audit.ts'
import { identityFileTypes } from '../../../tooling/identity/file-types.ts'
import {
  buildManifest,
  PROTOTYPES_FOLDER,
} from '../../../tooling/manifest/build.ts'
import { loadRegistry } from '../../../tooling/modules/registry.ts'
import { session } from '../../../tooling/studio/permissions.ts'
import { loadSystems } from '../../../tooling/systems/registry.ts'
import { toolContext } from './tools/context.ts'
import { help, run, ToolError } from './tools/tools.ts'
import { identity } from './types/canvas/identity.ts'
import { pruneImages } from './types/canvas/images.ts'
import {
  FORMAT_VERSION,
  parseCanvas,
  stringifyScene,
} from './types/canvas/format.ts'

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
)
/** The tools that only read: they need no rights and never write. */
const READING = ['describe', 'artifacts', 'help']

class Stop extends Error {}
const fail = (message: string): never => {
  throw new Stop(message)
}

const USAGE = [
  "yarn canvas <file.excalidraw> <tool> '<json>'",
  'yarn canvas <file.excalidraw> <tool> --json-file <path>',
  'yarn canvas <file.excalidraw> <tool> -   (the JSON on standard input)',
  'Add --identify to give files their missing identities before the tool runs.',
]

/** Where JSON goes wrong, by position, line and column. */
function positionOf(text: string, message: string) {
  const stated = /at position (\d+)/.exec(message)
  if (stated) return { position: Number(stated[1]), stated: true }
  // V8 doesn't always say ("Unexpected token"). Then it is where a growing
  // prefix fails for a reason other than ending too soon.
  for (let end = 1; end <= text.length; end++)
    try {
      JSON.parse(text.slice(0, end))
    } catch (error) {
      const at = /at position (\d+)/.exec((error as Error).message)
      if (
        at
          ? Number(at[1]) < end
          : !/end of JSON input/.test((error as Error).message)
      )
        return { position: at ? Number(at[1]) : end - 1, stated: false }
    }
  return undefined
}

/** The tool's arguments: inline, from a file, or from standard input. */
function readArguments(
  inline: string | undefined,
  jsonFile: string | undefined,
) {
  if (jsonFile !== undefined && inline !== undefined)
    fail(
      'Give the arguments once: inline JSON, --json-file <path>, or - for standard input.',
    )
  const input =
    jsonFile !== undefined
      ? {
          from: jsonFile,
          text: existsSync(jsonFile)
            ? readFileSync(jsonFile, 'utf8')
            : fail(`${jsonFile} doesn't exist.`),
        }
      : inline === '-'
        ? { from: 'standard input', text: readFileSync(0, 'utf8') }
        : inline !== undefined
          ? { from: 'the arguments', text: inline }
          : undefined
  if (!input) return {}
  // A file or pipe written by PowerShell can start with a byte-order mark.
  const text = input.text.replace(/^\uFEFF/, '')
  try {
    return JSON.parse(text) as unknown
  } catch (error) {
    const message = (error as Error).message
    const found = positionOf(text, message)
    const lines = found && text.slice(0, found.position).split('\n')
    return fail(
      `${input.from === 'the arguments' ? "the arguments aren't" : `${input.from} isn't`} valid JSON: ${message}` +
        (found && lines && !found.stated
          ? ` (at position ${found.position}, line ${lines.length} column ${lines.at(-1)!.length + 1})`
          : '') +
        (process.platform === 'win32' && input.from === 'the arguments'
          ? '\nOn Windows the shell can change quotes in inline JSON. Write it to a file and pass --json-file <path>, or pipe it with -.'
          : ''),
    )
  }
}

/** The canvas file, inside a prototype's folder and nowhere else. */
function canvasFile(given: string) {
  const file = path.resolve(process.cwd(), given)
  if (!file.toLowerCase().endsWith('.excalidraw'))
    fail(
      `${given} isn't a canvas. Canvases are .excalidraw files in a prototype.`,
    )
  if (!existsSync(file))
    fail(
      `${given} doesn't exist. Make a canvas with + → New canvas in the studio, or write one as src/modules/canvas/skills/use-canvas/SKILL.md describes.`,
    )
  const real = realpathSync(file)
  const all = path.join(ROOT, PROTOTYPES_FOLDER)
  const prototypes = existsSync(all) ? realpathSync(all) : all
  const parts = path.relative(prototypes, real).split(path.sep)
  if (parts[0] === '..' || path.isAbsolute(parts[0]!) || parts.length < 3)
    fail(
      `${given} isn't in a prototype. A canvas is at ${PROTOTYPES_FOLDER}/<contributor>/<prototype>/….excalidraw.`,
    )
  const [contributor, prototype] = parts as [string, string]
  const folder = `${PROTOTYPES_FOLDER}/${contributor}/${prototype}`
  if (!existsSync(path.join(ROOT, folder, 'meta.json')))
    fail(`${given} isn't in a prototype: ${folder} has no meta.json.`)
  return { real, contributor, folder }
}

async function main(argv: string[]) {
  const positional: string[] = []
  let jsonFile: string | undefined
  let identify = false
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!
    if (arg === '--identify') identify = true
    else if (arg === '--json-file')
      jsonFile = argv[++i] ?? fail('--json-file needs the path of a JSON file.')
    else if (arg.startsWith('--json-file='))
      jsonFile = arg.slice('--json-file='.length)
    else positional.push(arg)
  }
  const [first, tool, inline] = positional
  if (!first || first === 'help' || first === '--help') {
    const text = help(tool)
    return tool ? text : { usage: USAGE, ...text }
  }
  const { real, contributor, folder } = canvasFile(first)
  if (!tool)
    return fail(`Usage:\n  ${USAGE.join('\n  ')}\nTools: yarn canvas help`)
  const args = readArguments(inline, jsonFile)

  const text = readFileSync(real, 'utf8')
  let scene: ReturnType<typeof parseCanvas>
  try {
    scene = parseCanvas(text)
  } catch (error) {
    return fail(
      error instanceof SyntaxError
        ? `${first} isn't valid JSON: ${error.message}`
        : `${first} isn't a canvas: ${(error as Error).message}`,
    )
  }
  if (scene.tooNew)
    fail(
      `${first} was written by a newer version of the studio (canvas format ${FORMAT_VERSION} here). Update the studio before changing it.`,
    )

  // The studio around the canvas: its modules' file types and the manifest.
  const registry = await loadRegistry(ROOT)
  const types = await identityFileTypes(registry.enabled)
  const fileTypes = registry.enabled.flatMap(({ spec }) => spec.fileTypes ?? [])
  const unidentified = () => {
    const audit = auditIdentities(ROOT, types)
    const inside = (file: string) =>
      file === `${folder}/meta.json` || file.startsWith(`${folder}/`)
    return [
      ...audit.missing
        .filter(inside)
        .map((file) => file.slice(folder.length + 1)),
      ...audit.missingStates
        .filter(({ path: file }) => inside(file))
        .map(
          ({ path: file, title }) =>
            `${file.slice(folder.length + 1)} (state “${title}”)`,
        ),
    ]
  }
  const command = `yarn studio identify ${folder} --yes`
  let missing = unidentified()
  if (missing.length && identify) {
    console.error(
      `These files have no identity yet: ${missing.join(', ')}. Running: ${command}`,
    )
    // Its report goes to stderr, so stdout stays the tool's JSON result.
    const ran = spawnSync(
      process.execPath,
      ['tooling/studio/cli.ts', 'identify', folder, '--yes'],
      {
        cwd: ROOT,
        stdio: ['ignore', 2, 2],
      },
    )
    if (ran.status !== 0)
      fail(
        `${command} didn't finish. Fix what it reports, then run the tool again.`,
      )
    missing = unidentified()
  }
  if (missing.length)
    fail(
      `These files have no identity yet: ${missing.join(', ')}.\nRun: ${command}\nOr add --identify to run it and continue.`,
    )
  let systems: Awaited<ReturnType<typeof loadSystems>>['systems'] = []
  try {
    systems = (await loadSystems(ROOT, registry.config)).systems
  } catch {
    // A system that can't load is left out; a prototype using it says so below.
  }
  const built = buildManifest({ root: ROOT, systems, fileTypes: types })
  const prototype = built.manifest.prototypes.find(
    (each) => each.folder === folder,
  )
  if (!prototype) {
    const problems = built.problems.filter((problem) =>
      problem.startsWith(`${folder}/`),
    )
    return fail(
      [
        `This canvas's prototype isn't in the studio's manifest.`,
        ...problems.map((problem) => `  ${problem}`),
      ].join('\n'),
    )
  }

  const ctx = toolContext({
    prototype,
    artifacts: () => built.artifacts[prototype.id] ?? [],
    typeOf: (id) => {
      const type = fileTypes.find((each) => each.id === id)
      return (
        type && {
          label: type.label,
          preview:
            Boolean(type.embed) &&
            (type.embedIn ?? ['canvas']).includes('canvas'),
        }
      )
    },
  })

  let result
  try {
    result = run(scene.elements, tool, args, ctx)
  } catch (error) {
    if (error instanceof ToolError) return fail(error.message)
    throw error
  }
  if (READING.includes(tool)) return result.result

  // Changing a canvas needs its owner or an Admin, and an active prototype.
  const actor = session(ROOT, {})
  const refusal = permissionRefusal(
    actor.team,
    actor.contributors,
    actor.key,
    { kind: 'prototype', owner: contributor },
    'edit',
  )
  if (refusal === 'identity')
    fail(refusalMessage(refusal, { email: actor.identity.email }))
  if (refusal)
    fail('Only the prototype owner or an Admin can change this canvas.')
  if (prototype.status !== 'active')
    fail('Restore this prototype before changing its canvas.')
  // The file may have changed while the tool ran: never write over that.
  if (readFileSync(real, 'utf8') !== text)
    fail('The canvas changed. Read it again before applying this operation.')
  const next = stringifyScene(
    result.elements,
    { viewBackgroundColor: scene.background, gridSize: scene.gridSize },
    undefined,
    identity.read(text),
    // Pictures stay where they are: a tool moves images, never their bytes.
    scene.files,
  )
  const temporary = `${real}.${process.pid}.tmp`
  writeFileSync(temporary, next)
  renameSync(temporary, real)
  // A picture the canvas stopped showing goes, unless another canvas of the
  // prototype still shows it.
  const kept = parseCanvas(next).files
  if (Object.keys(scene.files).some((id) => !(id in kept)))
    pruneImages(path.join(ROOT, folder))
  return result.result
}

try {
  const result = await main(process.argv.slice(2))
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  if (!(error instanceof Stop)) throw error
  console.error(error.message)
  process.exitCode = 1
}
