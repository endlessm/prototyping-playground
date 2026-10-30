import path from 'node:path'
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import ts from 'typescript'
import { parse } from 'vue/compiler-sfc'
import type { Plugin } from 'vite'
import type { InstalledSystem } from '../systems/registry.ts'

export interface ImportPolicy {
  root: string
  prototypesDir: string
  system: InstalledSystem | null
  modules: { id: string; dir: string; library: string }[]
}

const within = (file: string, dir: string) => {
  const relative = path.relative(dir, file)
  return (
    relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))
  )
}
const canonical = (file: string): string => {
  try {
    return realpathSync(file)
  } catch {
    const parent = path.dirname(path.resolve(file))
    return parent === path.resolve(file)
      ? parent
      : path.join(canonical(parent), path.basename(file))
  }
}

export function sourceProblems(
  source: string,
  file: string,
  policy: ImportPolicy,
): string[] {
  const prototypeCode = within(file, policy.prototypesDir)
  const systemCode = Boolean(policy.system && within(file, policy.system.dir))
  if (!prototypeCode && !systemCode) return []
  const parts = path.relative(policy.prototypesDir, file).split(path.sep)
  if (parts.length < 3) return []
  const own = prototypeCode
    ? path.join(policy.prototypesDir, ...parts.slice(0, 2))
    : policy.system!.dir
  const problems: string[] = []
  const report = (
    message: string,
    location?: { line: number; column: number },
  ) =>
    problems.push(
      `${path.relative(policy.root, file).split(path.sep).join('/')}:${location ? `${location.line}:${location.column}:` : ''} ${message}`,
    )
  const allowed = (specifier: string) => {
    const name = specifier.split('?')[0]!
    if (name === 'vue' || name === '#studio/prototype') return true
    if (systemCode && policy.system) {
      const pkg = path.join(policy.system.dir, 'package.json')
      const dependencies = existsSync(pkg)
        ? (JSON.parse(readFileSync(pkg, 'utf8')).dependencies ?? {})
        : {}
      if (
        Object.keys(dependencies).some(
          (dependency) =>
            name === dependency || name.startsWith(dependency + '/'),
        )
      )
        return true
    }
    if (
      policy.system?.spec.libraries.some(
        (library) =>
          name === library.package || name.startsWith(library.package + '/'),
      )
    )
      return true
    if (policy.system?.spec.app.aliases?.[name]) return true
    if (name.startsWith('~/') && policy.system?.spec.app.source)
      return within(
        canonical(
          path.resolve(
            policy.system.dir,
            policy.system.spec.app.source,
            name.slice(2),
          ),
        ),
        canonical(policy.system.dir),
      )
    const module = policy.modules.find(
      (entry) =>
        name === `@module/${entry.id}` ||
        name.startsWith(`@module/${entry.id}/`),
    )
    if (module) {
      const library = path.resolve(module.dir, module.library)
      const suffix = name
        .slice(`@module/${module.id}`.length)
        .replace(/^\//, '')
      return within(
        canonical(path.resolve(library, suffix)),
        canonical(library),
      )
    }
    if (!name.startsWith('.') && !path.isAbsolute(name)) return false
    const target = canonical(path.resolve(path.dirname(file), name))
    return (
      within(target, canonical(own)) ||
      Boolean(policy.system && within(target, canonical(policy.system.dir)))
    )
  }
  const scripts: string[] = []
  if (file.endsWith('.css')) {
    if (prototypeCode && /:global\s*\(|@(?:import|reference)\b/.test(source))
      report('CSS must stay scoped. Remove :global and stylesheet imports.')
    for (const match of source.matchAll(/url\(\s*["']?([^)'"\s]+)/g))
      if (!match[1]!.startsWith('data:') && !allowed(match[1]!))
        report(
          `Forbidden asset "${match[1]}". Import an asset inside this prototype.`,
        )
    return problems
  }
  if (file.endsWith('.vue')) {
    const { descriptor, errors } = parse(source)
    for (const error of errors)
      report(
        `${typeof error === 'string' ? error : error.message} Fix the single-file component syntax.`,
        typeof error === 'string' ? undefined : error.loc?.start,
      )
    for (const block of [descriptor.script, descriptor.scriptSetup]) {
      if (block?.src && !allowed(block.src))
        report(
          `Forbidden script source "${block.src}". Use files inside this prototype.`,
        )
      if (block) scripts.push(block.content)
    }
    for (const style of descriptor.styles) {
      for (const match of style.content.matchAll(/url\(\s*["']?([^)'"\s]+)/g))
        if (!match[1]!.startsWith('data:') && !allowed(match[1]!))
          report(
            `Forbidden asset "${match[1]}". Import an asset inside this prototype.`,
          )
      if (prototypeCode && !style.scoped && !style.module)
        report(
          'Styles must be scoped or module CSS. Add scoped to the style block.',
        )
      if (style.src && !allowed(style.src))
        report(
          'Style source escapes this prototype. Move it inside the prototype.',
        )
      if (
        prototypeCode &&
        /:global\s*\(|@(?:import|reference)\b/.test(style.content)
      )
        report(
          'Styles may not escape their scope. Remove :global and CSS imports.',
        )
    }
    if (
      prototypeCode &&
      /\b(?:src|poster)\s*=\s*["']\/(?!\/)/.test(
        descriptor.template?.content ?? '',
      )
    )
      report(
        'Import local assets from this prototype instead of using public paths.',
      )
  } else scripts.push(source)
  for (const script of scripts) {
    const ast = ts.createSourceFile(
      file + '.ts',
      script,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    )
    const visit = (node: ts.Node) => {
      let specifier: ts.Node | undefined
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
        specifier = node.moduleSpecifier
      if (
        ts.isCallExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          node.expression.getText(ast) === 'require')
      )
        specifier = node.arguments[0]
      if (specifier) {
        if (!ts.isStringLiteralLike(specifier))
          report(
            'Computed imports cannot be checked. Use a literal import path.',
          )
        else if (!allowed(specifier.text))
          report(
            `Forbidden import "${specifier.text}". Use this prototype, its assigned system, #studio/prototype or an enabled @module library.`,
          )
        else if (
          prototypeCode &&
          /\.(?:css|scss|sass|less)(?:\?|$)/.test(specifier.text) &&
          !/\.module\./.test(specifier.text)
        )
          report(
            'Global CSS imports are forbidden. Use a scoped style block or .module.css.',
          )
      }
      ts.forEachChild(node, visit)
    }
    visit(ast)
  }
  return problems
}

export function importGuard(policy: ImportPolicy): Plugin {
  return {
    name: 'studio-import-guard',
    enforce: 'pre',
    transform(source, id) {
      if (id.includes('?') || !/\.(vue|css|[cm]?[jt]s)$/.test(id)) return
      const problems = sourceProblems(source, id, policy)
      if (problems.length) this.error(problems.join('\n'))
    },
    async resolveId(id) {
      const module = policy.modules.find(
        (entry) =>
          id === `@module/${entry.id}` || id.startsWith(`@module/${entry.id}/`),
      )
      if (module)
        return this.resolve(
          path.resolve(
            module.dir,
            module.library,
            id.slice(`@module/${module.id}`.length).replace(/^\//, '') ||
              'index.ts',
          ),
          undefined,
          { skipSelf: true },
        )
    },
  }
}
