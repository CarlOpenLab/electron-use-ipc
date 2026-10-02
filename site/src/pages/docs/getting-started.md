# Getting started

`electron-use-ipc` replaces string channel names and hand-written IPC types with a
single contract that all three processes infer from.

```bash
pnpm add @cc-heart/electron-use-ipc
```

## The four files

Every integration has the same shape. A shared contract, then one file per process.

### 1. The contract — shared

This is the only place your IPC surface is described. Note that `shared/api.ts`
imports nothing from Electron, so it is safe to use from the renderer.

<CodeBlock name="api" />

### 2. The main process

Handlers are typed by the token they are registered against — arguments and return
values are not annotated here.

<CodeBlock name="main" />

### 3. Preload

`exposeBridge` publishes the bridge on `window.api` through `contextBridge`. It
forwards tokens without needing to know what they mean.

<CodeBlock name="preload" />

### 4. Renderer

`useInvoke` and `useEvent` return signals: `data`, `error` and `loading` for a call,
and the latest payload for an event.

<CodeBlock name="renderer" />

## Requirements

| | |
|---|---|
| Electron | `>= 20` |
| TypeScript | `>= 5.0` |
| Module format | ESM only |

The package ships ESM with no `require` condition, so it must be consumed from an
ESM context. In an Electron app that means `"type": "module"` in your `package.json`,
or a bundler that emits ESM for the main process.

`contextIsolation` must be on (the default). The bridge is published with
`contextBridge.exposeInMainWorld`, so `nodeIntegration` is never required.

## Next

Work through the architecture in order — the contract, then each process that infers
from it:

1. [The shared contract](/docs/shared-contract)
2. [Main process](/docs/main-process)
3. [Preload bridge](/docs/preload-bridge)
4. [Renderer hooks](/docs/renderer-hooks)
