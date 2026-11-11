// Bundle the runtime test suite, replacing `electron` with the in-memory mock.
// Uses the repository's existing `tsup` dependency — no extra package needed.
import { build } from 'tsup'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const mock = path.resolve('tests/electron-mock.ts')

await build({
  entry: ['tests/runtime.test.ts'],
  outDir: 'tests/.build',
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  bundle: true,
  splitting: false,
  dts: false,
  clean: true,
  sourcemap: false,
  silent: true,
  // `electron` is a peerDependency, so tsup would externalise it by default.
  // Bundle everything and let esbuild keep node: builtins external (with their
  // `node:` prefix intact — Node's test runner needs `node:test`).
  external: [],
  noExternal: [/.*/],
  outExtension: () => ({ js: '.mjs' }),
  esbuildOptions(options) {
    options.alias = { ...(options.alias ?? {}), electron: mock }
  },
})

// tsup strips the `node:` prefix from externalised builtins (`node:test`
// becomes `test`), which Node cannot resolve under `node --test`. Restore it
// for the builtins this suite imports.
const outFile = path.resolve('tests/.build/runtime.test.mjs')
let code = await readFile(outFile, 'utf8')
for (const name of ['test', 'assert/strict', 'assert']) {
  code = code.replaceAll(`from "${name}"`, `from "node:${name}"`)
}
await writeFile(outFile, code)
