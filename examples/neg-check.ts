// Negative test: each @ts-expect-error must be "used" (i.e. a real error occurs).
// If tsc passes, the types are BOTH correct (positive cases) AND strict
// (these bad cases really error). If an @ts-expect-error becomes unused,
// that line leaked `any`.
import { useEvent, useInvoke } from '@cc-heart/electron-use-ipc/renderer'
import { api } from './shared/api'

const { call } = useInvoke(api.invoke.getUser)
// @ts-expect-error number is not assignable to string
call(123)

const updated = useEvent(api.events['user:updated'])
// @ts-expect-error payload is User | undefined, not number
updated.subscribe((u: number) => {})
