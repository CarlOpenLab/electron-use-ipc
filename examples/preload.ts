import { exposeBridge } from '@cc-heart/electron-use-ipc/preload'
import { api } from './shared/api'

// exposes window.api with the typed bridge
exposeBridge(api)
