// Values written as literals in a component's code: a prop's default in
// `withDefaults`, or a bound attribute in an example (`:size="2"`). Pure,
// so the Lab reads them in the browser and the catalog on Node.

export type LiteralValue = string | number | boolean

export const STRING_LITERAL = /^"((?:[^"\\]|\\.)*)"$/
const SINGLE_LITERAL = /^'((?:[^'\\]|\\.)*)'$/
export const NUMBER_LITERAL = /^-?\d+(\.\d+)?$/

/** A value written as a literal, or undefined for anything computed. */
export function literalValue(text: string | null): LiteralValue | undefined {
  const value = text?.trim()
  if (!value) return undefined
  if (value === 'true') return true
  if (value === 'false') return false
  if (NUMBER_LITERAL.test(value)) return Number(value)
  if (STRING_LITERAL.test(value)) return JSON.parse(value) as string
  const single = SINGLE_LITERAL.exec(value)
  if (single) return single[1]!.replace(/\\(.)/g, '$1')
  return undefined
}
