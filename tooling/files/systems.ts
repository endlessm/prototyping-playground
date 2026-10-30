// What the Systems area's menus and New system dialog ask of the dev
// server: open a system's folder in a code editor or the file browser,
// create one, make one the default, and rename, archive, restore or delete
// one, each first checked (`<op>-check`: who it touches and whether another
// program holds its folder). Who may: any registered contributor reaches a
// system; Admins create, set the default, archive, restore and delete;
// Admins and the system's maintainers rename it. The plans are the studio
// command's (`../systems/lifecycle.ts`). Framework-neutral; the route
// (`server/systems.ts`) wraps it.
import { readFileSync, writeFileSync } from 'node:fs'
import { readContributors } from '../contributors/profiles.ts'
import {
  permissionRefusal,
  refusalMessage,
  roleOf,
  teamOf,
} from '../contributors/roles.ts'
import { editConfig } from '../settings/config-file.ts'
import {
  applyPlan,
  findSystem,
  heldFolders,
  holdOperation,
  LifecycleError,
  nameProblem,
  planCreate,
  planLifecycle,
  systemKey,
  type LifecycleOptions,
  type LifecyclePlan,
} from '../systems/lifecycle.ts'
import { defaultIdentify } from './source.ts'
import {
  fileBrowser,
  installedEditors,
  launchProgram,
  type Editor,
} from './tree.ts'

export interface SystemActionOptions {
  root: string
  systemsFolder: string
  prototypesFolder: string
  contributorsFolder: string
  configFile: string
  /** Who is working, from their Git identity. */
  identify?: ReturnType<typeof defaultIdentify>
  /** Refreshes the lockfile. */
  yarn?: (args: string[]) => void
  /**
   * Has the dev server's watchers let go of a folder before it moves;
   * resolves to how to watch it again.
   */
  release?: (dir: string) => Promise<() => Promise<void>>
  launch?: (command: string, args: string[]) => Promise<void>
  editors?: Editor[]
  platform?: NodeJS.Platform
}

export type SystemOperation =
  | 'open'
  | 'reveal'
  | 'create'
  | 'default'
  | 'rename'
  | 'archive'
  | 'restore'
  | 'delete'

const LIFECYCLE = new Set(['rename', 'archive', 'restore', 'delete'])

export function createSystemActions(options: SystemActionOptions) {
  const { root } = options
  const platform = options.platform ?? process.platform
  const launch = options.launch ?? launchProgram
  const lifecycle: LifecycleOptions = {
    root,
    systemsFolder: options.systemsFolder,
    prototypesFolder: options.prototypesFolder,
    configFile: options.configFile,
    yarn: options.yarn,
    // The dev server is this process: its own watchers let go first.
    describeHolder: () => null,
    platform,
  }
  const noRelease = async () => async () => {}
  const release = options.release ?? noRelease

  function who() {
    const { contributors } = readContributors(root, options.contributorsFolder)
    const config = JSON.parse(readFileSync(options.configFile, 'utf8'))
    const team = teamOf(config, contributors)
    const { key } = (options.identify ?? defaultIdentify(root))(contributors)
    return { contributors, team, key, role: roleOf(team, contributors, key) }
  }

  function allowed(op: string, system?: ReturnType<typeof findSystem>) {
    const { contributors, team, key, role } = who()
    if (!role)
      throw new LifecycleError(
        'Register as a contributor to use system actions.',
        403,
      )
    if (op === 'open' || op === 'reveal') return
    if (op === 'rename' && system) {
      const refusal = permissionRefusal(
        team,
        contributors,
        key,
        { kind: 'system', id: system.studioId, status: system.status },
        'rename',
      )
      if (refusal)
        throw new LifecycleError(
          refusalMessage(refusal, { system: system.label }),
          403,
        )
      return
    }
    if (role !== 'admin')
      throw new LifecycleError('Only an Admin can change shared systems.', 403)
  }

  async function reveal(dir: string) {
    if (platform === 'win32') return launch('explorer.exe', [dir])
    if (platform === 'darwin') return launch('/usr/bin/open', [dir])
    return launch('xdg-open', [dir])
  }

  /** The folders a plan moves, let go by the watchers while `run` runs. */
  async function released<T>(plan: LifecyclePlan, run: () => Promise<T>) {
    const folders = [plan.move?.from, plan.remove].filter(
      (folder): folder is string => Boolean(folder),
    )
    const again = await Promise.all(folders.map((folder) => release(folder)))
    try {
      return await run()
    } finally {
      for (const watch of again) await watch()
    }
  }

  function plan(op: string, request: Record<string, unknown>) {
    const system = findSystem(lifecycle, request.system)
    allowed(op, system)
    return planLifecycle(
      lifecycle,
      op as 'rename' | 'archive' | 'restore' | 'delete',
      system.key,
      {
        label: request.name,
        restorePrototypes: request.restorePrototypes === true,
      },
    )
  }

  return {
    async run(op: unknown, request: Record<string, unknown>) {
      if (op === 'create') {
        allowed('create')
        const name = typeof request.name === 'string' ? request.name.trim() : ''
        const problem = nameProblem(name)
        if (problem) throw new LifecycleError(problem)
        const created = planCreate(lifecycle, {
          key: systemKey(name),
          label: name,
        })
        try {
          await applyPlan(lifecycle, created)
        } catch (error) {
          if (error instanceof LifecycleError && error.status === 409)
            throw error
          throw new LifecycleError(
            `Could not create the system. ${(error as Error).message} Existing systems were preserved.`,
            500,
          )
        }
        return { key: created.key, studioId: created.studioId }
      }
      if (op === 'open' || op === 'reveal') {
        const system = findSystem(lifecycle, request.system)
        allowed(op)
        if (op === 'reveal') {
          await reveal(system.dir).catch(() => {
            throw new LifecycleError(
              `Couldn’t open ${fileBrowser(platform)}. Copy the system’s path instead.`,
              500,
            )
          })
          return {}
        }
        const editors = options.editors ?? installedEditors(platform)
        for (const editor of editors)
          try {
            await launch(editor.command, [...editor.args, system.dir])
            return { opened: true, editor: editor.name }
          } catch {
            // Try the next one.
          }
        await reveal(system.dir).catch(() => undefined)
        return {
          opened: false,
          message: `${editors.length ? 'Your code editor didn’t open' : 'No supported code editor is installed'}, so the folder is shown in ${fileBrowser(platform)}.`,
        }
      }
      if (op === 'default') {
        const system = findSystem(lifecycle, request.system)
        allowed('default')
        if (system.status !== 'active')
          throw new LifecycleError(
            'Restore this system before making it the default.',
            409,
          )
        const done = holdOperation(root)
        try {
          const source = readFileSync(options.configFile, 'utf8')
          writeFileSync(
            options.configFile,
            editConfig(
              source,
              { defaultSystem: system.studioId },
              options.configFile,
            ),
          )
        } finally {
          done()
        }
        return { studioId: system.studioId }
      }
      const name = String(op ?? '')
      const operation = name.endsWith('-check') ? name.slice(0, -6) : name
      if (!LIFECYCLE.has(operation))
        throw new LifecycleError('Unknown system action.')
      const planned = plan(operation, request)
      if (name.endsWith('-check'))
        return released(planned, async () => {
          const held = heldFolders(lifecycle, planned)
          if (held.length) throw new LifecycleError(held.join('\n'), 409)
          return {
            prototypes: planned.dependents.length,
            references: planned.references,
          }
        })
      return released(planned, () => applyPlan(lifecycle, planned))
    },
  }
}
