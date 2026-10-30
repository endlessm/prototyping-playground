import { readFileSync, writeFileSync } from 'node:fs'

interface Value {
  keyStart?: number
  start: number
  end: number
  children?: Map<string, Value>
}

// Parse strict JSON first; the second pass keeps source ranges for surgical
// edits and rejects repeated keys, which JSON.parse silently accepts.
export function parseConfig(source: string, file: string) {
  try {
    const config = JSON.parse(source)
    let i = 0
    const space = () => {
      while (/\s/.test(source[i] ?? '') && i < source.length) i++
    }
    const string = () => {
      const start = i++
      while (i < source.length) {
        if (source[i++] === '"') break
        if (source[i - 1] === '\\') i++
      }
      return JSON.parse(source.slice(start, i)) as string
    }
    const value = (): Value => {
      space()
      const start = i
      let children: Map<string, Value> | undefined
      if (source[i] === '{') {
        children = new Map()
        i++
        space()
        while (source[i] !== '}') {
          space()
          const keyStart = i
          const key = string()
          if (children.has(key)) throw new Error(`Repeated key "${key}"`)
          space()
          i++
          children.set(key, { ...value(), keyStart })
          space()
          if (source[i] !== ',') break
          i++
        }
        i++
      } else if (source[i] === '[') {
        i++
        space()
        while (source[i] !== ']') {
          value()
          space()
          if (source[i] !== ',') break
          i++
        }
        i++
      } else if (source[i] === '"') string()
      else while (i < source.length && !/[\s,}\]]/.test(source[i]!)) i++
      return { start, end: i, children }
    }
    const tree = value()
    if (!tree.children) throw new Error('Expected an object')
    return { config, tree }
  } catch (error) {
    throw new Error(`${file}: ${(error as Error).message}`, { cause: error })
  }
}

export function editConfig(
  source: string,
  changes: Record<string, unknown>,
  file: string,
) {
  const { config, tree } = parseConfig(source, file)
  const edits: { start: number; end: number; text: string }[] = []
  const additions: [string, unknown][] = []
  for (const [key, next] of Object.entries(changes)) {
    if (JSON.stringify(config[key]) === JSON.stringify(next)) continue
    const node = tree.children!.get(key)
    if (node) {
      if (
        node.children &&
        next &&
        typeof next === 'object' &&
        !Array.isArray(next)
      ) {
        let original = source.slice(node.start, node.end)
        for (const key of node.children.keys()) {
          if (Object.hasOwn(next, key)) continue
          const entries = [
            ...parseConfig(original, file).tree.children!.entries(),
          ]
          const index = entries.findIndex(([name]) => name === key)
          const target = entries[index]![1]
          const following = entries[index + 1]?.[1]
          const previous = entries[index - 1]?.[1]
          const start = following || !previous ? target.keyStart! : previous.end
          const end = following ? following.keyStart! : target.end
          original = original.slice(0, start) + original.slice(end)
        }
        edits.push({
          start: node.start,
          end: node.end,
          text: editConfig(original, next as Record<string, unknown>, file),
        })
        continue
      }
      const indent =
        source
          .slice(source.lastIndexOf('\n', node.start) + 1, node.start)
          .match(/^\s*/)?.[0] ?? ''
      const newline = source.includes('\r\n') ? '\r\n' : '\n'
      edits.push({
        start: node.start,
        end: node.end,
        text: JSON.stringify(next, null, 2).replaceAll('\n', newline + indent),
      })
    } else {
      additions.push([key, next])
    }
  }
  if (additions.length) {
    const newline = source.includes('\r\n') ? '\r\n' : '\n'
    const last = [...tree.children!.values()].at(-1)
    const end = last?.end ?? tree.start + 1
    const text = additions
      .map(
        ([key, value]) =>
          `  ${JSON.stringify(key)}: ${JSON.stringify(value, null, 2).replaceAll('\n', newline + '  ')}`,
      )
      .join(',' + newline)
    edits.push({
      start: end,
      end,
      text: `${last ? ',' : ''}${newline}${text}${last ? '' : newline}`,
    })
  }
  for (const edit of edits.sort((a, b) => b.start - a.start))
    source = source.slice(0, edit.start) + edit.text + source.slice(edit.end)
  return source
}

export function writeConfigChanges(
  file: string,
  changes: Record<string, unknown>,
) {
  const before = readFileSync(file, 'utf8')
  const after = editConfig(before, changes, file)
  if (after !== before) writeFileSync(file, after)
}
