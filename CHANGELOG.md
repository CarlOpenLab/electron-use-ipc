# Changelog

All notable changes to this project are documented here. This project follows
[Semantic Versioning](https://semver.org/).

## [0.0.2] - 2026-11-12

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
- **Registration is atomic and process-wide.** A failed `registerMain` now
  rolls back every handler and listener it already installed; previously a
  leaked `ipcMain.handle` made any retry fail with "Attempted to register a
  second handler". Duplicate detection is process-wide instead of per-call, so
  a second `registerMain` can no longer attach another `ipcMain.on` listener
  and silently overwrite `event.returnValue`. Fallback listeners yield to a
  real handler installed by a later call, and the startup warning no longer
  reports methods already served by another call.
- **`window.api.sendSync` keeps its declared return type.** The error envelope
  is an internal transport detail and no longer widens the public `Bridge`
  signature to `R | IpcErrorEnvelope`; `sendSync()` widens to `unknown` and
  unwraps internally. Envelopes now carry a private discriminator plus `name`
  and the main-process `stack`, instead of only a message, so user data cannot
  be mistaken for an error and the original stack survives the trip.
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
- `test:runtime`: 13 `node:test` cases against a lightweight `ipcMain` /
  `ipcRenderer` mock, covering all six handler groups, error propagation,
  duplicate registration, atomic rollback after a failed registration,
  process-wide channel ownership, `emit` / `emitTo` and `dispose`.
- `test:negative`, `test` and an expanded `prepublishOnly`.
