// Reading a module's `prototypeFolder` name from the text of its
// `module.ts`. The scope check reads declarations from Git, at the revision
// before a change, where nothing can be imported; the registry refuses a
// declaration this can't read, so both always agree. No imports, so the
// checks can run it on their own.

/** A hidden folder: a dot, then lowercase letters, numbers and dashes. */
export const PROTOTYPE_FOLDER = /^\.[a-z0-9][a-z0-9-]*$/

const DECLARED =
  /\bprototypeFolder\s*:\s*\{[^{}]*?\bname\s*:\s*(['"])(\.[a-z0-9][a-z0-9-]*)\1/

/** The folder name `source` declares as a literal, or null. */
export function declaredPrototypeFolder(source: string): string | null {
  return DECLARED.exec(source)?.[2] ?? null
}
