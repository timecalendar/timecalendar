export type FetchContext = {
  signal?: AbortSignal
  onAttempt?: () => void
}
