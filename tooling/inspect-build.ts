// Reports the built site's startup weight and checks that every file the build
// references exists, without a browser or a host.
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { basePathFromEnv } from './deployment.ts'

interface Asset {
  file: string
  bytes: number
  gzipBytes: number
}

function filesIn(directory: string, root = directory): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) return filesIn(file, root)
    return [path.relative(root, file).split(path.sep).join('/')]
  })
}

function attribute(tag: string, name: string) {
  return tag.match(new RegExp(`\\s${name}=["']([^"']*)["']`))?.[1]
}

// HTML references, split into what the page loads at startup and the rest.
function htmlReferences(html: string) {
  const initial: string[] = []
  const other: string[] = []
  for (const [tag] of html.matchAll(/<(?:script|link)\b[^>]*>/g)) {
    const src = attribute(tag, 'src')
    if (src) {
      ;(attribute(tag, 'type') === 'module' ? initial : other).push(src)
      continue
    }
    const href = attribute(tag, 'href')
    const rel = attribute(tag, 'rel') ?? ''
    if (!href || ['preconnect', 'dns-prefetch', 'canonical'].includes(rel))
      continue
    ;(['stylesheet', 'modulepreload'].includes(rel) ? initial : other).push(
      href,
    )
  }
  const importMap = html.match(
    /<script type="importmap">([\s\S]*?)<\/script>/,
  )?.[1]
  const imports: Record<string, string> = importMap
    ? JSON.parse(importMap).imports
    : {}
  return { initial, other, imports }
}

function scriptReferences(code: string) {
  const imports = [
    ...code.matchAll(/(?:\bfrom|\bimport)\s*["'`]([^"'`]+)["'`]/g),
  ].map((match) => match[1]!)
  const lazy = [
    ...code.matchAll(/\bimport\(\s*["'`]([^"'`]+)["'`]\s*\)/g),
    // Vite's preload dependency lists: items of an array, unlike the keys
    // and require calls of a bundled library's own module map (Mermaid's ELK).
    ...code.matchAll(
      /["'`](\.\.?\/[^"'`\s]+\.(?:js|mjs|css))["'`](?=\s*[,\]])/g,
    ),
  ]
    .map((match) => match[1]!)
    // A bundled dependency's module names from its own build, such as
    // esbuild's CommonJS wrappers in Excalidraw, are paths into
    // `node_modules`; a build never emits one.
    .filter((reference) => !reference.includes('/node_modules/'))
  return { imports, lazy }
}

function styleReferences(css: string) {
  return [...css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)]
    .map((match) => match[1]!)
    .filter((url) => !/^(data:|#)/.test(url))
}

export function inspectBuild(directory: string, basePath = '/') {
  const root = path.resolve(directory)
  const files = new Set(filesIn(root))
  const missing: string[] = []
  const html = readFileSync(path.join(root, 'index.html'), 'utf8')
  const { imports: importMap } = htmlReferences(html)

  // The site-relative file a reference points to, or nothing when it points
  // outside the site (another host, or a bare package name).
  function resolve(reference: string, from: string) {
    const target = importMap[reference] ?? reference
    if (/^[a-z][a-z\d+.-]*:/i.test(target) || target.startsWith('//')) return
    let relative: string
    if (target.startsWith('/')) {
      if (!target.startsWith(basePath)) return
      relative = target.slice(basePath.length)
    } else if (target.startsWith('.')) {
      relative = path.posix.join(path.posix.dirname(from), target)
    } else return
    relative = path.posix.normalize(relative.split(/[?#]/)[0]!)
    if (relative.startsWith('..'))
      throw new Error(`${reference} in ${from} escapes the build.`)
    return relative
  }

  function check(reference: string, from: string) {
    const file = resolve(reference, from)
    if (file && !files.has(file))
      missing.push(`${file} (referenced by ${from})`)
    return file
  }

  const staticImports = new Map<string, string[]>()
  for (const file of files) {
    if (file.endsWith('.html')) {
      const references = htmlReferences(
        readFileSync(path.join(root, file), 'utf8'),
      )
      for (const reference of [...references.initial, ...references.other])
        check(reference, file)
    } else if (/\.m?js$/.test(file)) {
      const { imports, lazy } = scriptReferences(
        readFileSync(path.join(root, file), 'utf8'),
      )
      staticImports.set(
        file,
        imports
          .map((reference) => check(reference, file))
          .filter((target) => target !== undefined),
      )
      for (const reference of lazy) check(reference, file)
    } else if (file.endsWith('.css')) {
      for (const reference of styleReferences(
        readFileSync(path.join(root, file), 'utf8'),
      ))
        check(reference, file)
    }
  }
  if (missing.length)
    throw new Error(
      `Missing build files:\n  ${[...new Set(missing)].join('\n  ')}`,
    )

  const initial = new Set<string>()
  function visit(file: string) {
    if (initial.has(file)) return
    initial.add(file)
    for (const dependency of staticImports.get(file) ?? []) visit(dependency)
  }
  for (const reference of htmlReferences(html).initial) {
    const file = resolve(reference, 'index.html')
    if (file) visit(file)
  }

  const assets: Asset[] = [...initial].map((file) => {
    const content = readFileSync(path.join(root, file))
    return { file, bytes: content.length, gzipBytes: gzipSync(content).length }
  })
  return {
    requests: assets.length,
    bytes: assets.reduce((sum, asset) => sum + asset.bytes, 0),
    gzipBytes: assets.reduce((sum, asset) => sum + asset.gzipBytes, 0),
    assets,
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const directory = path.resolve(process.argv[2] || '.output/public')
  if (!existsSync(path.join(directory, 'index.html'))) {
    console.error(
      `There is no built site in ${directory}. Run \`yarn build\` first.`,
    )
    process.exit(1)
  }
  try {
    const result = inspectBuild(directory, basePathFromEnv(process.env))
    const kib = (bytes: number) => (bytes / 1024).toFixed(1)
    console.log(
      `Initial JavaScript/CSS: ${result.requests} files, ${kib(result.bytes)} KiB raw, ${kib(result.gzipBytes)} KiB gzip. All emitted file references exist.`,
    )
  } catch (error) {
    console.error((error as Error).message)
    process.exit(1)
  }
}
