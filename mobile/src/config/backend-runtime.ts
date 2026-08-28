let backendRuntimeReady = true
const listeners = new Set<() => void>()

export function isBackendRuntimeReady(): boolean {
  return backendRuntimeReady
}

export function setBackendRuntimeReady(ready: boolean): void {
  if (backendRuntimeReady === ready) return
  backendRuntimeReady = ready
  for (const listener of listeners) listener()
}

export function subscribeBackendRuntimeReady(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
