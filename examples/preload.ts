import { exposeBridge } from '../src/preload'
import { api } from './shared/api'

// exposes window.api with the typed bridge
exposeBridge(api)
