/**
 * Measures the *built* library in `dist/` so the landing page's spec bar shows
 * real numbers that can never drift from the code they describe.
 *
 * Nothing here imports the library — `dist/index.js` statically imports
 * `electron`, so it must never reach a browser bundle. We only ever read bytes
 * off disk.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'

/** The five published entry points, in `package.json#exports` order. */
const ENTRIES = ['index', 'core/index', 'main/index', 'preload/index', 'renderer/index'] as const

export interface MetricsFile {
  path: string
  raw: number
  gzip: number
  brotli: number
}

export interface Metrics {
  available: boolean
  version: string
  runtimeDeps: number
  peerDeps: number
  electronPeer: string
  /** Runtime exports of the root entry, parsed from the built `export {}`. */
  exportCount: number
  /** Exact packed size, from `npm pack --dry-run`. `null` if npm is unavailable. */
  packed: { unpackedSize: number; fileCount: number } | null
  files: MetricsFile[]
  renderer: MetricsFile | null
  totals: { raw: number; gzip: number; brotli: number }
}

function compress(file: string) {
  const buf = readFileSync(file)
  return {
    raw: buf.length,
    gzip: gzipSync(buf, { level: 9 }).length,
    brotli: brotliCompressSync(buf, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).length,
  }
}

/**
 * Counts the runtime exports of the root entry by parsing its built
 * `export { ... }` statement. Reading `index.d.ts` would not work: type-only
 * exports are indistinguishable from values there.
 */
function countExports(js: string): number {
  const statements = [...js.matchAll(/export\s*\{([^}]*)\}/g)]
  const last = statements.at(-1)
  if (!last?.[1]) return 0
  const names = new Set(
    last[1]
      .split(',')
      .map((entry) => entry.trim().split(/\s+as\s+/).pop()?.trim())
      .filter((name): name is string => Boolean(name)),
  )
  return names.size
}

/** `npm pack --dry-run` is exact and local (~0.5s); never let it break a build. */
function packSize(repoRoot: string): Metrics['packed'] {
  try {
    const out = execFileSync('npm', ['pack', '--dry-run', '--json'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    const parsed = JSON.parse(out) as Array<{ unpackedSize: number; files: unknown[] }>
    const first = parsed[0]
    if (!first) return null
    return { unpackedSize: first.unpackedSize, fileCount: first.files.length }
  } catch {
    return null
  }
}

export function measure(repoRoot: string): Metrics {
  const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')) as {
    version: string
    dependencies?: Record<string, string>
    peerDependencies?: Record<string, string>
  }

  const base = {
    version: pkg.version,
    runtimeDeps: Object.keys(pkg.dependencies ?? {}).length,
    peerDeps: Object.keys(pkg.peerDependencies ?? {}).length,
    electronPeer: pkg.peerDependencies?.electron ?? '',
    packed: packSize(repoRoot),
  }

  const rootEntry = join(repoRoot, 'dist/index.js')
  if (!existsSync(rootEntry)) {
    return {
      ...base,
      available: false,
      exportCount: 0,
      files: [],
      renderer: null,
      totals: { raw: 0, gzip: 0, brotli: 0 },
    }
  }

  const files: MetricsFile[] = []
  for (const entry of ENTRIES) {
    const abs = join(repoRoot, 'dist', `${entry}.js`)
    if (!existsSync(abs)) continue
    files.push({ path: `dist/${entry}.js`, ...compress(abs) })
  }

  const totals = files.reduce(
    (acc, f) => ({
      raw: acc.raw + f.raw,
      gzip: acc.gzip + f.gzip,
      brotli: acc.brotli + f.brotli,
    }),
    { raw: 0, gzip: 0, brotli: 0 },
  )

  return {
    ...base,
    available: true,
    exportCount: countExports(readFileSync(rootEntry, 'utf8')),
    files,
    renderer: files.find((f) => f.path.endsWith('renderer/index.js')) ?? null,
    totals,
  }
}
