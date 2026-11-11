export * from './core'
export type { UseInvokeResult } from './renderer'
export { invoke, useInvoke, useEvent, sendSync } from './renderer'

// `registerMain` and `exposeBridge` are intentionally NOT re-exported here.
// Both import `electron`; re-exporting them from the root entry pulls that
// dependency into renderer bundles. Import them from their subpath entries
// instead:
//
//   import { registerMain } from '@cc-heart/electron-use-ipc/main'
//   import { exposeBridge } from '@cc-heart/electron-use-ipc/preload'
//
// This was a breaking change (see CHANGELOG.md).
