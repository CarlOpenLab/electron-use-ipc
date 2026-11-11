# Changelog

All notable changes to this project are documented here. This project follows
[Semantic Versioning](https://semver.org/).

## [Unreleased]

Fixes following the review of #2 (merged in `34bf4847`).

### Fixed

- **Type safety regression in `defineApi`.** It returned `S & ApiSchema`, whose
  `Record<string, InvokeToken<any, any>>` index signature made misspelled keys
  such as `api.invoke.getUesr` type-check as `InvokeToken<any, any>`. It now
  returns `FilledApi<S>`, which fills omitted groups with `{}` while preserving
  the exact literal keys of the groups that were supplied. Misspelled keys and
  misspelled handler names are compile errors again.
- **`Signal<T>` is sound again.** `get()` returns `T` (not `T | undefined` for
  every signal), `subscribe` receives `T`, and functional updates such as
  `signal(0).set(p => p + 1)` work. Signals that start empty are explicitly
  typed `Signal<T | undefined>`; `useEvent` returns `Signal<P | undefined>`.
- **`sendSync` no longer hangs the renderer on a thrown handler.** The main
  process listener now always writes `event.returnValue`, using a
  structured-clone-safe error envelope on failure; `sendSync()` in the renderer
  rethrows it as an `Error`.
- **`registerMain` fails loudly on bad registrations.** Registering the same
  method in two handler groups, or a handler name that is not in the schema,
  now throws at startup. Methods with no handler produce a `console.warn`
  instead of failing only when a renderer calls them.
- **README examples compile.** Fixed a stray semicolon inside an object
  literal, replaced the non-existent `api.sendSync.getWindowTitle(69)` call with
  real `invoke()` / `sendSync()` usage, refreshed the API table (`emitTo`,
  `useEvent` return type) and fixed typos.

### Changed (breaking)

- The package root no longer re-exports `registerMain` and `exposeBridge`.
  They both import `electron`, and re-exporting them from the root entry pulls
  that dependency into renderer bundles. **Migration:**
  ```diff
  - import { registerMain } from '@cc-heart/electron-use-ipc'
  + import { registerMain } from '@cc-heart/electron-use-ipc/main'

  - import { exposeBridge } from '@cc-heart/electron-use-ipc'
  + import { exposeBridge } from '@cc-heart/electron-use-ipc/preload'
  ```
  The subpath entries already exist and are the documented import paths.

### Added

- `FilledApi`, `IpcErrorEnvelope`, `isIpcErrorEnvelope` and
  `toIpcErrorEnvelope` exports from `./core`.
- `examples/neg-check.ts` now also covers misspelled schema keys / handler
  names and async `sendSync` handlers.
- `test:runtime`: `node:test` suite against a lightweight `ipcMain` /
  `ipcRenderer` mock, covering all six handler groups, error propagation,
  duplicate registration, `emit` / `emitTo` and `dispose`.
- `test:negative`, `test` and an expanded `prepublishOnly`.
