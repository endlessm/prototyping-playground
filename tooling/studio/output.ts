/** A command stops with this one-line message and exit code 1. */
export class Refusal extends Error {}

/** Switches are `true`; repeatable options collect a list. */
export type Flags = Record<string, string | true | string[] | undefined>

export const say = (line = '') => console.log(line)

export const NOTHING_CHANGED =
  'Nothing was changed. To apply it, run the same command with --yes.'

/** Every command that changes modules ends with this line. */
export const RESTART =
  'Restart the dev server (yarn dev) for the studio to show the change.'
