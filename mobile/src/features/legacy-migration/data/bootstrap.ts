export function createBootstrapStage(
  operation: () => Promise<unknown>,
): () => Promise<void> {
  let promise: Promise<void> | undefined
  return () => {
    promise ??= operation().then(() => undefined)
    return promise
  }
}
