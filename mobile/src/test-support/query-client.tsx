import {
  QueryClient,
  type QueryClientConfig,
  QueryClientProvider,
} from "@tanstack/react-query"
import type { PropsWithChildren, ReactElement } from "react"

export type TestQueryClient = {
  client: QueryClient
  wrapper: ({ children }: PropsWithChildren) => ReactElement
  clear: () => void
}

/** Owns a timer-free QueryClient for one test and its mounted provider. */
export function createTestQueryClient(
  config: QueryClientConfig = {},
): TestQueryClient {
  const client = new QueryClient({
    ...config,
    defaultOptions: {
      ...config.defaultOptions,
      queries: {
        retry: false,
        gcTime: Infinity,
        ...config.defaultOptions?.queries,
      },
      mutations: {
        retry: false,
        gcTime: Infinity,
        ...config.defaultOptions?.mutations,
      },
    },
  })

  function TestQueryClientProvider({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }

  return {
    client,
    wrapper: TestQueryClientProvider,
    clear: () => client.clear(),
  }
}
