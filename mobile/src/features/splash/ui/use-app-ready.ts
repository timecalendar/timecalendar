// The root mounts this visual handoff only after schema, environment recovery,
// and legacy migration settle. No timeout may release those prerequisites.
export function useAppReady(isReady: () => boolean = () => true): boolean {
  return isReady()
}
