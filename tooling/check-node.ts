// Warns when the running Node doesn't match `engines.node`. Yarn 4 doesn't
// enforce engines, and a wrong Node mostly fails later in confusing ways.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

type Version = [number, number, number]

function parse(version: string): Version {
  const [major = 0, minor = 0, patch = 0] = version
    .replace(/^v/, '')
    .split('.')
    .map(Number)
  return [major, minor, patch]
}

function compare(a: Version, b: Version) {
  for (let index = 0; index < 3; index++) {
    if (a[index] !== b[index]) return a[index]! - b[index]!
  }
  return 0
}

// Supports space-separated comparators, such as `>=22.18.0 <23`.
function satisfies(version: string, range: string) {
  const current = parse(version)
  return range
    .trim()
    .split(/\s+/)
    .every((comparator) => {
      const [, operator = '', bound = ''] =
        comparator.match(/^(>=|<=|>|<|=)?(.+)$/) ?? []
      const order = compare(current, parse(bound))
      if (operator === '>=') return order >= 0
      if (operator === '>') return order > 0
      if (operator === '<=') return order <= 0
      if (operator === '<') return order < 0
      return order === 0
    })
}

export function nodeVersionWarning(version: string, range: string) {
  if (satisfies(version, range)) return undefined
  return `Node ${version} is running, but this studio expects Node ${range}. Run commands through mise (\`mise exec -- yarn ...\`) or install the version in mise.toml.`
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { engines } = JSON.parse(readFileSync('package.json', 'utf8'))
  const warning = nodeVersionWarning(process.version, engines.node)
  if (warning) console.warn(`Warning: ${warning}`)
}
