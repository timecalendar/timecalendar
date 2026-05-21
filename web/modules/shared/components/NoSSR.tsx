import { useSyncExternalStore } from "react"

interface NoSSRProps {
  children: React.ReactNode
}

const emptySubscribe = () => () => {}

/**
 * Component that prevents server-side rendering of its children.
 * Useful for components that rely on browser-only APIs or cause hydration mismatches.
 */
export function NoSSR({ children }: NoSSRProps) {
  // `useSyncExternalStore` returns the server snapshot (`false`) during SSR and
  // the first hydration render, then the client snapshot (`true`) afterwards —
  // giving us client-only rendering without a setState-in-effect cascade.
  const hasMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )

  if (!hasMounted) {
    return null
  }

  return <>{children}</>
}
