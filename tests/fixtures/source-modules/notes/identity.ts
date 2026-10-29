import type { IdentityAdapter } from '../../../../tooling/modules/contract.ts'

// `<!-- @studio-id <id> -->` on the first line, as views have it.
const FIRST = /^<!-- @studio-id (\S+) -->/

export const identity: IdentityAdapter = {
  read: (source) => FIRST.exec(source)?.[1] ?? null,
  write: (source, id) => `<!-- @studio-id ${id} -->\n${source}`,
}
