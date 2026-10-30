// Package-manager steps inside studio commands (installing, refreshing the
// lockfile). A failure stops the command with one sentence, never a stack.
import { spawnSync } from 'node:child_process'
import { Refusal } from './output.ts'

/** Runs yarn as the command that launched this one did. */
export function yarn(
  root: string,
  args: string[],
  label = `yarn ${args.join(' ')}`,
) {
  // Tests hand in a stand-in script for yarn.
  const launcher = process.env.STUDIO_YARN || process.env.npm_execpath
  if (launcher) packageStep(root, label, process.execPath, [launcher, ...args])
  else packageStep(root, label, 'yarn', args)
}

export function packageStep(
  root: string,
  label: string,
  command: string,
  args: string[],
) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: command === 'yarn' && process.platform === 'win32',
    windowsHide: true,
  })
  if (result.status !== 0)
    throw new Refusal(
      `${label} failed${result.status === null ? '' : ` (exit code ${result.status})`}. Run ${label} yourself to see why, fix it, then run this command again.`,
    )
}
